/**
 * Category label mappings (English DB value → French display label)
 */

export const CATEGORY_LABELS = {
  // Product categories
  electronics: 'Electronique',
  clothing: 'Vetements',
  food_beverages: 'Alimentation',
  home_garden: 'Maison & Jardin',
  beauty_health: 'Beaute & Sante',
  sports: 'Sports',
  books: 'Livres',
  handicrafts: 'Artisanat',
  automotive: 'Vehicules',
  baby_kids: 'Jouets & Enfants',
  pet_supplies: 'Animaux',
  // Service categories
  home_repair: 'Services a domicile',
  it_support: 'Freelance & Digital',
  education_tutoring: 'Education & Formation',
  beauty_wellness: 'Sante & Bien-etre',
  delivery_logistics: 'Transport & Logistique',
  event_planning: 'Evenementiel',
  consulting: 'Conseil & Expertise',
  photography: 'Photographie',
  cleaning: 'Nettoyage',
  other: 'Autres',
};

export function getCategoryLabel(category) {
  return CATEGORY_LABELS[category] || category || '';
}
