const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listCategories() {
  try {
    console.log('📊 Vérification des catégories créées...\n');
    
    // Lister toutes les catégories
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });

    console.log(`✅ ${categories.length} catégories trouvées:\n`);
    
    categories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.label} (${cat.name})`);
      console.log(`   • Description: ${cat.description || 'Aucune'}`);
      console.log(`   • Couleur: ${cat.color}`);
      console.log(`   • Icône: ${cat.icon || 'Aucune'}`);
      console.log(`   • Créée le: ${cat.createdAt.toLocaleDateString('fr-FR')}`);
      console.log('');
    });

    // Vérifier les assignations utilisateur
    console.log('👤 Vérification des assignations utilisateur...\n');
    
    const userCategories = await prisma.userCategory.findMany({
      include: {
        user: { select: { username: true, email: true } },
        category: { select: { name: true, label: true } }
      }
    });

    if (userCategories.length > 0) {
      console.log(`📋 ${userCategories.length} assignations trouvées:\n`);
      userCategories.forEach(uc => {
        console.log(`• ${uc.user.username} → ${uc.category.label}`);
      });
    } else {
      console.log('⚠️  Aucune assignation utilisateur trouvée');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listCategories();