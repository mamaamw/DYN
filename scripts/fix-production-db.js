const { PrismaClient } = require('@prisma/client');

async function fixProductionDatabase() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Vérification de la structure de la base de données...');
    
    // Vérifier si la colonne phone existe
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'User' 
      AND column_name = 'phone'
    `;

    if (result.length === 0) {
      console.log('❌ La colonne "phone" n\'existe pas. Ajout en cours...');
      
      // Ajouter la colonne phone s'elle n'existe pas
      await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN "phone" TEXT`;
      console.log('✅ Colonne "phone" ajoutée avec succès');
    } else {
      console.log('✅ La colonne "phone" existe déjà');
    }

    // Vérifier la structure complète
    console.log('\n📋 Structure actuelle de la table User :');
    const userColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'User'
      ORDER BY ordinal_position
    `;

    console.table(userColumns);

    console.log('\n🎯 Test de connexion avec le modèle User...');
    const userCount = await prisma.user.count();
    console.log(`✅ Nombre total d'utilisateurs : ${userCount}`);

    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, username: true, email: true, role: true }
    });

    console.log(`\n👑 Utilisateurs Admin trouvés : ${adminUsers.length}`);
    adminUsers.forEach(admin => {
      console.log(`   - ${admin.username} (${admin.email})`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de la correction :', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
fixProductionDatabase()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });