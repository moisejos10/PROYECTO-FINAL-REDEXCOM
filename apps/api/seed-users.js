import db from './db/index.js';
import bcrypt from 'bcrypt';

async function seed() {
  const passwordHash = await bcrypt.hash('Password123!', 10);
  
  // Create admin
  const adminStmt = db.prepare(`
    INSERT INTO users (nombre, apellido, email, password_hash, rol, email_verified)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  // adminStmt.run('Admin', 'Principal', 'admin@redexcom.com', passwordHash, 'admin', 1);

  
  // Create technicia
  const techStmt = db.prepare(`
    INSERT INTO users (nombre, apellido, email, password_hash, rol, email_verified)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  // techStmt.run('Técnico', 'Uno', 'tecnico1@redexcom.com', passwordHash, 'tecnico', 1);
  techStmt.run('Marco', 'Perez', 'marcoperez123@gmail.com', passwordHash, 'tecnico', 1);
  console.log(' Usuarios de prueba creados:');

}

seed();
