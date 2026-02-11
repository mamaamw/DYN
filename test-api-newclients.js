const fetch = require('node-fetch');

async function testAPI() {
  try {
    // Simuler un appel avec un token (vous devrez utiliser votre vraie session)
    const res = await fetch('http://localhost:3000/api/newclients?search=TEST', {
      headers: {
        'Cookie': 'token=YOUR_TOKEN_HERE' // Remplacer par votre vrai token
      }
    });
    
    if (res.ok) {
      const data = await res.json();
      console.log('=== Réponse API complète ===');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.clients && data.clients.length > 0) {
        console.log('\n=== Premier client détaillé ===');
        const firstClient = data.clients[0];
        console.log('ID:', firstClient.id);
        console.log('Nickname:', firstClient.nickname);
        console.log('FirstName:', firstClient.firstName);
        console.log('Surname:', firstClient.surname);
        console.log('ContactIdentifiers:', JSON.stringify(firstClient.contactIdentifiers, null, 2));
        console.log('CustomId field:', firstClient.customId);
      }
    } else {
      console.error('Erreur:', res.status, res.statusText);
    }
  } catch (err) {
    console.error('Erreur:', err.message);
  }
}

testAPI();
