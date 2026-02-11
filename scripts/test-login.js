// Test de connexion avec username
const username = 'admin';
const password = 'Admin123!';

fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ username, password }),
})
  .then(response => response.json())
  .then(data => {
    console.log('Résultat de la connexion:');
    console.log(JSON.stringify(data, null, 2));
  })
  .catch(error => {
    console.error('Erreur:', error);
  });
