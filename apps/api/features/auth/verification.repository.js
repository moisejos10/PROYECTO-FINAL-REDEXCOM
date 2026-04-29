import db from '../../db/index.js';

/**
 * Crea un código de verificación
 * @param {Object} payload
 * @param {string} payload.code - El código de 6 dígitos
 * @param {number} payload.userId - El id del usuario
 * @param {string} payload.expiresAt - Fecha de expiración ISO
 */
const createCode = ({ code, userId, expiresAt }) => {
  // Eliminar códigos anteriores del usuario
  db.prepare('DELETE FROM verification_codes WHERE user_id = ?').run(userId);

  const smtm = db.prepare(
    'INSERT INTO verification_codes (code, user_id, expires_at) VALUES (?, ?, ?) RETURNING *',
  );
  return smtm.get(code, userId, expiresAt);
};

/**
 * Busca un código de verificación válido
 * @param {Object} payload
 * @param {string} payload.code - El código de 6 dígitos
 * @param {number} payload.userId - El id del usuario
 * @returns {Object|undefined}
 */
const findValidCode = ({ code, userId }) => {
  const smtm = db.prepare(
    'SELECT * FROM verification_codes WHERE code = ? AND user_id = ? AND used = 0',
  );
  return smtm.get(code, userId);
};

/**
 * Marca un código como usado
 * @param {number} id - El id del código
 */
const markAsUsed = (id) => {
  db.prepare('UPDATE verification_codes SET used = 1 WHERE id = ?').run(id);
};

const verificationRepository = { createCode, findValidCode, markAsUsed };
export default verificationRepository;
