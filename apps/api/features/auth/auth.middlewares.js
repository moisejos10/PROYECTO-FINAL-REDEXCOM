import jwt from 'jsonwebtoken';

/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */

export const authenticate = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(403).json({ error: 'No estás autenticado para esta operación' });
  }

  const token = req.headers.authorization.split(' ')[1];
  const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  req.user = { id: payload.id, email: payload.email, rol: payload.rol, nombre: payload.nombre };
  next();
};

/**
 * Middleware que verifica que el usuario tenga rol de administrador
 * Debe usarse DESPUÉS de authenticate
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
export const requireAdmin = (req, res, next) => {
  if (req.user.rol !== 'admin' && req.user.rol !== 'super_admin') {
    return res.status(403).json({ error: 'No tienes permisos de administrador para esta operación' });
  }
  next();
};

