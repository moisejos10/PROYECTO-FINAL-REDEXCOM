import supabase from '../../db/index.js';

/**
 * Crea un usuario en la base de datos
 * @param {Object} payload
 * @param {string} payload.nombre
 * @param {string} payload.apellido
 * @param {string} payload.email
 * @param {string} payload.passwordHash
 * @returns {Promise<Object>}
 */
const createUser = async ({ nombre, apellido, email, passwordHash }) => {
  const { data, error } = await supabase
    .from('users')
    .insert({ nombre, apellido, email, password_hash: passwordHash })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Elimina un usuario por su id
 * @param {number} id
 * @returns {Promise<void>}
 */
const deleteUserById = async (id) => {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

/**
 * Busca un usuario por su email
 * @param {string} email
 * @returns {Promise<Object|null>}
 */
const findUserByEmail = async (email) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) throw error;
  return data;
};

/**
 * Obtener todos los usuarios
 * @returns {Promise<Array>}
 */
const findUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('id, nombre, apellido, email, rol, email_verified, created_at');

  if (error) throw error;
  return data;
};

/**
 * Marca el email de un usuario como verificado
 * @param {number} id
 * @returns {Promise<void>}
 */
const updateEmailVerify = async (id) => {
  const { error } = await supabase
    .from('users')
    .update({ email_verified: true })
    .eq('id', id);

  if (error) throw error;
};

/**
 * Obtiene todos los usuarios con rol de técnico
 * @returns {Promise<Array>}
 */
const findTecnicos = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('id, nombre, apellido, email')
    .eq('rol', 'tecnico');

  if (error) throw error;
  return data;
};

/**
 * Busca un usuario por su ID
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
const findUserById = async (id) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, nombre, apellido, email, rol')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
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
