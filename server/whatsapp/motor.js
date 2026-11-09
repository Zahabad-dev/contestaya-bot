import { config } from '../config.js';

// ---------- Coincidencia de preguntas frecuentes (sin IA) ----------
const STOP = new Set(
  ('a al algo ante con de del el ella en es esta este esto la las lo los me mi mis muy no o para por que ' +
    'se si su sus te tu tus un una uno y ya hay son ser les le nos hola buenas buenos dias tardes noches ' +
    'quiero quisiera saber favor gracias como cual cuales cuanto cuantos donde cuando tienen tiene ' +
    'puedo pueden puede').split(' '),
);

export const normalizar = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokens = (s) =>
  normalizar(s)
    .split(' ')
    .filter((t) => t.length > 1 && !STOP.has(t))
    .map((t) => (t.length > 4 ? t.replace(/(es|s)$/, '') : t)); // plural simple

// Sinonimos frecuentes: acercan "abren/cierran/horario" a la misma idea.
const SINONIMOS = {
  abren: 'horario', abrir: 'horario', cierran: 'horario', cerrar: 'horario', hora: 'horario',
  horas: 'horario', atienden: 'horario', direccion: 'ubicacion', ubicados: 'ubicacion',
  ubicado: 'ubicacion', ubican: 'ubicacion', domicilio: 'ubicacion', costo: 'precio',
  cuesta: 'precio', cuestan: 'precio', cobran: 'precio', pagar: 'pago', pagan: 'pago',
  tarjeta: 'pago', efectivo: 'pago', transferencia: 'pago',
};
const canon = (t) => SINONIMOS[t] || t;

const puntuar = (consulta, faq) => {
  const q = new Set(tokens(consulta).map(canon));
  if (q.size === 0) return 0;
  const f = new Set(tokens(`${faq.pregunta} ${faq.categoria || ''}`).map(canon));
  let comunes = 0;
  for (const t of q) if (f.has(t)) comunes++;
  if (comunes === 0) return 0;
  return comunes / Math.min(q.size, Math.max(f.size, 1)); // 0..1
};

const UMBRAL = 0.5;

const RE_SALUDO = /^(hola|buenas|buenos dias|buen dia|buenas tardes|buenas noches|hey|que tal)\b/;
const RE_HUMANO = /(hablar con (una )?(persona|humano|asesor|alguien)|asesor|agente|humano|persona real|encargado)/;

export const coincidenciaFaq = (mensaje, faqs) => {
  let mejor = null;
  let mejorScore = 0;
  for (const f of faqs) {
    const s = puntuar(mensaje, f);
    if (s > mejorScore) {
      mejorScore = s;
      mejor = f;
    }
  }
  return mejorScore >= UMBRAL ? { faq: mejor, score: mejorScore } : null;
};

// ---------- IA opcional (Claude) ----------
const respuestaIA = async (negocio, faqs, historial, mensaje) => {
  const base = faqs.map((f) => `P: ${f.pregunta}\nR: ${f.respuesta}`).join('\n\n');
  const system =
    `${negocio.system_prompt}\n\nNegocio: ${negocio.nombre}.\n\nPREGUNTAS FRECUENTES (unica fuente de verdad):\n${base}\n\n` +
    'Si la respuesta no esta en las preguntas frecuentes, responde exactamente: [ESCALAR]';
  const messages = [
    ...historial.slice(-6).map((h) => ({ role: h.direccion === 'in' ? 'user' : 'assistant', content: h.cuerpo })),
    { role: 'user', content: mensaje },
  ];
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': config.ai.apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ model: config.ai.model, max_tokens: 300, system, messages }),
  });
  if (!r.ok) throw new Error(`IA HTTP ${r.status}`);
  const data = await r.json();
  return (data.content?.[0]?.text || '').trim();
};

// ---------- Decision final ----------
// Devuelve { texto, origen: 'faq' | 'ia' | 'fallback', escalar }
export const decidirRespuesta = async ({ negocio, faqs, historial = [], mensaje }) => {
  const norm = normalizar(mensaje);

  if (RE_HUMANO.test(norm)) {
    return {
      texto: 'Claro, en un momento una persona del equipo te escribe por aquí. 🙌',
      origen: 'fallback',
      escalar: true,
    };
  }

  const hit = coincidenciaFaq(mensaje, faqs);
  if (hit) return { texto: hit.faq.respuesta, origen: 'faq', escalar: false };

  if (RE_SALUDO.test(norm) && norm.split(' ').length <= 4) {
    return {
      texto: `¡Hola! Soy el asistente de ${negocio.nombre}. ¿En qué te puedo ayudar?`,
      origen: 'fallback',
      escalar: false,
    };
  }

  if (config.ai.apiKey) {
    try {
      const t = await respuestaIA(negocio, faqs, historial, mensaje);
      if (t && !t.includes('[ESCALAR]')) return { texto: t, origen: 'ia', escalar: false };
    } catch (e) {
      console.error('[ia]', e.message);
    }
  }

  return {
    texto: 'Gracias por escribirnos. Déjame pasar tu mensaje al equipo y en un momento te responden. 🙌',
    origen: 'fallback',
    escalar: true,
  };
};
