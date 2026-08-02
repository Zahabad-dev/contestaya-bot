# ContestaYa — motor de bot de WhatsApp (Black Sheep Agencia)

Motor reusable para bots de WhatsApp vía **Chatwoot** (webhook) + **n8n** + **Redis** (buffer de
mensajes) + **Postgres** (multi-tenant), con un **panel web** para moldear el bot a cualquier
negocio sin tocar código ni el flujo de n8n.

Copiado del motor validado en `ecosistema-faq-bot` (demo Tacos Memo/Flora/Glow Studio), pero
con **infraestructura completamente separada**: su propio Postgres, su propia cuenta de Chatwoot
desde cero, y su propio n8n — nada se conecta a `botdemo` ni a `BLACKBOTRESPOND`. La app de Meta
para este proyecto es **Zyvora** (Business Verification/Tech Provider en curso), pensada para dar
de alta clientes reales vía Embedded Signup (no solo demos).

Incluye un negocio "Demo" (`sql/03_seed_demo_contestaya.sql`) para reservar un canal/inbox de
Chatwoot dedicado a mostrarle el producto a prospectos — los negocios de clientes reales se dan
de alta después, igual de simple, sin redeploy.

## Por qué es "moldeable"

Todo cuelga de la tabla `negocios` (ver `sql/01_schema.sql`):

- `giro`, `tono` y sobre todo `system_prompt` → definen cómo se comporta el agente de IA.
- `faq` → única fuente de verdad que el agente puede usar para responder (precios, horarios, catálogo…).
- `chatwoot_inbox_id` → así el flujo de n8n sabe, con un solo webhook central, a qué negocio
  pertenece cada conversación entrante (multi-tenant real).

Para dar de alta un cliente nuevo: se entra al panel `/admin`, se crea el negocio con su
`system_prompt` y `giro`, se cargan sus filas de `faq`, y listo — mismo flujo de n8n, mismo
código, cero redeploy.

## Estructura

```
contestaya-bot/
├── sql/                     esquema Postgres multi-tenant + seed del negocio demo
├── server/                  API Express + pg (sitio público por negocio + panel admin)
├── client/                  React + Vite: sitio público + panel /admin
└── n8n/                     referencia del flujo (desactualizada — el flujo real se construye
                              directo en la instancia de n8n vía su MCP, igual que se hizo en
                              ecosistema-faq-bot/botdemo)
```

## Cómo correrlo en local

```bash
# 1. Base de datos
psql "$DATABASE_URL" -f sql/01_schema.sql
psql "$DATABASE_URL" -f sql/02_usuarios.sql
psql "$DATABASE_URL" -f sql/03_seed_demo_contestaya.sql

# 2. Generar el hash real de los admins del seed (reemplaza __HASH_BCRYPT__ en el seed)
cd server && npm install
node -e "require('bcryptjs').hash('TU_PASSWORD_AQUI', 10).then(h => console.log(h))"

# 3. Backend
DATABASE_URL=postgres://user:pass@host:5432/db JWT_SECRET=algo-largo npm start

# 4. Frontend (otra terminal)
cd ../client && npm install && npm run dev
```

## Despliegue (Easypanel) — infraestructura propia, separada de `botdemo`

Todo dentro del mismo proyecto Easypanel `contestaya` (donde ya vive el sitio corporativo
`contestaya-site`), como servicios aparte:

1. **Postgres nuevo** (servicio propio, ej. `contestayadb`): correr los 3 scripts SQL vía DBGate.
   Puerto cerrado a internet salvo mientras se hace la migración inicial (mismo patrón que
   `demosdb` — cerrar el puerto externo al terminar).
2. **App** (este repo, `contestaya-bot`): build Nixpacks —
   `cd client && npm install && npm run build && cd ../server && npm install`,
   start `cd server && npm start`. Variables: `DATABASE_URL` (host interno del Postgres nuevo),
   `JWT_SECRET`, `COOKIE_SECURE=1`, `PORT=3001`.
3. **Chatwoot nuevo, desde cero** (servicio propio en el mismo proyecto, con su propio Postgres
   de Chatwoot) — **NO reutiliza** la instancia de `BLACKBOTRESPOND`. Pasos:
   - Desplegar Chatwoot (plantilla de Easypanel) + su Postgres/Redis dedicados.
   - Crear cuenta de administrador y el primer **inbox** de WhatsApp vinculado a la app de Meta
     **Zyvora** (una vez pasada la verificación de negocio / Tech Provider), vía Embedded Signup.
   - Copiar el `inbox_id`/`account_id` al panel `/admin` (o directo en la tabla `negocios`).
   - Configurar el webhook del inbox hacia n8n: evento `message_created`.
   - Generar un token de **Agent Bot** (no de perfil personal) para `CHATWOOT_API_TOKEN` —
     si no, Chatwoot marca las respuestas del bot como enviadas por un humano y se autopausa.
4. **n8n nuevo, desde cero** (servicio propio en el mismo proyecto, con su Postgres/runner
   propios — nunca comparte el Postgres del bot como storage interno). Construir el flujo
   directo con el MCP de la instancia (igual patrón que `ecosistema-faq-bot`): webhook Chatwoot →
   filtro → lookup de negocio por inbox → buffer Redis (7s) → FAQ dinámica → agente IA →
   detección de escalación → registro en Postgres → respuesta a Chatwoot.

## Pendiente / decisiones que requieren al usuario

- Completar Business Verification + Tech Provider de la app **Zyvora** en Meta for Developers
  (requiere cédula fiscal/RFC — el usuario la ingresa directamente en Meta, no vía este entorno).
- Desplegar Postgres, Chatwoot y n8n como servicios nuevos en el proyecto `contestaya` de
  Easypanel.
- Una vez con n8n desplegado, conectar su MCP a una sesión de Claude Code (como se hizo con
  `botdemo`) para construir el flujo real.
- Dar de alta el primer inbox (canal demo) en Chatwoot vía Embedded Signup con Zyvora.
- Cambiar los hashes de contraseña placeholder del seed antes de usar en producción.
