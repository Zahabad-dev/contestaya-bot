import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from './db.js';
import { config } from './config.js';

export async function login(username, password) {
  const { rows } = await query(
    'SELECT id, negocio_id, username, password_hash, nombre, rol, activo FROM admin_users WHERE username = $1',
    [username]
  );
  const user = rows[0];
  if (!user || !user.activo) return null;
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return null;
  const token = jwt.sign(
    { sub: user.id, negocioId: user.negocio_id, rol: user.rol, nombre: user.nombre },
    config.jwtSecret,
    { expiresIn: '7d' }
  );
  return { token, user: { id: user.id, negocioId: user.negocio_id, nombre: user.nombre, rol: user.rol } };
}

export function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'No autenticado' });
  try {
    req.auth = jwt.verify(token, config.jwtSecret);
    next();
  } catch {
    res.status(401).json({ error: 'Sesión inválida' });
  }
}

// Restringe el acceso al negocio del admin, salvo rol 'agencia' (ve todos).
export function scopeNegocio(req, res, next) {
  const paramNegocioId = req.params.negocioId ? Number(req.params.negocioId) : null;
  if (req.auth.rol === 'agencia') return next();
  if (paramNegocioId && paramNegocioId !== req.auth.negocioId) {
    return res.status(403).json({ error: 'Sin acceso a este negocio' });
  }
  next();
}
