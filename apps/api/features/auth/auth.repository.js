import supabase from '../../db/index.js';

/**
 * Crea una sesión
 * @param {Object} payload
 * @param {string} payload.jwtid - El id del token
 * @param {number} payload.userId - El id del usuario
 * @returns {Promise<Object>}
 */
const createSession = async ({ jwtid, userId }) => {
  const { data, error } = await supabase
    .from('sessions')
    .insert({ jwtid, user_id: userId })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Encuentra una sesión por su id de JWT
 * @param {Object} payload
 * @param {string} payload.jwtid
 * @returns {Promise<Object|null>}
 */
const findSessionByJwtId = async ({ jwtid }) => {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('jwtid', jwtid)
    .maybeSingle();

  if (error) throw error;
  return data;
};

/**
 * Elimina una sesión basandose en el id de la sesión
 * @param {number} id
 * @returns {Promise<void>}
 */
const deleteSession = async (id) => {
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

/**
 * Actualiza el JWT de una sesión en la base de datos
 * @param {Object} payload
 * @param {string} payload.jwtid
 * @param {number} payload.id
 * @returns {Promise<void>}
 */
const updateSessionJwtId = async ({ jwtid, id }) => {
  const { error } = await supabase
    .from('sessions')
    .update({ jwtid })
    .eq('id', id);

  if (error) throw error;
};

const authRepository = { createSession, findSessionByJwtId, deleteSession, updateSessionJwtId };
export default authRepository;
