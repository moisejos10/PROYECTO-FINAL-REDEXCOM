import db from './db/index.js';
import bcrypt from 'bcrypt';

async function resetAdmin() {
  // 1. Borra todos los datos existentes (limpieza total)
  db.prepare('DELETE FROM sessions').run();
  db.prepare('DELETE FROM verification_codes').run();
  db.prepare('DELETE FROM tickets').run();
  db.prepare('DELETE FROM users').run();
  console.log('✅ Base de datos limpiada.');

  const insertUser = db.prepare(`
    INSERT INTO users (nombre, apellido, email, password_hash, rol, email_verified)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // 2. Crea el administrador principal
  const adminHash = await bcrypt.hash('admin123*', 10);
  insertUser.run('Moise', 'Sanchez', 'moisejos10@gmail.com', adminHash, 'admin', 1);
  console.log('👑 Admin creado       → moisejos10@gmail.com / admin123*');

  // 3. Técnicos de prueba (email_verified = 1 para saltarse la verificación)
  const techHash = await bcrypt.hash('tecnico123', 10);
  insertUser.run('carlos', 'rodriguez', 'carlos.rodriguez@redexcom.com', techHash, 'tecnico', 1);
  insertUser.run('Maria',  'Gonzalez',  'maria.gonzalez@redexcom.com',   techHash, 'tecnico', 1);
  insertUser.run('Jose',   'Martinez',  'jose.martinez@redexcom.com',     techHash, 'tecnico', 1);

  console.log('🔧 Técnico 1 creado   → carlos.rodriguez@redexcom.com / tecnico123');
  console.log('🔧 Técnico 2 creado   → maria.gonzalez@redexcom.com  / tecnico123');
  console.log('🔧 Técnico 3 creado   → jose.martinez@redexcom.com   / tecnico123');
  console.log('');
  console.log('🚀 Sistema listo para la presentacion!');
}

resetAdmin();
