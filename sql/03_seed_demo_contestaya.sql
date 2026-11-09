-- Seed de demo: NEGOCIO DEMO (canal de Chatwoot reservado para mostrar ContestaYa a prospectos)
-- Este archivo carga UN negocio de ejemplo genérico. Los negocios reales de clientes se dan de
-- alta desde el panel /admin (o con un INSERT nuevo en `negocios`) una vez completado su propio
-- Embedded Signup e inbox de Chatwoot — no se toca ni el esquema ni el flujo de n8n.

-- ⚠️ chatwoot_inbox_id debe coincidir con el "inbox_id" real que manda Chatwoot en el webhook
-- (Settings → Inboxes → el inbox conectado). Sin este dato correcto, el flujo de n8n no
-- encuentra el negocio y el nodo "Obtener Negocio (por inbox)" no devuelve filas.
INSERT INTO negocios (slug, nombre, giro, ciudad, tono, system_prompt, whatsapp_numero, chatwoot_inbox_id, activo)
VALUES (
  'demo-contestaya',
  'Negocio Demo',
  'demo',
  '',
  'amigable',
  'Eres el asistente de WhatsApp de un negocio de ejemplo, usado por Codeva Soluciones para '
  || 'mostrarle a prospectos cómo funciona ContestaYa. Responde siempre en español, tono cálido '
  || 'y profesional. Usa ÚNICAMENTE la información de "PREGUNTAS FRECUENTES" cargada para este '
  || 'negocio — nunca inventes datos que no estén ahí. Si preguntan algo fuera de las FAQ, o '
  || 'piden hablar con una persona, dile que en un momento alguien del equipo le escribe y marca '
  || 'la conversación para escalar. Sé breve: máximo 3-4 líneas por respuesta, como un mensaje '
  || 'real de WhatsApp.',
  '',
  '1',
  true
)
ON CONFLICT (slug) DO NOTHING;

-- FAQ de ejemplo (editable desde el panel /admin) — reemplazar por el giro real del prospecto
-- que se le vaya a mostrar en cada demo.
INSERT INTO faq (negocio_id, categoria, pregunta, respuesta, orden)
SELECT n.id, v.categoria, v.pregunta, v.respuesta, v.orden
FROM negocios n,
(VALUES
  ('general', '¿Qué es ContestaYa?', 'ContestaYa automatiza la atención de WhatsApp de tu negocio: responde preguntas frecuentes, toma pedidos/citas y avisa a tu equipo cuando un cliente necesita a una persona real.', 1),
  ('general', '¿Cómo se moldea a mi negocio?', 'Se carga tu información (preguntas frecuentes, tono, catálogo) desde un panel, sin tocar código ni el flujo del bot.', 2),
  ('horarios', '¿A qué hora abren? ¿Cuál es el horario?', 'Abrimos de lunes a sábado de 9:00 am a 7:00 pm. Domingos cerrado.', 3),
  ('ubicacion', '¿Dónde están ubicados? ¿Cuál es la dirección?', 'Estamos en el centro de la ciudad. Escríbenos y con gusto te compartimos la ubicación exacta en el mapa.', 4),
  ('precios', '¿Cuánto cuesta? ¿Qué precios tienen?', 'Los precios dependen del servicio. Dime qué necesitas y te comparto la lista de precios actualizada.', 5),
  ('pagos', '¿Qué formas de pago aceptan?', 'Aceptamos efectivo, tarjeta de débito y crédito y transferencia.', 6)
) AS v(categoria, pregunta, respuesta, orden)
WHERE n.slug = 'demo-contestaya'
ON CONFLICT DO NOTHING;

-- Usuario admin del canal demo (rol 'cliente', scoped al negocio demo).
-- ⚠️ El hash de abajo es PLACEHOLDER. Genera el real así, desde contestaya-bot/server:
--   npm install
--   node -e "require('bcryptjs').hash('TU_PASSWORD_AQUI', 10).then(h => console.log(h))"
-- y reemplaza __HASH_BCRYPT__ antes de correr este script.
INSERT INTO admin_users (negocio_id, username, password_hash, nombre, rol)
SELECT n.id, 'demo@contestaya.com', '__HASH_BCRYPT__', 'Demo ContestaYa', 'cliente'
FROM negocios n WHERE n.slug = 'demo-contestaya'
ON CONFLICT (username) DO NOTHING;

-- Acceso de agencia con visibilidad de todos los negocios (rol 'agencia').
-- ⚠️ Igual que arriba: __HASH_BCRYPT__ es placeholder, genera el hash real antes de correr.
INSERT INTO admin_users (negocio_id, username, password_hash, nombre, rol)
SELECT n.id, 'agencia@contestaya.com', '__HASH_BCRYPT__', 'Codeva Soluciones', 'agencia'
FROM negocios n WHERE n.slug = 'demo-contestaya'
ON CONFLICT (username) DO NOTHING;
