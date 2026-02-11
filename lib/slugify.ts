/**
 * Convertit un texte en slug URL-friendly
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')        // Remplacer espaces et underscores par -
    .replace(/[^\w\-]+/g, '')       // Supprimer caractères non-alphanumériques
    .replace(/\-\-+/g, '-')         // Remplacer multiple - par un seul
    .replace(/^-+/, '')             // Supprimer - du début
    .replace(/-+$/, '');            // Supprimer - de la fin
}

/**
 * Génère un slug pour un client basé sur l'ID et le surnom
 */
export function generateClientSlug(id: number | string, nickname?: string | null, surname?: string | null, firstName?: string | null): string {
  const name = nickname || `${surname || ''} ${firstName || ''}`.trim() || 'client';
  const slug = slugify(name);
  return `${id}-${slug}`;
}

/**
 * Extrait l'ID d'un slug
 */
export function extractIdFromSlug(slug: string): string {
  return slug.split('-')[0];
}
