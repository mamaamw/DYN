const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    // Nouveau mot de passe
    const newPassword = 'Admin@123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour l'admin
    const admin = await prisma.user.update({
      where: { username: 'admin' },
      data: { password: hashedPassword },
    });

    console.log('✅ Mot de passe admin mis à jour avec succès!');
    console.log('Nouveau mot de passe: Admin@123');
    console.log('Username:', admin.username);
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
