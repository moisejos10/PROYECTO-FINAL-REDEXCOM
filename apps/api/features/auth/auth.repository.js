import db from '../../db/index.js';
// eslint-disable-next-line no-unused-vars
import * as z from 'zod';
// eslint-disable-next-line no-unused-vars
import { sessionSchema } from './auth.schemas.js';

/** @typedef { z.infer<typeof sessionSchema> } Session */

/**
 * Crea una sesión
 * @param {Object} payload
 * @param {Session['jwtid']} payload.jwtid - El id del token
 * @param {Session['user_id']} payload.userId - El id del usuario
 * @returns {Session}
 */
const createSession = ({ jwtid, userId }) => {
  const smtm = db.prepare('INSERT INTO sessions (jwtid, user_id) VALUES (?,?) RETURNING *');
  const createdSession = smtm.get(jwtid, userId);
  return createdSession;
};

/**
 * Encuentra una sesión por su id de JWT
 * @param {Object} payload
 * @param {Session['jwtid']} payload.jwtid
 * @returns {Session}
 */
const findSessionByJwtId = ({ jwtid }) => {
  const smtm = db.prepare('SELECT * FROM sessions WHERE jwtid = ?');
  const session = smtm.get(jwtid);
  return session;
};

/**
 * Elimina una sesión basandose en el id de la sesión
 * @param {Session['id']} id
 * @returns {void}
 */
const deleteSession = (id) => {
  const smtm = db.prepare('DELETE FROM sessions WHERE id = ?');
  smtm.run(id);
};

/**
 * Actualiza el JWT de una sesión en la base de datos
 * @param {Object} payload
 * @param {Session['jwtid']} payload.jwtid
 * @param {Session['id']} payload.id
 * @returns {void}
 */
const updateSessionJwtId = ({ jwtid, id }) => {
  const smtm = db.prepare(`
    UPDATE sessions
    SET jwtid = ?
    WHERE id = ?
  `);
  smtm.run(jwtid, id);
};

const authRepository = { createSession, findSessionByJwtId, deleteSession, updateSessionJwtId };
export default authRepository;
