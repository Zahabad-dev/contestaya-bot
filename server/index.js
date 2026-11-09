import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { publicRouter } from './routes/public.js';
import { adminRouter } from './routes/admin.js';
import { whatsappRouter } from './routes/whatsapp.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.join(__dirname, '..', 'client', 'dist');

const app = express();
// El cuerpo crudo se conserva para validar la firma X-Hub-Signature-256 del webhook de Meta.
app.use(
  express.json({
    limit: '4mb', // el logo del negocio viaja como data URL base64
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  }),
);
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/whatsapp', whatsappRouter);
app.use('/api/public', publicRouter);
app.use('/api/admin', adminRouter);

// Sirve el build de Vite (sitio público + panel /admin) — un solo servicio en Easypanel.
app.use(express.static(clientDist));
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(config.port, () => {
  console.log(`Ecosistema FAQ Bot API escuchando en :${config.port}`);
});
