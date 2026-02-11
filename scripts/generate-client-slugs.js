const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[\s_]+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

async function generateSlugs() {
  try {
    const clients = await prisma.newClient.findMany({
      where: {
        slug: null
      }
    });

    console.log(`${clients.length} clients sans slug trouvés`);

    for (const client of clients) {
      const name = client.nickname || `${client.surname || ''} ${client.firstName || ''}`.trim() || `client-${client.id}`;
      let baseSlug = slugify(name);
      let slug = baseSlug;
      let counter = 1;

      // Vérifier l'unicité et ajouter un suffixe si nécessaire
      while (true) {
        const existing = await prisma.newClient.findUnique({
          where: { slug }
        });

        if (!existing) break;

        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      await prisma.newClient.update({
        where: { id: client.id },
        data: { slug }
      });

      console.log(`✓ Client ${client.id}: ${slug}`);
    }

    console.log('\n✅ Tous les slugs ont été générés !');
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateSlugs();
