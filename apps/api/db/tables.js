import db from './index.js';

const createUsersTable = async () => {
  const statement = db.prepare(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      email_verified BOOLEAN DEFAULT false
    )
  `);
  statement.run();
  console.log('Tabla de usuarios creada!');
};

const resetDb = async () => {
  db.prepare('DROP TABLE IF EXISTS users').run();
  console.log('Tablas eliminadas');
};

export const createTables = async () => {
  await resetDb();
  await createUsersTable();
  console.log('Tablas creadas exitosamente para Redexcom');
};

createTables();