-- ContestaYa: WhatsApp directo con la Cloud API de Meta (sin Chatwoot ni n8n).
-- Cada negocio queda ligado a su numero por wa_phone_number_id; con Embedded Signup cada
-- cliente tendra su propio WABA y su propio token (cifrado en wa_token_enc).

ALTER TABLE negocios ADD COLUMN IF NOT EXISTS wa_phone_number_id VARCHAR(40);
ALTER TABLE negocios ADD COLUMN IF NOT EXISTS wa_waba_id          VARCHAR(40);
ALTER TABLE negocios ADD COLUMN IF NOT EXISTS wa_token_enc        TEXT;  -- AES-256-GCM; NULL = usa WA_ACCESS_TOKEN del entorno (numero de prueba)

CREATE UNIQUE INDEX IF NOT EXISTS uq_negocios_wa_phone ON negocios(wa_phone_number_id)
  WHERE wa_phone_number_id IS NOT NULL;

-- Registro de mensajes: sirve de historial y de idempotencia (Meta reintenta webhooks,
-- el wamid unico evita contestar dos veces el mismo mensaje).
CREATE TABLE IF NOT EXISTS wa_mensajes (
  id           BIGSERIAL PRIMARY KEY,
  negocio_id   INTEGER REFERENCES negocios(id) ON DELETE CASCADE,
  wamid        VARCHAR(200) UNIQUE,               -- id de WhatsApp del mensaje entrante
  telefono     VARCHAR(30) NOT NULL,
  direccion    VARCHAR(10) NOT NULL,              -- 'in' | 'out'
  cuerpo       TEXT,
  origen       VARCHAR(20),                       -- 'faq' | 'ia' | 'fallback' (solo out)
  creado_en    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wa_mensajes_neg_tel ON wa_mensajes(negocio_id, telefono, creado_en DESC);
