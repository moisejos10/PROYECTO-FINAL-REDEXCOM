import supabase from './db/index.js';
import bcrypt from 'bcrypt';

async function resetAdmin() {
  try {
    console.log('⏳ Limpiando base de datos en Supabase...');

    // 1. Borrar datos en orden de dependencias de FK
    await supabase.from('ticket_cierres').delete().neq('id', 0);
    await supabase.from('ticket_comentarios').delete().neq('id', 0);
    await supabase.from('tickets').delete().neq('id', 0);
    await supabase.from('sessions').delete().neq('id', 0);
    await supabase.from('verification_codes').delete().neq('id', 0);
    await supabase.from('users').delete().neq('id', 0);
    
    console.log('✅ Base de datos limpiada.');

    // 2. Crear el administrador principal
    const adminHash = await bcrypt.hash('admin123*', 10);
    const { data: adminUser, error: adminErr } = await supabase
      .from('users')
      .insert({
        nombre: 'Moise',
        apellido: 'Sanchez',
        email: 'moisejos10@gmail.com',
        password_hash: adminHash,
        rol: 'admin',
        email_verified: true
      })
      .select()
      .single();

    if (adminErr) throw adminErr;
    console.log('💼 Admin creado → moisejos10@gmail.com / admin123*');

    // 3. Técnicos de prueba
    const techHash = await bcrypt.hash('tecnico123', 10);
    const tecnicos = [
      { nombre: 'carlos', apellido: 'rodriguez', email: 'carlos.rodriguez@redexcom.com', password_hash: techHash, rol: 'tecnico', email_verified: true },
      { nombre: 'Maria', apellido: 'Gonzalez', email: 'maria.gonzalez@redexcom.com', password_hash: techHash, rol: 'tecnico', email_verified: true },
      { nombre: 'Jose', apellido: 'Martinez', email: 'jose.martinez@redexcom.com', password_hash: techHash, rol: 'tecnico', email_verified: true }
    ];

    const { error: techErr } = await supabase
      .from('users')
      .insert(tecnicos);

    if (techErr) throw techErr;

    console.log('🛠️ Técnicos creados:');
    console.log('   → carlos.rodriguez@redexcom.com / tecnico123');
    console.log('   → maria.gonzalez@redexcom.com / tecnico123');
    console.log('   → jose.martinez@redexcom.com / tecnico123');
    console.log('');
    console.log('🚀 ¡Sistema listo para la presentación!');
  } catch (error) {
    console.error('❌ Error al resetear base de datos:', error);
  }
}

resetAdmin();
