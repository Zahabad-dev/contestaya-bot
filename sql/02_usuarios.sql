-- Usuarios de Postgres para el ecosistema (mismo patrón que Sianna/Wolf Daniels)
-- Cambiar contraseñas __CAMBIA_*__ antes de usar en Easypanel.

CREATE USER faqbot_n8n WITH PASSWORD '__CAMBIA_N8N__';
CREATE USER faqbot_app WITH PASSWORD '__CAMBIA_APP__';
CREATE USER faqbot_readonly WITH PASSWORD '__CAMBIA_READONLY__';

GRANT SELECT, INSERT, UPDATE ON negocios, faq, links, solicitudes TO faqbot_n8n;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO faqbot_n8n;

GRANT SELECT, INSERT, UPDATE, DELETE ON negocios, faq, links, solicitudes, admin_users TO faqbot_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO faqbot_app;

GRANT SELECT ON negocios, faq, links, solicitudes TO faqbot_readonly;
