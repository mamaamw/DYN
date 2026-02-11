const { PrismaClient } = require('@prisma/client');

async function restoreRoles() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Restoring user roles...');
    
    // Mettre à jour le premier utilisateur en ADMIN (basé sur l'username "Admin")
    await prisma.user.update({
      where: { username: 'Admin' },
      data: { role: 'ADMIN' }
    });
    
    console.log('✅ Admin role restored!');
    
    // Vérifier tous les utilisateurs
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true
      }
    });
    
    console.log('\nAll users:');
    users.forEach(user => {
      console.log(`- ${user.username} (${user.email}): ${user.role}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreRoles();
