import db from './index.js';

const createUsersTable = () => {
  const statement = db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      apellido TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      rol TEXT NOT NULL DEFAULT 'tecnico',
      email_verified BOOLEAN DEFAULT false,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  statement.run();
  console.log('✅ Tabla de usuarios creada!');
};

const createSessionsTable = () => {
  const statement = db.prepare(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jwtid TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  statement.run();
  console.log('✅ Tabla de sesiones creada!');
};

const createVerificationCodesTable = () => {
  const statement = db.prepare(`
    CREATE TABLE IF NOT EXISTS verification_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      expires_at DATETIME NOT NULL,
      used BOOLEAN DEFAULT false,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  statement.run();
  console.log('✅ Tabla de códigos de verificación creada!');
};

const resetDb = () => {
  db.prepare('DROP TABLE IF EXISTS verification_codes').run();
  db.prepare('DROP TABLE IF EXISTS sessions').run();
  db.prepare('DROP TABLE IF EXISTS users').run();
  console.log('🗑️  Tablas eliminadas');
};

export const createTables = () => {
  resetDb();
  createUsersTable();
  createSessionsTable();
  createVerificationCodesTable();
  console.log('🚀 Todas las tablas creadas exitosamente!');
};

createTables();
