

async function main() {
  try {
    const res = await fetch('http://localhost:3000/api/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'MoisesTest',
        apellido: 'Prueba',
        email: 'moises.test' + Date.now() + '@example.com',
        password: 'Password123!'
      })
    });
    
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', text);
  } catch (err) {
    console.error(err);
  }
}

main();
