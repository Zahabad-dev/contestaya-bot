import crypto from 'crypto';
import { config } from '../config.js';

// Valida la firma que Meta manda en X-Hub-Signature-256 sobre el cuerpo CRUDO.
export const firmaValida = (rawBody, header) => {
  if (!config.meta.appSecret || !header || !rawBody) return false;
  const esperado =
    'sha256=' + crypto.createHmac('sha256', config.meta.appSecret).update(rawBody).digest('hex');
  const a = Buffer.from(esperado);
  const b = Buffer.from(header);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

const graph = async (phoneNumberId, token, body) => {
  const url = `https://graph.facebook.com/${config.meta.graphVersion}/${phoneNumberId}/messages`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', ...body }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = data?.error?.message || `HTTP ${r.status}`;
    throw new Error(`Cloud API: ${msg}`);
  }
  return data;
};

// Texto libre: solo se entrega dentro de las 24 h posteriores al ultimo mensaje del cliente.
export const enviarTexto = (phoneNumberId, token, para, texto) =>
  graph(phoneNumberId, token, {
    to: para,
    type: 'text',
    text: { body: texto.slice(0, 4000), preview_url: false },
  });

export const marcarLeido = (phoneNumberId, token, wamid) =>
  graph(phoneNumberId, token, { status: 'read', message_id: wamid });
