import crypto from 'crypto';
import { config } from '../config.js';

// Cifra/descifra los tokens de acceso de cada negocio (AES-256-GCM).
// Formato guardado: base64(iv) . base64(tag) . base64(datos)
const key = () => {
  if (!config.meta.encryptionKey) throw new Error('Falta ENCRYPTION_KEY para cifrar tokens');
  return crypto.createHash('sha256').update(config.meta.encryptionKey).digest();
};

export const cifrar = (texto) => {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const datos = Buffer.concat([c.update(texto, 'utf8'), c.final()]);
  return [iv, c.getAuthTag(), datos].map((b) => b.toString('base64')).join('.');
};

export const descifrar = (guardado) => {
  const [iv, tag, datos] = guardado.split('.').map((s) => Buffer.from(s, 'base64'));
  const d = crypto.createDecipheriv('aes-256-gcm', key(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(datos), d.final()]).toString('utf8');
};
