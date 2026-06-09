// ============================================================
// BoutiKonect ML Assistant — Live Database Queries
// ============================================================
//
// Module qui interroge Supabase en temps réel pour répondre
// aux questions sur les produits, services et autres données.
// Utilise les fonctions existantes de database.js avec un
// formatage adapté à l'assistant.

import { supabase } from '../supabase';
import {
  getProducts,
  getServices,
  getProductReviews,
  getServiceReviews,
} from '../database';

// -------------------------------------------------------------------
// HELPER — Limite de caractères pour les réponses
// -------------------------------------------------------------------
const MAX_RESPONSE_LENGTH = 800;

function truncate(text, max = MAX_RESPONSE_LENGTH) {
  if (!text || text.length <= max) return text || '';
  return text.substring(0, max).replace(/\s+\S*$/, '') + '...';
}

// -------------------------------------------------------------------
// CONSTANTES
// -------------------------------------------------------------------

/** Nombre max de résultats à retourner */
const MAX_RESULTS = 5;

/** Mapping des catégories en français */
const categoryLabels = {
  electronics: 'Électronique',
  fashion: 'Mode & Vêtements',
  home: 'Maison & Décoration',
  beauty: 'Beauté & Bien-être',
  food: 'Alimentation',
  sports: 'Sports & Loisirs',
  toys: 'Jouets & Jeux',
  books: 'Livres & Fournitures',
  crafts: 'Artisanat',
  automotive: 'Auto & Moto',
  services: 'Services',
  education: 'Cours & Éducation',
  repair: 'Réparation',
  photography: 'Photographie',
  delivery: 'Livraison',
  other: 'Autres',
};

// -------------------------------------------------------------------
// QUERY FUNCTIONS
// -------------------------------------------------------------------

/**
 * Recherche des produits par mot-clé, catégorie ou ville.
 * @param {object} params
 * @param {string} [params.query] - Mot-clé de recherche
 * @param {string} [params.category] - Catégorie
 * @param {string} [params.city] - Ville
 * @param {number} [params.maxPrice] - Prix maximum
 * @param {number} [params.limit] - Nombre de résultats
 * @returns {Promise<{found: boolean, text: string, data: Array}>}
 */
export async function searchProducts(params = {}) {
  try {
    const { query, category, city, maxPrice, limit = MAX_RESULTS } = params;

    const filters = {};
    if (query) filters.query = query;
    if (category) filters.category = category;
    if (city) filters.city = city;
    if (maxPrice) filters.maxPrice = maxPrice;
    filters.limit = limit;
    filters.status = 'active';

    const products = await getProducts(filters);

    if (!products || products.length === 0) {
      return {
        found: false,
        text: getNoResultsMessage(params),
        data: [],
      };
    }

    const count = products.length;
    const items = products.slice(0, MAX_RESULTS);

    let text = `**📦 ${count} produit(s) trouvé(s)**`;

    if (params.query) text += ` pour "${params.query}"`;
    if (params.city) text += ` à ${params.city}`;
    text += ' :\n\n';

    items.forEach((p, i) => {
      const price = formatPrice(p.price);
      const location = p.city ? ` — ${p.city}` : '';
      const rating = p.rating ? ` ⭐${p.rating}` : '';
      text += `${i + 1}. **${p.title}** — ${price}${location}${rating}\n`;
    });

    if (count > MAX_RESULTS) {
      text += `\n_Et ${count - MAX_RESULTS} autre(s) résultat(s). Utilisez la recherche pour voir tout._`;
    }

    text += '\n\n👉 Tapez "je veux [nom du produit]" pour plus de détails !';

    return {
      found: true,
      text,
      data: items,
    };
  } catch (error) {
    console.error('[Assistant] searchProducts error:', error);
    return {
      found: false,
      text: "Désolé, je n'ai pas pu rechercher les produits pour le moment. Veuillez réessayer plus tard ou utiliser la barre de recherche directement.",
      data: [],
    };
  }
}

/**
 * Recherche des services par mot-clé ou catégorie.
 * @param {object} params
 * @returns {Promise<{found: boolean, text: string}>}
 */
export async function searchServices(params = {}) {
  try {
    const { query, category, city, limit = MAX_RESULTS } = params;

    const filters = { status: 'active', limit };
    if (query) filters.query = query;
    if (category) filters.category = category;
    if (city) filters.city = city;

    const services = await getServices(filters);

    if (!services || services.length === 0) {
      return {
        found: false,
        text: getNoResultsMessage(params, 'services'),
        data: [],
      };
    }

    const count = services.length;
    const items = services.slice(0, MAX_RESULTS);

    let text = `**🔧 ${count} service(s) trouvé(s)**`;
    if (params.query) text += ` pour "${params.query}"`;
    text += ' :\n\n';

    items.forEach((s, i) => {
      const price = s.price ? formatPrice(s.price) : 'Prix à discuter';
      const location = s.city ? ` — ${s.city}` : '';
      const rating = s.rating ? ` ⭐${s.rating}` : '';
      text += `${i + 1}. **${s.title}** — ${price}${location}${rating}\n`;
    });

    if (count > MAX_RESULTS) {
      text += `\n_Et ${count - MAX_RESULTS} autre(s) résultat(s)._`;
    }

    text += '\n\n👉 Cliquez sur un service pour voir les détails complets !';

    return { found: true, text, data: items };
  } catch (error) {
    console.error('[Assistant] searchServices error:', error);
    return {
      found: false,
      text: "Désolé, je n'ai pas pu rechercher les services. Veuillez réessayer plus tard.",
      data: [],
    };
  }
}

/**
 * Récupère les tendances/mise en avant.
 * @returns {Promise<{found: boolean, text: string}>}
 */
export async function getTrendingProductsText() {
  try {
    const { supabase } = await import('../supabase');
    const { data, error } = await supabase.rpc('get_trending_products', {
      p_limit: 5,
    });

    if (error || !data || data.length === 0) {
      return {
        found: false,
        text: "Je n'ai pas pu récupérer les tendances actuellement.",
      };
    }

    let text = '**🔥 Produits à la une :**\n\n';
    data.slice(0, 5).forEach((p, i) => {
      text += `${i + 1}. **${p.title}** — ${formatPrice(p.price)}`;
      if (p.city) text += ` — ${p.city}`;
      if (p.is_promoted) text += ' 👑 Promu';
      text += '\n';
    });

    text += '\n👉 Découvrez-les sur la page d\'accueil !';

    return { found: true, text };
  } catch (error) {
    console.error('[Assistant] getTrending error:', error);
    return { found: false, text: '' };
  }
}

/**
 * Récupère les catégories de produits disponibles.
 * @returns {Promise<string>}
 */
export async function getProductCategories() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('category')
      .eq('status', 'active')
      .not('category', 'is', null);

    if (error || !data) {
      return getDefaultCategories();
    }

    const categories = [...new Set(data.map(p => p.category))].filter(Boolean).sort();

    if (categories.length === 0) {
      return getDefaultCategories();
    }

    const labels = categories.map(c => {
      const lower = c.toLowerCase();
      return categoryLabels[lower] || c.charAt(0).toUpperCase() + c.slice(1);
    });

    let text = '**📂 Catégories disponibles :**\n\n';
    labels.forEach((label, i) => {
      text += `• ${label}\n`;
    });
    text += '\n👉 Dites-moi quelle catégorie vous intéresse !';

    return text;
  } catch (error) {
    console.error('[Assistant] getCategories error:', error);
    return getDefaultCategories();
  }
}

function getDefaultCategories() {
  return `**📂 Catégories de produits :**

• Électronique (téléphones, ordinateurs, tablettes)
• Mode & Vêtements
• Maison & Décoration
• Beauté & Bien-être
• Alimentation & Produits locaux
• Sports & Loisirs
• Jouets & Jeux
• Livres & Fournitures
• Artisanat
• Auto & Moto

**🔧 Services :**
• Cours & Éducation
• Réparation & Entretien
• Coiffure & Esthétique
• Support Informatique
• Photographie & Vidéo
• Services de livraison

👉 Quelle catégorie vous intéresse ?`;
}

/**
 * Récupère les avis d'un produit.
 * @param {string} productId
 * @returns {Promise<{found: boolean, text: string}>}
 */
export async function getProductReviewsText(productId) {
  try {
    const reviews = await getProductReviews(productId);

    if (!reviews || reviews.length === 0) {
      return {
        found: false,
        text: 'Ce produit n\'a pas encore d\'avis. Soyez le premier à donner votre avis !',
      };
    }

    const avgRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);
    const distribution = getRatingDistribution(reviews);

    let text = `**⭐ Note moyenne : ${avgRating}/5 (${reviews.length} avis)**\n\n`;
    text += distribution;
    text += '\n**Avis récents :**\n\n';

    reviews.slice(0, 3).forEach(r => {
      const stars = '⭐'.repeat(r.rating);
      const name = r.reviewer?.full_name || 'Anonyme';
      text += `**${name}** ${stars}\n`;
      if (r.comment) text += `"${truncate(r.comment, 150)}"\n`;
      text += '\n';
    });

    return { found: true, text };
  } catch (error) {
    console.error('[Assistant] getReviews error:', error);
    return { found: false, text: 'Impossible de charger les avis pour le moment.' };
  }
}

/**
 * Compte le nombre de produits dans une catégorie.
 * @param {string} category
 * @returns {Promise<number>}
 */
export async function countProductsInCategory(category) {
  try {
    const { count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .ilike('category', `%${category}%`);

    if (error) return 0;
    return count || 0;
  } catch {
    return 0;
  }
}

/**
 * Obtient un message personnalisé "aucun résultat".
 */
function getNoResultsMessage(params, type = 'produits') {
  let msg = `**😕 Aucun ${type} trouvé`;

  if (params.query) msg += ` pour "${params.query}"`;
  if (params.category) msg += ` dans cette catégorie`;
  if (params.city) msg += ` à ${params.city}`;

  msg += `.**\n\nSuggestions :\n`;
  msg += `• Essayez d'autres mots-clés\n`;
  msg += `• Élargissez votre recherche (moins de filtres)\n`;
  msg += `• Parcourez les catégories depuis la page d'accueil\n`;
  msg += `• Utilisez le filtre de localisation pour voir plus d'offres\n\n👉 Je peux vous aider à affiner votre recherche !`;

  return msg;
}

// -------------------------------------------------------------------
// UTILITY FUNCTIONS
// -------------------------------------------------------------------

function formatPrice(price) {
  if (price == null || isNaN(price)) return 'Prix non spécifié';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price) + ' FCFA';
}

function getRatingDistribution(reviews) {
  const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => {
    const rating = Math.round(r.rating);
    if (rating >= 1 && rating <= 5) dist[rating]++;
  });

  let text = '';
  for (let i = 5; i >= 1; i--) {
    const pct = reviews.length > 0 ? (dist[i] / reviews.length) * 100 : 0;
    const bar = '█'.repeat(Math.round(pct / 10));
    const empty = '░'.repeat(10 - Math.round(pct / 10));
    text += `${i}★ ${bar}${empty} ${dist[i]}\n`;
  }
  return text;
}

/**
 * Informations générales sur la plateforme.
 */
export function getPlatformStats() {
  return `**📊 BoutiKonect en bref :**

✅ Mise en relation acheteurs-vendeurs au Bénin
📍 Couverture : **77 communes** dans **12 départements**
🛒 Produits & Services disponibles
💳 Paiement Mobile Money (MTN, Moov, Orange)
🚚 Livraison dans tout le pays
🔒 Transactions sécurisées
💰 Commission vendeur : **5%** seulement
🆓 Commande possible **sans compte**

👉 Comment puis-je vous aider ?`;
}

export default {
  searchProducts,
  searchServices,
  getTrendingProductsText,
  getProductCategories,
  getProductReviewsText,
  countProductsInCategory,
  getPlatformStats,
};
