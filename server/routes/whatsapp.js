import { Router } from 'express';
import { config } from '../config.js';
import { query } from '../db.js';
import { firmaValida, enviarTexto, marcarLeido } from '../whatsapp/meta.js';
import { descifrar } from '../whatsapp/crypto.js';
import { decidirRespuesta } from '../whatsapp/motor.js';

export const whatsappRouter = Router();

// --- Verificacion del webhook (Meta llama una vez al guardar la URL en el panel) ---
whatsappRouter.get('/webhook', (req, res) => {
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
  if (mode === 'subscribe' && config.meta.verifyToken && token === config.meta.verifyToken) {
    return res.status(200).type('text/plain').send(String(challenge));
  }
  res.sendStatus(403);
});

// --- Mensajes entrantes ---
whatsappRouter.post('/webhook', (req, res) => {
  const firmado = firmaValida(req.rawBody, req.get('x-hub-signature-256'));
  const sinSecreto = !config.meta.appSecret && config.nodeEnv !== 'production';
  if (!firmado && !sinSecreto) return res.sendStatus(401);
  if (sinSecreto) console.warn('[wa] META_APP_SECRET no configurado: firma NO verificada (solo desarrollo)');

  // Meta exige 200 rapido; se procesa despues para no provocar reintentos.
  res.sendStatus(200);
  procesar(req.body).catch((e) => console.error('[wa] error procesando webhook:', e));
});

const tokenDe = (negocio) =>
  negocio.wa_token_enc ? descifrar(negocio.wa_token_enc) : config.meta.accessToken;

async function procesar(body) {
  if (body?.object !== 'whatsapp_business_account') return;
  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field !== 'messages') continue;
      const value = change.value || {};
      const phoneNumberId = value.metadata?.phone_number_id;
      if (!phoneNumberId || !value.messages?.length) continue; // p. ej. solo "statuses"

      const { rows } = await query(
        'SELECT * FROM negocios WHERE wa_phone_number_id = $1 AND activo = true',
        [phoneNumberId],
      );
      const negocio = rows[0];
      if (!negocio) {
        console.warn(`[wa] numero ${phoneNumberId} sin negocio asignado`);
        continue;
      }
      for (const msg of value.messages) {
        const nombre = value.contacts?.find((c) => c.wa_id === msg.from)?.profile?.name || null;
        await atenderMensaje(negocio, phoneNumberId, msg, nombre);
      }
    }
  }
}

async function atenderMensaje(negocio, phoneNumberId, msg, nombreContacto) {
  const telefono = msg.from;
  const cuerpo = msg.type === 'text' ? msg.text?.body || '' : '';

  // Idempotencia: Meta puede reenviar el mismo webhook.
  const ins = await query(
    `INSERT INTO wa_mensajes (negocio_id, wamid, telefono, direccion, cuerpo)
     VALUES ($1,$2,$3,'in',$4) ON CONFLICT (wamid) DO NOTHING RETURNING id`,
    [negocio.id, msg.id, telefono, cuerpo || `[${msg.type}]`],
  );
  if (!ins.rowCount) return;

  const token = tokenDe(negocio);
  if (!token) return console.error(`[wa] negocio ${negocio.slug} sin token de acceso`);

  marcarLeido(phoneNumberId, token, msg.id).catch(() => {});

  // Conversacion (si un humano la tomo, el bot no responde)
  const sol = await query(
    `INSERT INTO solicitudes (negocio_id, telefono, nombre_contacto, ultimo_mensaje, canal)
     VALUES ($1,$2,$3,$4,'whatsapp')
     ON CONFLICT (negocio_id, telefono)
     DO UPDATE SET ultimo_mensaje = EXCLUDED.ultimo_mensaje,
                   nombre_contacto = COALESCE(EXCLUDED.nombre_contacto, solicitudes.nombre_contacto),
                   leido = false
     RETURNING bot_bloqueado`,
    [negocio.id, telefono, nombreContacto, cuerpo || `[${msg.type}]`],
  );
  if (sol.rows[0].bot_bloqueado) return;

  let r;
  if (msg.type !== 'text') {
    r = {
      texto: 'Por ahora solo puedo leer mensajes de texto. ¿Me puedes escribir tu pregunta?',
      origen: 'fallback',
      escalar: false,
    };
  } else {
    const faqs = (
      await query(
        'SELECT pregunta, respuesta, categoria FROM faq WHERE negocio_id = $1 AND activo = true ORDER BY orden',
        [negocio.id],
      )
    ).rows;
    const historial = (
      await query(
        `SELECT direccion, cuerpo FROM wa_mensajes WHERE negocio_id=$1 AND telefono=$2
         ORDER BY creado_en DESC LIMIT 8`,
        [negocio.id, telefono],
      )
    ).rows.reverse();
    r = await decidirRespuesta({ negocio, faqs, historial, mensaje: cuerpo });
  }

  await enviarTexto(phoneNumberId, token, telefono, r.texto);
  await query(
    `INSERT INTO wa_mensajes (negocio_id, telefono, direccion, cuerpo, origen) VALUES ($1,$2,'out',$3,$4)`,
    [negocio.id, telefono, r.texto, r.origen],
  );
  if (r.escalar) {
    await query(
      `UPDATE solicitudes SET estado='Escalado', prioridad='ALTA' WHERE negocio_id=$1 AND telefono=$2`,
      [negocio.id, telefono],
    );
  }
}
