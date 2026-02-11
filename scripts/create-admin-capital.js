const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    // Vérifier si l'utilisateur Admin existe déjà
    const existingAdmin = await prisma.user.findFirst({
      where: { username: 'Admin' }
    });

    if (existingAdmin) {
      console.log('L\'utilisateur Admin existe déjà');
      // Mettre à jour le mot de passe si nécessaire
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { 
          password: hashedPassword,
          isActive: true,
          emailVerified: true
        }
      });
      console.log('✅ Mot de passe Admin mis à jour: Admin@123');
    } else {
      // Créer un mot de passe hashé
      const hashedPassword = await bcrypt.hash('Admin@123', 10);

      // Créer l'utilisateur Admin
      const admin = await prisma.user.create({
        data: {
          username: 'Admin',
          email: 'Admin@dyn.com',
          password: hashedPassword,
          firstName: 'Admin',
          lastName: 'DYN',
          role: 'ADMIN',
          isActive: true,
          emailVerified: true,
          updatedAt: new Date(),
        },
      });

      console.log('✅ Utilisateur Admin créé avec succès!');
      console.log('Nom d\'utilisateur: Admin');
      console.log('Mot de passe: Admin@123');
      console.log('Email:', admin.email);
    }
  } catch (error) {
    console.error('Erreur lors de la création/mise à jour de l\'Admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();