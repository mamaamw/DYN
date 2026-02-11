const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugUserCategories() {
  try {
    console.log('=== DEBUG USER CATEGORIES ===\n');
    
    // Lister tous les utilisateurs
    console.log('👤 USERS:');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });
    
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Username: ${user.username}, Nom: ${user.firstName} ${user.lastName}, Role: ${user.role}`);
    });
    
    console.log('\n📂 CATEGORIES:');
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        description: true
      }
    });
    
    categories.forEach(cat => {
      console.log(`- ID: ${cat.id}, Name: ${cat.name}, Description: ${cat.description}`);
    });
    
    console.log('\n🔗 USER-CATEGORY ASSIGNMENTS:');
    const userCategories = await prisma.userCategory.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    if (userCategories.length === 0) {
      console.log('❌ Aucune assignation utilisateur-catégorie trouvée!');
    } else {
      userCategories.forEach(uc => {
        console.log(`- User ${uc.user.username} (${uc.user.firstName} ${uc.user.lastName}) → Category: ${uc.category.name}`);
      });
    }
    
    // Vérifier les catégories pour chaque utilisateur
    console.log('\n🔍 CATEGORIES BY USER:');
    for (const user of users) {
      const userCats = await prisma.userCategory.findMany({
        where: { userId: user.id },
        include: {
          category: {
            select: {
              name: true
            }
          }
        }
      });
      
      console.log(`User ${user.username}: ${userCats.length} catégories`);
      userCats.forEach(uc => {
        console.log(`  - ${uc.category.name}`);
      });
      
      if (userCats.length === 0) {
        console.log(`  ❌ Aucune catégorie assignée à ${user.username}`);
      }
    }
    
  } catch (error) {
    console.error('Erreur lors du debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugUserCategories();