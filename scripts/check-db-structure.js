const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDBStructure() {
  try {
    // Exécuter une requête SQL brute pour voir la structure de la table
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'User'
      ORDER BY ordinal_position;
    `;
    
    console.log('Structure de la table User:');
    console.log(JSON.stringify(result, null, 2));
    
    // Essayer aussi de compter les utilisateurs
    const count = await prisma.user.count();
    console.log(`\nNombre d'utilisateurs: ${count}`);
    
  } catch (error) {
    console.error('Erreur:', error.message);
    console.error('Code:', error.code);
    if (error.meta) {
      console.error('Meta:', error.meta);
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkDBStructure();
