-- Ecosistema FAQ Moldeable — Black Sheep Agencia
-- Esquema multi-tenant: TODO cuelga de "negocios". Moldear el bot a otro giro
-- (ej. de taquería a venta de azulejos) = cambiar filas de negocios/faq, no código.

CREATE TABLE IF NOT EXISTS negocios (
  id             SERIAL PRIMARY KEY,
  slug           VARCHAR(60) UNIQUE NOT NULL,        -- 'tacos-memo', 'azulejos-xyz'...
  nombre         VARCHAR(150) NOT NULL,
  giro           VARCHAR(100) NOT NULL,               -- 'taqueria', 'venta de azulejos', etc.
  ciudad         VARCHAR(100),
  tono           VARCHAR(50) DEFAULT 'amigable',       -- amigable | formal | divertido...
  system_prompt  TEXT NOT NULL,                        -- instrucción base del agente IA (editable desde el panel)
  whatsapp_numero      VARCHAR(30),
  chatwoot_inbox_id    VARCHAR(50),                    -- inbox de Chatwoot conectado a este negocio
  chatwoot_account_id  VARCHAR(50),
  plantilla      VARCHAR(50) NOT NULL DEFAULT 'generico', -- 'generico' | 'resto-bar' | 'estetica-barberia' | ... (plantilla visual)
  tipo_funcion   VARCHAR(20) NOT NULL DEFAULT 'ninguna', -- 'ninguna' | 'pedidos' | 'citas' — INDEPENDIENTE de `plantilla`
  logo_data_url  TEXT,                                 -- logo del negocio como data URL base64 (editable desde el panel)
  activo         BOOLEAN DEFAULT true,
  creado_en      TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS faq (
  id             SERIAL PRIMARY KEY,
  negocio_id     INTEGER NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  categoria      VARCHAR(80) DEFAULT 'general',
  pregunta       TEXT NOT NULL,
  respuesta      TEXT NOT NULL,
  imagen_url     TEXT,                                 -- link externo opcional (ej. Unsplash), no se guarda la imagen en la BD
  activo         BOOLEAN DEFAULT true,
  orden          INTEGER DEFAULT 0,
  creado_en      TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS links (
  id             SERIAL PRIMARY KEY,
  negocio_id     INTEGER NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  clave          VARCHAR(80) NOT NULL,                 -- 'menu_pdf', 'ubicacion_maps', 'catalogo'...
  url            TEXT NOT NULL,
  descripcion    TEXT,
  activo         BOOLEAN DEFAULT true,
  actualizado_en TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(negocio_id, clave)
);

CREATE TABLE IF NOT EXISTS solicitudes (
  id                SERIAL PRIMARY KEY,
  negocio_id        INTEGER NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  telefono          VARCHAR(30) NOT NULL,
  nombre_contacto   VARCHAR(150),
  canal             VARCHAR(30) DEFAULT 'whatsapp',
  chatwoot_conversation_id VARCHAR(50),
  ultimo_mensaje    TEXT,
  historial         JSONB DEFAULT '[]',                -- acumula intercambios cliente/bot
  estado            VARCHAR(30) DEFAULT 'Nuevo',        -- Nuevo | Escalado | Atendido | Cerrado | Baneado
  prioridad         VARCHAR(20) DEFAULT 'BAJA',
  bot_bloqueado     BOOLEAN DEFAULT false,
  motivo_baneo      TEXT,                                -- comentario del admin al banear (ej. pedido falso a domicilio)
  leido             BOOLEAN DEFAULT false,
  intencion_compra  BOOLEAN DEFAULT false,
  creado_en         TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(negocio_id, telefono)
);

-- Pedidos generados desde el menu interactivo (seleccion de items + "pasar por el"/"a domicilio").
-- El bot de n8n los inserta al detectar el marcador [PEDIDO_INTERACTIVO:...] en el mensaje de
-- WhatsApp (ver nodo "Detectar Pedido Interactivo" del flujo). No depende de solicitudes.id
-- directamente, se relaciona por negocio_id + telefono para no acoplar ambos flujos.
CREATE TABLE IF NOT EXISTS pedidos (
  id             SERIAL PRIMARY KEY,
  negocio_id     INTEGER NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  telefono       VARCHAR(30) NOT NULL,
  nombre_contacto VARCHAR(150),
  tipo_entrega   VARCHAR(20) NOT NULL,                 -- 'pickup' | 'domicilio'
  items          JSONB NOT NULL DEFAULT '[]',           -- [{ nombre, detalle }]
  estado         VARCHAR(30) DEFAULT 'Nuevo',           -- Nuevo | En proceso | Completado
  creado_en      TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Citas generadas desde la agenda interactiva (plantilla estetica-barberia). El bot de n8n
-- las inserta al detectar el marcador [CITA_INTERACTIVA] en el mensaje de WhatsApp (nodo
-- "Detectar Cita Interactiva"), solo para negocios con tipo_funcion = 'citas'. Igual que
-- `pedidos`, se relaciona por negocio_id + telefono, no por FK a solicitudes.
CREATE TABLE IF NOT EXISTS citas (
  id             SERIAL PRIMARY KEY,
  negocio_id     INTEGER NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  telefono       VARCHAR(30) NOT NULL,
  nombre_cliente VARCHAR(150),
  servicio       VARCHAR(150),
  fecha          VARCHAR(50),                           -- texto libre para demo (ej. "Viernes")
  horario        VARCHAR(50),                           -- texto libre para demo (ej. "5:00 pm")
  estado         VARCHAR(30) DEFAULT 'Nueva',            -- Nueva | Confirmada | Completada | Cancelada
  creado_en      TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Reservaciones de mesa, hechas por conversacion natural de WhatsApp (no por una pagina
-- interactiva como pedidos/citas). El agente de n8n extrae nombre/fecha/horario/personas
-- de la platica y emite el marcador [RESERVA_MESA] al final de su respuesta; el nodo
-- "Detectar Reserva de Mesa" lo parsea y lo inserta aqui. Solo aplica a negocios con
-- tipo_funcion = 'pedidos' (restaurantes) — independiente de la plantilla visual, igual
-- que pedidos/citas.
CREATE TABLE IF NOT EXISTS reservas (
  id             SERIAL PRIMARY KEY,
  negocio_id     INTEGER NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  telefono       VARCHAR(30) NOT NULL,
  nombre_cliente VARCHAR(150),
  fecha          VARCHAR(50),                           -- texto libre para demo (ej. "Viernes")
  horario        VARCHAR(50),                           -- texto libre para demo (ej. "8:00 pm")
  personas       VARCHAR(10),
  estado         VARCHAR(30) DEFAULT 'Nueva',            -- Nueva | Confirmada | Completada | Cancelada
  creado_en      TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_users (
  id             SERIAL PRIMARY KEY,
  negocio_id     INTEGER REFERENCES negocios(id) ON DELETE CASCADE, -- NULL = admin agencia (ve todos los negocios)
  username       VARCHAR(80) UNIQUE NOT NULL,
  password_hash  TEXT NOT NULL,
  nombre         VARCHAR(150),
  rol            VARCHAR(20) DEFAULT 'cliente',        -- 'agencia' | 'cliente'
  activo         BOOLEAN DEFAULT true,
  creado_en      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_faq_negocio ON faq(negocio_id);
CREATE INDEX IF NOT EXISTS idx_links_negocio ON links(negocio_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_negocio ON solicitudes(negocio_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_telefono ON solicitudes(telefono);
CREATE INDEX IF NOT EXISTS idx_pedidos_negocio ON pedidos(negocio_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_telefono ON pedidos(telefono);
CREATE INDEX IF NOT EXISTS idx_citas_negocio ON citas(negocio_id);
CREATE INDEX IF NOT EXISTS idx_citas_telefono ON citas(telefono);
CREATE INDEX IF NOT EXISTS idx_reservas_negocio ON reservas(negocio_id);
CREATE INDEX IF NOT EXISTS idx_reservas_telefono ON reservas(telefono);

-- trigger genérico de actualizado_en
CREATE OR REPLACE FUNCTION set_actualizado_en()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_negocios_upd') THEN
    CREATE TRIGGER trg_negocios_upd BEFORE UPDATE ON negocios
      FOR EACH ROW EXECUTE FUNCTION set_actualizado_en();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_faq_upd') THEN
    CREATE TRIGGER trg_faq_upd BEFORE UPDATE ON faq
      FOR EACH ROW EXECUTE FUNCTION set_actualizado_en();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_solicitudes_upd') THEN
    CREATE TRIGGER trg_solicitudes_upd BEFORE UPDATE ON solicitudes
      FOR EACH ROW EXECUTE FUNCTION set_actualizado_en();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_pedidos_upd') THEN
    CREATE TRIGGER trg_pedidos_upd BEFORE UPDATE ON pedidos
      FOR EACH ROW EXECUTE FUNCTION set_actualizado_en();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_citas_upd') THEN
    CREATE TRIGGER trg_citas_upd BEFORE UPDATE ON citas
      FOR EACH ROW EXECUTE FUNCTION set_actualizado_en();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_reservas_upd') THEN
    CREATE TRIGGER trg_reservas_upd BEFORE UPDATE ON reservas
      FOR EACH ROW EXECUTE FUNCTION set_actualizado_en();
  END IF;
END $$;
