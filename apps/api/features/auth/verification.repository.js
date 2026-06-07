import supabase from '../../db/index.js';

/**
 * Crea un código de verificación
 * @param {Object} payload
 * @param {string} payload.code - El código de 6 dígitos
 * @param {number} payload.userId - El id del usuario
 * @param {string} payload.expiresAt - Fecha de expiración ISO
 * @returns {Promise<Object>}
 */
const createCode = async ({ code, userId, expiresAt }) => {
  // Eliminar códigos anteriores del usuario
  await supabase
    .from('verification_codes')
    .delete()
    .eq('user_id', userId);

  const { data, error } = await supabase
    .from('verification_codes')
    .insert({ code, user_id: userId, expires_at: expiresAt })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Busca un código de verificación válido
 * @param {Object} payload
 * @param {string} payload.code - El código de 6 dígitos
 * @param {number} payload.userId - El id del usuario
 * @returns {Promise<Object|null>}
 */
const findValidCode = async ({ code, userId }) => {
  const { data, error } = await supabase
    .from('verification_codes')
    .select('*')
    .eq('code', code)
    .eq('user_id', userId)
    .eq('used', false)
    .maybeSingle();

  if (error) throw error;
  return data;
};

/**
 * Marca un código como usado
 * @param {number} id - El id del código
 * @returns {Promise<void>}
 */
const markAsUsed = async (id) => {
  const { error } = await supabase
    .from('verification_codes')
    .update({ used: true })
    .eq('id', id);

  if (error) throw error;
};

const verificationRepository = { createCode, findValidCode, markAsUsed };
export default verificationRepository;
