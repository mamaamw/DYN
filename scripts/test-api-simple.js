const http = require('http');

const postData = JSON.stringify({
  username: 'admin',
  password: 'Admin@2024'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Test de login API...\n');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
    try {
      const json = JSON.parse(data);
      if (json.error) {
        console.log('\n❌ Erreur:', json.error);
      } else if (json.token) {
        console.log('\n✅ Login réussi ! Token reçu.');
      }
    } catch (e) {
      console.log('Impossible de parser la réponse');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erreur de connexion:', error.message);
});

req.write(postData);
req.end();
