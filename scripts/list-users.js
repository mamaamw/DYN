const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listUsers() {
  try {
    console.log('📊 Récupération des utilisateurs...\n');
    
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });

    console.log(`👥 Total d'utilisateurs : ${users.length}\n`);
    
    if (users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé dans la base de données');
      return;
    }

    console.log('📋 Liste des utilisateurs :');
    console.log('═'.repeat(80));
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username || 'N/A'} (${user.email})`);
      console.log(`   Nom: ${user.firstName} ${user.lastName}`);
      console.log(`   Rôle: ${user.role}`);
      console.log(`   Actif: ${user.isActive ? '✅' : '❌'}`);
      console.log(`   Email vérifié: ${user.emailVerified ? '✅' : '❌'}`);
      console.log(`   Créé: ${user.createdAt.toLocaleString()}`);
      console.log(`   Dernière connexion: ${user.lastLogin ? user.lastLogin.toLocaleString() : 'Jamais'}`);
      console.log('─'.repeat(80));
    });

    // Statistiques
    const adminCount = users.filter(u => u.role === 'ADMIN').length;
    const activeCount = users.filter(u => u.isActive).length;
    
    console.log(`\n📊 Statistiques :`);
    console.log(`   Administrateurs : ${adminCount}`);
    console.log(`   Utilisateurs actifs : ${activeCount}`);

  } catch (error) {
    console.error('❌ Erreur :', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();