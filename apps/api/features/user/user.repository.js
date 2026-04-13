// apps/api/features/user/user.repository.js
import db from '../../db/index.js';

// Función para guardar un nuevo usuario en la tabla
const createUser = async ({ email, passwordHash }) => {
  const smtm = db.prepare(`
    INSERT INTO users (email, password_hash)
    VALUES (?, ?) RETURNING *
  `);

  const createdUser = smtm.get(email, passwordHash);
  return createdUser;
};

// Función para buscar si un correo ya existe
const findUserByEmail = (email) => {
  const smtm = db.prepare('SELECT * FROM users WHERE email = ?');
  const user = smtm.get(email);
  return user;
};

const userRepository = {
  createUser,
  findUserByEmail,
};

export default userRepository;