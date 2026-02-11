const { PrismaClient } = require('@prisma/client');

async function fixRoleColumn() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Converting role column from enum to text...');
    
    // Utiliser SQL brut pour convertir la colonne
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" 
      ALTER COLUMN role TYPE TEXT USING role::TEXT;
    `);
    
    // Supprimer l'enum s'il existe
    await prisma.$executeRawUnsafe(`
      DROP TYPE IF EXISTS "UserRole" CASCADE;
    `);
    
    console.log('✅ Role column converted successfully!');
    console.log('Checking users...');
    
    const users = await prisma.$queryRaw`
      SELECT id, username, role FROM "User" LIMIT 5;
    `;
    
    console.log('Sample users:', users);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixRoleColumn();
