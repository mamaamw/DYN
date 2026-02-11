const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function diagnosticAndFix() {
  try {
    console.log('🔍 DIAGNOSTIC - Pourquoi la table User se vide\n');

    // 1. Vérifier la connexion DB
    console.log('1. Test de connexion à la base de données...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Connexion DB OK\n');

    // 2. Vérifier les utilisateurs actuels
    console.log('2. Utilisateurs actuellement dans la DB :');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
    console.log(`📊 Nombre d'utilisateurs : ${users.length}`);
    users.forEach(user => {
      console.log(`   - ${user.username} (${user.email}) - ${user.role} - Créé: ${user.createdAt.toLocaleString()}`);
    });
    console.log();

    // 3. Créer un utilisateur admin si aucun n'existe
    if (users.length === 0) {
      console.log('3. Création d\'un utilisateur admin...');
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      
      const admin = await prisma.user.create({
        data: {
          email: 'Admin@dyn.com',
          password: hashedPassword,
          firstName: 'Admin',
          lastName: 'DYN',
          username: 'Admin',
          role: 'ADMIN',
          isActive: true,
          emailVerified: true,
          updatedAt: new Date()
        }
      });
      
      console.log(`✅ Admin créé avec l'ID : ${admin.id}`);
      console.log('🔑 Credentials : Admin / Admin@123\n');
    }

    // 4. Vérifier les transactions en attente
    console.log('4. Vérification des transactions...');
    try {
      await prisma.$queryRaw`SELECT * FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY' AND table_name = 'User'`;
      console.log('✅ Pas de problème de contraintes\n');
    } catch (error) {
      console.log('⚠️  Problème potentiel de contraintes\n');
    }

    // 5. Vérifier les migrations
    console.log('5. État des migrations :');
    try {
      const migrations = await prisma.$queryRaw`SELECT * FROM "_prisma_migrations" ORDER BY finished_at DESC LIMIT 5`;
      console.log(`📋 Dernières migrations : ${migrations.length}`);
      migrations.forEach(m => {
        console.log(`   - ${m.migration_name} : ${m.logs ? 'Avec logs' : 'OK'}`);
      });
    } catch (error) {
      console.log('⚠️  Impossible de lire les migrations');
    }
    console.log();

    // 6. Recommandations
    console.log('📋 RECOMMANDATIONS :');
    console.log('1. Évitez `npx prisma db push` en production');
    console.log('2. Utilisez `npx prisma migrate deploy` à la place');
    console.log('3. Vérifiez si un script ne vide pas la DB au démarrage');
    console.log('4. Vérifiez la variable DATABASE_URL');

  } catch (error) {
    console.error('❌ Erreur :', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnosticAndFix();