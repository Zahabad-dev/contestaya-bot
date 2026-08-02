import { Router } from 'express';
import { query, withTransaction } from '../db.js';
import { login, requireAuth, scopeNegocio } from '../auth.js';
import { config } from '../config.js';

export const adminRouter = Router();

adminRouter.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const result = await login(username, password);
  if (!result) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  res.cookie('token', result.token, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.json({ user: result.user });
});

adminRouter.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

adminRouter.get('/me', requireAuth, (req, res) => res.json({ user: req.auth }));

// Lista de negocios visibles para el admin logueado (agencia ve todos, cliente solo el suyo).
// "pendientes" suma pedidos/citas/reservas nuevos + solicitudes no leidas de ese negocio —
// se usa como badge de notificacion junto al link "Solicitudes" de cada fila.
adminRouter.get('/negocios', requireAuth, async (req, res) => {
  const isAgencia = req.auth.rol === 'agencia';
  const { rows } = await query(
    `SELECT n.id, n.slug, n.nombre, n.giro, n.ciudad, n.tono, n.activo,
       COALESCE(p.pendientes, 0) + COALESCE(c.pendientes, 0) + COALESCE(r.pendientes, 0) + COALESCE(s.pendientes, 0) AS pendientes
     FROM negocios n
     LEFT JOIN (SELECT negocio_id, COUNT(*) AS pendientes FROM pedidos WHERE estado = 'Nuevo' GROUP BY negocio_id) p ON p.negocio_id = n.id
     LEFT JOIN (SELECT negocio_id, COUNT(*) AS pendientes FROM citas WHERE estado = 'Nueva' GROUP BY negocio_id) c ON c.negocio_id = n.id
     LEFT JOIN (SELECT negocio_id, COUNT(*) AS pendientes FROM reservas WHERE estado = 'Nueva' GROUP BY negocio_id) r ON r.negocio_id = n.id
     LEFT JOIN (SELECT negocio_id, COUNT(*) AS pendientes FROM solicitudes WHERE leido = false GROUP BY negocio_id) s ON s.negocio_id = n.id
     WHERE $1 = true OR n.id = $2
     ORDER BY n.nombre`,
    [isAgencia, req.auth.negocioId]
  );
  res.json(rows);
});

// --- El panel "moldeable": editar giro / tono / system_prompt de un negocio ---
adminRouter.get('/negocios/:negocioId', requireAuth, scopeNegocio, async (req, res) => {
  const { rows } = await query('SELECT * FROM negocios WHERE id = $1', [req.params.negocioId]);
  if (!rows[0]) return res.status(404).json({ error: 'No encontrado' });
  res.json(rows[0]);
});

adminRouter.put('/negocios/:negocioId', requireAuth, scopeNegocio, async (req, res) => {
  const { nombre, giro, ciudad, tono, system_prompt, whatsapp_numero, chatwoot_inbox_id, chatwoot_account_id, activo, plantilla, logo_data_url, tipo_funcion } = req.body;
  const { rows } = await query(
    `UPDATE negocios SET
       nombre = COALESCE($2, nombre),
       giro = COALESCE($3, giro),
       ciudad = COALESCE($4, ciudad),
       tono = COALESCE($5, tono),
       system_prompt = COALESCE($6, system_prompt),
       whatsapp_numero = COALESCE($7, whatsapp_numero),
       chatwoot_inbox_id = COALESCE($8, chatwoot_inbox_id),
       chatwoot_account_id = COALESCE($9, chatwoot_account_id),
       activo = COALESCE($10, activo),
       plantilla = COALESCE($11, plantilla),
       logo_data_url = COALESCE($12, logo_data_url),
       tipo_funcion = COALESCE($13, tipo_funcion)
     WHERE id = $1 RETURNING *`,
    [req.params.negocioId, nombre, giro, ciudad, tono, system_prompt, whatsapp_numero, chatwoot_inbox_id, chatwoot_account_id, activo, plantilla, logo_data_url, tipo_funcion]
  );
  res.json(rows[0]);
});

// Activar un negocio como "la demo en vivo" — desactiva todos los demás en la misma
// transacción, así el flujo de n8n (que filtra por activo = true) nunca lee dos
// negocios a la vez ni se cruza con datos de otra demo. Los datos de los negocios
// desactivados no se tocan: solo cambia la bandera activo.
adminRouter.put('/negocios/:negocioId/activar', requireAuth, async (req, res) => {
  if (req.auth.rol !== 'agencia') return res.status(403).json({ error: 'Solo la agencia puede cambiar el negocio activo' });
  const negocio = await withTransaction(async (client) => {
    await client.query('UPDATE negocios SET activo = false WHERE id <> $1', [req.params.negocioId]);
    const { rows } = await client.query('UPDATE negocios SET activo = true WHERE id = $1 RETURNING *', [req.params.negocioId]);
    return rows[0];
  });
  if (!negocio) return res.status(404).json({ error: 'No encontrado' });
  res.json(negocio);
});

// Solo rol 'agencia' puede crear negocios nuevos (nuevos clientes/demos).
// Nace SIEMPRE inactivo (activo = false): así nunca compite por el chatwoot_inbox_id
// con la demo que esté activa en ese momento. Se activa a propósito con /activar.
adminRouter.post('/negocios', requireAuth, async (req, res) => {
  if (req.auth.rol !== 'agencia') return res.status(403).json({ error: 'Solo la agencia puede crear negocios' });
  const { slug, nombre, giro, ciudad, tono, system_prompt } = req.body;
  const { rows } = await query(
    `INSERT INTO negocios (slug, nombre, giro, ciudad, tono, system_prompt, activo)
     VALUES ($1,$2,$3,$4,$5,$6,false) RETURNING *`,
    [slug, nombre, giro, ciudad, tono || 'amigable', system_prompt]
  );
  res.status(201).json(rows[0]);
});

// --- FAQ (moldeable por negocio) ---
adminRouter.get('/negocios/:negocioId/faq', requireAuth, scopeNegocio, async (req, res) => {
  const { rows } = await query('SELECT * FROM faq WHERE negocio_id = $1 ORDER BY orden, id', [req.params.negocioId]);
  res.json(rows);
});

adminRouter.post('/negocios/:negocioId/faq', requireAuth, scopeNegocio, async (req, res) => {
  const { categoria, pregunta, respuesta, orden, imagen_url } = req.body;
  const { rows } = await query(
    `INSERT INTO faq (negocio_id, categoria, pregunta, respuesta, orden, imagen_url)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.params.negocioId, categoria || 'general', pregunta, respuesta, orden || 0, imagen_url || null]
  );
  res.status(201).json(rows[0]);
});

adminRouter.put('/faq/:id', requireAuth, async (req, res) => {
  const { categoria, pregunta, respuesta, activo, orden, imagen_url } = req.body;
  const { rows } = await query(
    `UPDATE faq SET
       categoria = COALESCE($2, categoria),
       pregunta = COALESCE($3, pregunta),
       respuesta = COALESCE($4, respuesta),
       activo = COALESCE($5, activo),
       orden = COALESCE($6, orden),
       imagen_url = COALESCE($7, imagen_url)
     WHERE id = $1 RETURNING *`,
    [req.params.id, categoria, pregunta, respuesta, activo, orden, imagen_url]
  );
  res.json(rows[0]);
});

adminRouter.delete('/faq/:id', requireAuth, async (req, res) => {
  await query('DELETE FROM faq WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

// --- Links ---
adminRouter.get('/negocios/:negocioId/links', requireAuth, scopeNegocio, async (req, res) => {
  const { rows } = await query('SELECT * FROM links WHERE negocio_id = $1 ORDER BY id', [req.params.negocioId]);
  res.json(rows);
});

adminRouter.put('/links/:id', requireAuth, async (req, res) => {
  const { url, descripcion, activo } = req.body;
  const { rows } = await query(
    `UPDATE links SET url = COALESCE($2, url), descripcion = COALESCE($3, descripcion), activo = COALESCE($4, activo)
     WHERE id = $1 RETURNING *`,
    [req.params.id, url, descripcion, activo]
  );
  res.json(rows[0]);
});

// --- Solicitudes / leads ---
// Incluye conteos de pedidos/citas/reservas "Nuevo(a)" por contacto, para mostrar el badge
// en los botones "Historial de..." sin tener que abrir cada modal.
adminRouter.get('/negocios/:negocioId/solicitudes', requireAuth, scopeNegocio, async (req, res) => {
  const { rows } = await query(
    `SELECT s.*,
       COALESCE(p.pendientes, 0) AS pedidos_nuevos,
       COALESCE(c.pendientes, 0) AS citas_nuevas,
       COALESCE(r.pendientes, 0) AS reservas_nuevas
     FROM solicitudes s
     LEFT JOIN (SELECT negocio_id, telefono, COUNT(*) AS pendientes FROM pedidos WHERE estado = 'Nuevo' GROUP BY negocio_id, telefono) p ON p.negocio_id = s.negocio_id AND p.telefono = s.telefono
     LEFT JOIN (SELECT negocio_id, telefono, COUNT(*) AS pendientes FROM citas WHERE estado = 'Nueva' GROUP BY negocio_id, telefono) c ON c.negocio_id = s.negocio_id AND c.telefono = s.telefono
     LEFT JOIN (SELECT negocio_id, telefono, COUNT(*) AS pendientes FROM reservas WHERE estado = 'Nueva' GROUP BY negocio_id, telefono) r ON r.negocio_id = s.negocio_id AND r.telefono = s.telefono
     WHERE s.negocio_id = $1
     ORDER BY s.actualizado_en DESC LIMIT 200`,
    [req.params.negocioId]
  );
  res.json(rows);
});

adminRouter.put('/solicitudes/:id', requireAuth, async (req, res) => {
  const { estado, prioridad, bot_bloqueado, leido, motivo_baneo } = req.body;
  const { rows } = await query(
    `UPDATE solicitudes SET
       estado = COALESCE($2, estado),
       prioridad = COALESCE($3, prioridad),
       bot_bloqueado = COALESCE($4, bot_bloqueado),
       leido = COALESCE($5, leido),
       motivo_baneo = COALESCE($6, motivo_baneo)
     WHERE id = $1 RETURNING *`,
    [req.params.id, estado, prioridad, bot_bloqueado, leido, motivo_baneo]
  );
  res.json(rows[0]);
});

// --- Pedidos (generados desde el menu interactivo, insertados por n8n) ---
// Se relacionan por negocio_id + telefono de la solicitud, no por FK directa.
adminRouter.get('/solicitudes/:solicitudId/pedidos', requireAuth, async (req, res) => {
  const { rows: sol } = await query('SELECT negocio_id, telefono FROM solicitudes WHERE id = $1', [req.params.solicitudId]);
  if (!sol[0]) return res.status(404).json({ error: 'Solicitud no encontrada' });
  const { rows } = await query(
    'SELECT * FROM pedidos WHERE negocio_id = $1 AND telefono = $2 ORDER BY creado_en DESC',
    [sol[0].negocio_id, sol[0].telefono]
  );
  res.json(rows);
});

adminRouter.put('/pedidos/:id', requireAuth, async (req, res) => {
  const { estado } = req.body;
  const { rows } = await query(
    'UPDATE pedidos SET estado = COALESCE($2, estado) WHERE id = $1 RETURNING *',
    [req.params.id, estado]
  );
  res.json(rows[0]);
});

// --- Citas (generadas desde la agenda interactiva, insertadas por n8n) ---
// Mismo patron que pedidos: relacion por negocio_id + telefono, no por FK directa.
adminRouter.get('/solicitudes/:solicitudId/citas', requireAuth, async (req, res) => {
  const { rows: sol } = await query('SELECT negocio_id, telefono FROM solicitudes WHERE id = $1', [req.params.solicitudId]);
  if (!sol[0]) return res.status(404).json({ error: 'Solicitud no encontrada' });
  const { rows } = await query(
    'SELECT * FROM citas WHERE negocio_id = $1 AND telefono = $2 ORDER BY creado_en DESC',
    [sol[0].negocio_id, sol[0].telefono]
  );
  res.json(rows);
});

adminRouter.put('/citas/:id', requireAuth, async (req, res) => {
  const { estado } = req.body;
  const { rows } = await query(
    'UPDATE citas SET estado = COALESCE($2, estado) WHERE id = $1 RETURNING *',
    [req.params.id, estado]
  );
  res.json(rows[0]);
});

// --- Reservas de mesa (guardadas por n8n al detectar el marcador [RESERVA_MESA] que el
// agente emite en conversacion libre, solo para negocios con tipo_funcion = 'pedidos') ---
// Mismo patron que pedidos/citas: relacion por negocio_id + telefono, no por FK directa.
adminRouter.get('/solicitudes/:solicitudId/reservas', requireAuth, async (req, res) => {
  const { rows: sol } = await query('SELECT negocio_id, telefono FROM solicitudes WHERE id = $1', [req.params.solicitudId]);
  if (!sol[0]) return res.status(404).json({ error: 'Solicitud no encontrada' });
  const { rows } = await query(
    'SELECT * FROM reservas WHERE negocio_id = $1 AND telefono = $2 ORDER BY creado_en DESC',
    [sol[0].negocio_id, sol[0].telefono]
  );
  res.json(rows);
});

adminRouter.put('/reservas/:id', requireAuth, async (req, res) => {
  const { estado } = req.body;
  const { rows } = await query(
    'UPDATE reservas SET estado = COALESCE($2, estado) WHERE id = $1 RETURNING *',
    [req.params.id, estado]
  );
  res.json(rows[0]);
});
