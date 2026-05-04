import db from '../../db/index.js';
// eslint-disable-next-line no-unused-vars
import * as z from 'zod';
// eslint-disable-next-line no-unused-vars
import { UserSchema } from './user.schemas.js';

/** @typedef { z.infer<typeof UserSchema> } User */

/**
 * Crea un usuario en la base de datos
 * @param {Object} payload
 * @param {User['nombre']} payload.nombre - El nombre del usuario
 * @param {User['apellido']} payload.apellido - El apellido del usuario
 * @param {User['email']} payload.email - El correo del usuario
 * @param {string} payload.passwordHash - La contraseña encriptada
 * @returns {User}
 */
const createUser = ({ nombre, apellido, email, passwordHash }) => {
  const smtm = db.prepare(`
    INSERT INTO users (nombre, apellido, email, password_hash)
    VALUES (?, ?, ?, ?) RETURNING *
  `);

  const createdUser = smtm.get(nombre, apellido, email, passwordHash);
  return createdUser;
};

/**
 * Elimina un usuario por su id
 * @param {User['id']} id - El id del usuario a eliminar
 * @returns {void}
 */
const deleteUserById = (id) => {
  const smtm = db.prepare('DELETE FROM users WHERE id = ?');
  smtm.run(id);
};

/**
 * Busca un usuario por su email
 * @param {User['email']} email - El correo del usuario
 * @returns {User}
 */
const findUserByEmail = (email) => {
  const smtm = db.prepare('SELECT * FROM users WHERE email = ?');
  const user = smtm.get(email);
  return user;
};

/**
 * Obtener todos los usuarios
 * @returns {User[]}
 */
const findUsers = () => {
  const smtm = db.prepare('SELECT id, nombre, apellido, email, rol, email_verified, created_at FROM users');
  const users = smtm.all();
  return users;
};

/**
 * Marca el email de un usuario como verificado
 * @param {User['id']} id - El id del usuario
 * @returns {void}
 */
const updateEmailVerify = (id) => {
  const smtm = db.prepare(`
    UPDATE users
    SET email_verified = ?
    WHERE id = ?
  `);
  smtm.run(1, id);
};

/**
 * Obtiene todos los usuarios con rol de técnico
 * @returns {User[]}
 */
const findTecnicos = () => {
  const smtm = db.prepare("SELECT id, nombre, apellido, email FROM users WHERE rol = 'tecnico'");
  const tecnicos = smtm.all();
  return tecnicos;
};

/**
 * Busca un usuario por su ID
 * @param {User['id']} id - El id del usuario
 * @returns {User}
 */
const findUserById = (id) => {
  const smtm = db.prepare('SELECT id, nombre, apellido, email, rol FROM users WHERE id = ?');
  const user = smtm.get(id);
  return user;
};

const userRepository = {
  createUser,
  deleteUserById,
  findUserByEmail,
  findUsers,
  updateEmailVerify,
  findTecnicos,
  findUserById,
};

export default userRepository;
