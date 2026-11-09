export const config = {
  port: process.env.PORT || 3001,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  cookieSecure: process.env.COOKIE_SECURE === '1',
  nodeEnv: process.env.NODE_ENV || 'development',

  // --- WhatsApp Cloud API (Meta) ---
  meta: {
    graphVersion: process.env.META_GRAPH_VERSION || 'v25.0',
    appSecret: process.env.META_APP_SECRET || '',     // firma X-Hub-Signature-256 (obligatoria en produccion)
    verifyToken: process.env.META_VERIFY_TOKEN || '', // el mismo que pones en el panel de Meta
    // Token del numero de prueba. Los negocios con Embedded Signup usan su propio token cifrado.
    accessToken: process.env.WA_ACCESS_TOKEN || '',
    encryptionKey: process.env.ENCRYPTION_KEY || '',  // cifra los tokens por negocio en la BD
  },

  // --- IA opcional (si no hay key, el bot responde solo con las FAQ) ---
  ai: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5',
  },
};
