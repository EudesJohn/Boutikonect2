// ============================================================
// BoutiKonect ML Assistant — Intent Classifier & Entity Extractor
// ============================================================
//
// Utilise des patterns regex, une analyse lexicale, et un scoring
// pour classifier l'intention de l'utilisateur et extraire les
// entités clés de sa question.

// -------------------------------------------------------------------
// INTENT DEFINITIONS
// -------------------------------------------------------------------

export const INTENTS = {
  // Achats
  BUY_PRODUCT: 'buy_product',
  ASK_HOW_TO_BUY: 'ask_how_to_buy',
  ASK_ORDER_STATUS: 'ask_order_status',
  CANCEL_ORDER: 'cancel_order',
  ASK_CART: 'ask_cart',
  GUEST_CHECKOUT: 'guest_checkout',

  // Vente
  BECOME_SELLER: 'become_seller',
  PUBLISH_ANNOUNCEMENT: 'publish_announcement',
  ASK_SELLER_STATS: 'ask_seller_stats',
  ASK_COMMISSION: 'ask_commission',

  // Livraison
  ASK_DELIVERY_INFO: 'ask_delivery_info',
  ASK_DELIVERY_COST: 'ask_delivery_cost',

  // Paiement
  ASK_PAYMENT_METHODS: 'ask_payment_methods',
  ASK_PAYMENT_SECURITY: 'ask_payment_security',
  ASK_REFUND: 'ask_refund',

  // Compte
  CREATE_ACCOUNT: 'create_account',
  LOGIN_HELP: 'login_help',
  RESET_PASSWORD: 'reset_password',
  MODIFY_PROFILE: 'modify_profile',

  // Recherche
  SEARCH_PRODUCTS: 'search_products',
  SEARCH_SERVICES: 'search_services',
  NEARBY_SEARCH: 'nearby_search',

  // Avis
  ASK_REVIEWS: 'ask_reviews',
  GIVE_REVIEW: 'give_review',

  // Support
  CONTACT_SUPPORT: 'contact_support',
  REPORT_ISSUE: 'report_issue',

  // Général
  GREETING: 'greeting',
  ASK_FEATURES: 'ask_features',
  FAREWELL: 'farewell',
  THANKS: 'thanks',
  ASK_HELP: 'ask_help',
  ASK_ASSISTANT_INFO: 'ask_assistant_info',
  UNKNOWN: 'unknown',
};

/** Labels lisibles pour chaque intention */
export const intentLabels = {
  [INTENTS.BUY_PRODUCT]: 'Acheter un produit',
  [INTENTS.ASK_HOW_TO_BUY]: 'Comment acheter',
  [INTENTS.ASK_ORDER_STATUS]: 'Suivi commande',
  [INTENTS.CANCEL_ORDER]: 'Annuler commande',
  [INTENTS.ASK_CART]: 'Panier',
  [INTENTS.GUEST_CHECKOUT]: 'Commander sans compte',
  [INTENTS.BECOME_SELLER]: 'Devenir vendeur',
  [INTENTS.PUBLISH_ANNOUNCEMENT]: 'Publier annonce',
  [INTENTS.ASK_SELLER_STATS]: 'Stats vendeur',
  [INTENTS.ASK_COMMISSION]: 'Commission',
  [INTENTS.ASK_DELIVERY_INFO]: 'Infos livraison',
  [INTENTS.ASK_DELIVERY_COST]: 'Frais livraison',
  [INTENTS.ASK_PAYMENT_METHODS]: 'Moyens paiement',
  [INTENTS.ASK_PAYMENT_SECURITY]: 'Sécurité paiement',
  [INTENTS.ASK_REFUND]: 'Remboursement',
  [INTENTS.CREATE_ACCOUNT]: 'Créer compte',
  [INTENTS.LOGIN_HELP]: 'Aide connexion',
  [INTENTS.RESET_PASSWORD]: 'Mot de passe',
  [INTENTS.MODIFY_PROFILE]: 'Modifier profil',
  [INTENTS.SEARCH_PRODUCTS]: 'Rechercher produits',
  [INTENTS.SEARCH_SERVICES]: 'Rechercher services',
  [INTENTS.NEARBY_SEARCH]: 'Recherche proximité',
  [INTENTS.ASK_REVIEWS]: 'Avis produits',
  [INTENTS.GIVE_REVIEW]: 'Donner avis',
  [INTENTS.CONTACT_SUPPORT]: 'Contacter support',
  [INTENTS.REPORT_ISSUE]: 'Signaler',
  [INTENTS.GREETING]: 'Salutation',
  [INTENTS.ASK_FEATURES]: 'Fonctionnalités',
  [INTENTS.FAREWELL]: 'Au revoir',
  [INTENTS.THANKS]: 'Remerciement',
  [INTENTS.ASK_HELP]: 'Demande aide',
  [INTENTS.ASK_ASSISTANT_INFO]: 'Infos assistant',
  [INTENTS.UNKNOWN]: 'Non identifié',
};

// -------------------------------------------------------------------
// ENTITY PATTERNS — Extraction d'entités nommées
// -------------------------------------------------------------------

/** Prix en FCFA ou avec symbole */
const PRICE_PATTERN = /(\d{1,3}(?:[.\s]?\d{3})*(?:\s?(?:FCFA|francs?|CFA|fcfa))?)/g;

/** Catégories de produits/services */
const CATEGORY_KEYWORDS = [
  'vêtements', 'mode', 'électronique', 'téléphone', 'ordinateur', 'maison',
  'décoration', 'beauté', 'bien-être', 'alimentation', 'sport', 'loisir',
  'jouet', 'jeux', 'livre', 'fourniture', 'artisanat', 'auto', 'moto',
  'service', 'cours', 'réparation', 'coiffure', 'photographie', 'livraison',
  'informatique', 'nettoyage', 'événement', 'consultation', 'éducation',
];

/** Villes du Bénin */
const CITY_KEYWORDS = [
  'cotonou', 'porto-novo', 'parakou', 'abomey-calavi', 'calavi', 'abomey',
  'bohicon', 'lokossa', 'natitingou', 'djougou', 'kandi', 'ouidah',
  'grand-popo', 'allada', 'dassa', 'savalou', 'pobè', 'malanville',
];

// -------------------------------------------------------------------
// INTENT PATTERNS — Classification par expressions régulières
// -------------------------------------------------------------------

const intentPatterns = [
  // --- Salutations ---
  {
    intent: INTENTS.GREETING,
    patterns: [
      /^(bonjour|salut|bonsoir|coucou|hey|hello|hi|cc|bon matin)\b/i,
      /^(bonne\s+(nuit|journée|soirée))\b/i,
    ],
    priority: 1,
  },

  // --- Remerciements ---
  {
    intent: INTENTS.THANKS,
    patterns: [
      /^(merci|thanks|thank you)\b/i,
      /merci (beaucoup|bien|infiniment)\b/i,
    ],
    priority: 1,
  },

  // --- Au revoir ---
  {
    intent: INTENTS.FAREWELL,
    patterns: [
      /^(au revoir|bye|ciao|adieu)\b/i,
      /(à (bientôt|plus tard|tout à l'heure|la prochaine))\b/i,
      /bonne (journée|soirée|nuit)\b/i,
    ],
    priority: 1,
  },

  // --- Achat ---
  {
    intent: INTENTS.ASK_HOW_TO_BUY,
    patterns: [
      /comment (acheter|commander|passer commande|faire un achat)/i,
      /procédure (d'achat|de commande)/i,
      /étapes (pour |d')(achat|e commande)/i,
    ],
    priority: 5,
  },
  {
    intent: INTENTS.BUY_PRODUCT,
    patterns: [
      /(je veux|je voudrais|je cherche) (acheter|commander)\b/i,
      /où (acheter|trouver| commander)/i,
      /combien (coûte|coûte le|coûte la)\b/i,
      /(prix|tarif) (du |de la |de l'|des? )/i,
    ],
    priority: 4,
  },
  {
    intent: INTENTS.ASK_ORDER_STATUS,
    patterns: [
      /(statut|suivi|état|avancement) (de |de la |de mon|de ma)? ?(commande|livraison|colis)/i,
      /où (est |se trouve )?(ma |la )?commande/i,
      /quand (est-ce que )?(ma )?commande (va |sera )?(arriver|livrée?)/i,
      /suivi (de |d')?(commande|colis)/i,
    ],
    priority: 6,
  },
  {
    intent: INTENTS.CANCEL_ORDER,
    patterns: [
      /annuler (ma |la )?commande/i,
      /annulation (de |d')?(commande|achat)/i,
      /(je veux|je voudrais) annuler/i,
    ],
    priority: 6,
  },
  {
    intent: INTENTS.ASK_CART,
    patterns: [
      /(mon |le )?panier/i,
      /ajouter au panier/i,
      /voir (mon |le )?panier/i,
      /(supprimer|enlever|vider) (le |mon |du )?panier/i,
    ],
    priority: 5,
  },
  {
    intent: INTENTS.GUEST_CHECKOUT,
    patterns: [
      /(commander|acheter) (sans |en tant qu')(compte|inscription|invité|anonyme)/i,
      /sans (compte|inscription|me connecter)/i,
      /pas (besoin |nécessité )(de |d')(compte|inscription)/i,
      /guest\s*(checkout|commande)?/i,
    ],
    priority: 7,
  },

  // --- Vente ---
  {
    intent: INTENTS.BECOME_SELLER,
    patterns: [
      /devenir (vendeur|marchand|commerçant|prestataire)/i,
      /comment (vendre|devenir vendeur)/i,
      /s'inscrire (en tant que |comme )?vendeur/i,
      /(créer|ouvrir) (une |ma |la )?boutique/i,
    ],
    priority: 7,
  },
  {
    intent: INTENTS.PUBLISH_ANNOUNCEMENT,
    patterns: [
      /(publier|ajouter|mettre en ligne) (une |mon |un )?(annonce|produit|service)/i,
      /comment (publier|ajouter) (une |mon |un )?(annonce|produit|service)/i,
      /nouveau (produit|service|annonce)/i,
    ],
    priority: 6,
  },
  {
    intent: INTENTS.ASK_COMMISSION,
    patterns: [
      /commission/i,
      /frais (de |des )?vente/i,
      /combien (coûte|prend) (la plateforme|boutikonect)/i,
      /pourcentage (prélevé|commission)/i,
    ],
    priority: 6,
  },
  {
    intent: INTENTS.ASK_SELLER_STATS,
    patterns: [
      /(mes |les )?statistiques (de |des )?vente/i,
      /tableau de bord (vendeur|vente)?/i,
      /(mes |les )?ventes/i,
      /(revenus|bénéfices|chiffre d'affaires)/i,
    ],
    priority: 5,
  },

  // --- Livraison ---
  {
    intent: INTENTS.ASK_DELIVERY_INFO,
    patterns: [
      /(la |les? )?livraison\b/i,
      /comment (se fait |fonctionne |se passe )?(la )?livraison/i,
      /(délais?|temps) (de |d'|des )?livraison/i,
      /(livrer|transport|expédition|envoi)/i,
    ],
    priority: 5,
  },
  {
    intent: INTENTS.ASK_DELIVERY_COST,
    patterns: [
      /frais (de |d')?livraison/i,
      /combien (coûte |ça coûte )(la |les )?livraison/i,
      /tarif (de |des )?livraison/i,
      /prix (de |pour )?(la |les? )?livraison/i,
      /livraison (gratuite|offerte|payante)/i,
    ],
    priority: 6,
  },

  // --- Paiement ---
  {
    intent: INTENTS.ASK_PAYMENT_METHODS,
    patterns: [
      /moyen(s)? (de |des )?paiement/i,
      /comment (payer|régler|effectuer le paiement)/i,
      /(quels|quelles) (sont les )?moyens (de |des )?paiement/i,
      /(mtn|moov|orange) (money|mobile)?/i,
      /paiement (mobile|mobile money|par |à la livraison)/i,
    ],
    priority: 7,
  },
  {
    intent: INTENTS.ASK_PAYMENT_SECURITY,
    patterns: [
      /sécuris/i,
      /(est-ce que )?(le paiement |c'est )?(sécurisé|sûr|fiable)/i,
      /risque d'arnaque/i,
      /(fraude|vol|piratage) (sur |du )?/i,
      /protection (des |de |du )?paiement/i,
    ],
    priority: 6,
  },
  {
    intent: INTENTS.ASK_REFUND,
    patterns: [
      /rembours(e|ement)/i,
      /(être |se faire )?rembourser/i,
      /retour (produit|marchandise|colis)/i,
      /produit (défectueux|abîmé|cassé|non conforme|abime)/i,
      /politique (de |des )?remboursement/i,
    ],
    priority: 6,
  },

  // --- Compte ---
  {
    intent: INTENTS.CREATE_ACCOUNT,
    patterns: [
      /(créer|ouvrir) (un |mon )?compte/i,
      /(s'|comment s')inscrire/i,
      /inscription (sur |à )/i,
      /nouveau compte/i,
    ],
    priority: 6,
  },
  {
    intent: INTENTS.LOGIN_HELP,
    patterns: [
      /(se |me )?connecter/i,
      /(problème|impossible|n'arrive pas) (de |à )?(se |me )?connecter/i,
      /(login|sign in)/i,
      /(je n'ai plus|j'ai oublié) (mes |mon )?(identifiants|email|mot de passe)/i,
    ],
    priority: 5,
  },
  {
    intent: INTENTS.RESET_PASSWORD,
    patterns: [
      /mot de passe (oublié|perdu)/i,
      /réinitialiser (mon |le )?mot de passe/i,
      /changer (mon |de )?mot de passe/i,
      /(nouveau mot de passe|réinitialisation)/i,
    ],
    priority: 6,
  },
  {
    intent: INTENTS.MODIFY_PROFILE,
    patterns: [
      /modifier (mon |le )?profil/i,
      /changer (ma |la )?photo (de profil)?/i,
      /(éditer|mettre à jour) (mon |les )?(profil|compte|informations)/i,
      /paramètres (du |de mon )?compte/i,
    ],
    priority: 5,
  },

  // --- Recherche ---
  {
    intent: INTENTS.SEARCH_PRODUCTS,
    patterns: [
      /(je cherche|je veux trouver|je recherche) (un |des )?(produit|article)/i,
      /(où puis-je |où )?trouver (un |des |du )?(produit|article)/i,
      /(as-tu|avez-vous|tu as) (des |un )?produits?/i,
      /(cherche|recherche) (des |du |de la |d')/i,
    ],
    priority: 4,
  },
  {
    intent: INTENTS.SEARCH_SERVICES,
    patterns: [
      /(je cherche|je veux trouver|je recherche) (un |des )?service/i,
      /(où trouver|trouver) (un |des )?prestataire/i,
      /(as-tu|avez-vous) des services/i,
      /(besoin d'un |besoin de )?prestataire/i,
    ],
    priority: 4,
  },
  {
    intent: INTENTS.NEARBY_SEARCH,
    patterns: [
      /près de (chez moi|moi)/i,
      /autour de moi/i,
      /(à |de |dans )?proximité/i,
      /géolocalis/i,
      /dans (un rayon|une zone) (de )?/i,
      /(dans |à |depuis )?(mon |ma )?(ville|localité|quartier|commune)/i,
    ],
    priority: 5,
  },

  // --- Avis ---
  {
    intent: INTENTS.ASK_REVIEWS,
    patterns: [
      /avis (sur |des |de |du )?(produit|service|vendeur)/i,
      /(quelle |quelles sont les )?(note|évaluation|notation) (du |des |de )/i,
      /(ce |le )?produit (est-il |il est )? (bien noté|fiable|de qualité)/i,
    ],
    priority: 5,
  },
  {
    intent: INTENTS.GIVE_REVIEW,
    patterns: [
      /(donner|laisser|publier) (mon |un )?avis/i,
      /comment (noter|évaluer) (un |le )?(produit|service|vendeur)/i,
      /évaluations? (des |du )?(produit|service)/i,
    ],
    priority: 5,
  },

  // --- Support ---
  {
    intent: INTENTS.CONTACT_SUPPORT,
    patterns: [
      /(contacter|joindre|appeler) (le |l'|la )?(support|équipe|assistance|admin|service (client|après-vente))/i,
      /(numéro |adresse |email )?(téléphone|contact|email|whatsapp)/i,
      /(comment )?(joindre|contacter) boutikonect/i,
      /service (client|support|après-vente)/i,
    ],
    priority: 7,
  },
  {
    intent: INTENTS.REPORT_ISSUE,
    patterns: [
      /signaler (un |ce |cet |cette )?(produit|service|vendeur|utilisateur|abus|contenu)/i,
      /(produit|service) (frauduleux|faux|arnaque|contrefaçon)/i,
      /(comportement|message) (inapproprié|abusif|offensant)/i,
      /signaler/i,
    ],
    priority: 6,
  },

  // --- Assistant ---
  {
    intent: INTENTS.ASK_ASSISTANT_INFO,
    patterns: [
      /(c'est |qui )?(toi|tu es|vous êtes) (qui|?)/i,
      /qui (est-ce que tu )?(es|est)\??/i,
      /(tu es |c'est )?(un |une )?(ia|robot|assistant|bot|algorithme)/i,
      /comment (tu |vous )?(fonctionnes|marches|t'appelles)/i,
      /présente(-toi|z-vous)/i,
    ],
    priority: 5,
  },

  // --- Fonctionnalités ---
  {
    intent: INTENTS.ASK_FEATURES,
    patterns: [
      /(quelles|quels) (sont les )?(fonctionnalités|possibilités|options|services disponibles)/i,
      /que (pouvez|peux)(-tu|-vous)? (faire|proposer)/i,
      /liste (des |de )?fonctionnalités/i,
      /(tout |toutes )?ce (que |qu')?(tu |vous )?(peux|pouvez) faire/i,
    ],
    priority: 4,
  },

  // --- Aide générale ---
  {
    intent: INTENTS.ASK_HELP,
    patterns: [
      /(aidez|aide)-moi/i,
      /j'ai besoin (d'aide|de l'aide)/i,
      /par (où |ou )?commencer/i,
      /(je |c'est )?première fois/i,
      /guide (d'utilisation|débutant|démarrage)/i,
      /que (dois-je |puis-je |je peux )?faire/i,
    ],
    priority: 3,
  },
];

// -------------------------------------------------------------------
// SENTIMENT ANALYSIS
// -------------------------------------------------------------------

const negativeWords = [
  'problème', 'bug', 'erreur', 'marche pas', 'ne marche pas', 'cassé', 'déçu',
  'mauvais', 'terrible', 'horrible', 'énervé', 'fâché', 'colère', 'désolé',
  'triste', 'dommage', 'perte', 'volé', 'arnaque', 'escroquerie', 'fraude',
  'défectueux', 'abîmé', 'casse', 'lent', 'cher', 'trop cher',
];

const positiveWords = [
  'super', 'génial', 'excellent', 'parfait', 'merci', 'bravo', 'bien',
  'bon', 'bonne', 'content', 'satisfait', 'extra', 'formidable', 'cool',
  'sympa', 'pratique', 'rapide', 'efficace', 'utile', 'beau', 'belle',
  'joli', 'magnifique', 'incroyable', 'facile', 'simple',
];

/**
 * Analyse le sentiment d'un message.
 * @param {string} message
 * @returns {{sentiment: 'positive'|'negative'|'neutral', score: number}}
 */
export function detectSentiment(message) {
  const lower = message.toLowerCase();
  let positiveScore = 0;
  let negativeScore = 0;

  for (const word of positiveWords) {
    if (lower.includes(word)) positiveScore++;
  }
  for (const word of negativeWords) {
    if (lower.includes(word)) negativeScore++;
  }

  if (positiveScore > negativeScore) {
    return { sentiment: 'positive', score: positiveScore - negativeScore };
  }
  if (negativeScore > positiveScore) {
    return { sentiment: 'negative', score: negativeScore - positiveScore };
  }
  return { sentiment: 'neutral', score: 0 };
}

// -------------------------------------------------------------------
// ENTITY EXTRACTION
// -------------------------------------------------------------------

/**
 * Extrait les entités nommées d'un message.
 * @param {string} message
 * @returns {{ prices: string[], categories: string[], cities: string[], quantities: string[], products: string[] }}
 */
export function extractEntities(message) {
  const lower = message.toLowerCase();
  const entities = {
    prices: [],
    categories: [],
    cities: [],
    quantities: [],
    products: [],
  };

  // Prix
  const priceMatches = message.match(PRICE_PATTERN);
  if (priceMatches) {
    entities.prices = priceMatches.map(p => p.trim()).filter(p => {
      const num = parseInt(p.replace(/[^0-9]/g, ''));
      return num > 0 && num < 100000000;
    });
  }

  // Catégories
  for (const cat of CATEGORY_KEYWORDS) {
    if (lower.includes(cat)) {
      entities.categories.push(cat);
    }
  }

  // Villes
  for (const city of CITY_KEYWORDS) {
    if (lower.includes(city)) {
      entities.cities.push(city);
    }
  }

  // Produits (mots après "acheter", "produit", "cherche")
  const productPatterns = [
    /(acheter|produit|article|cherche) ([^.?!]+)/gi,
    /([^.?!]+?)(pas cher|remis|solde|promo|offre)/gi,
  ];
  for (const pattern of productPatterns) {
    const matches = message.match(pattern);
    if (matches) {
      for (const m of matches) {
        const words = m.replace(/(acheter|produit|article|cherche)\s*/gi, '').trim();
        if (words.length > 2 && words.length < 50) {
          entities.products.push(words);
        }
      }
    }
  }

  // Déduplication
  for (const key of Object.keys(entities)) {
    entities[key] = [...new Set(entities[key])];
  }

  return entities;
}

// -------------------------------------------------------------------
// INTENT CLASSIFICATION
// -------------------------------------------------------------------

/**
 * Classe l'intention principale d'un message utilisateur.
 * Utilise une combinaison de patterns regex et de scoring.
 *
 * @param {string} message - Le message de l'utilisateur
 * @returns {{ intent: string, label: string, confidence: number, entities: object, sentiment: object }}
 */
export function classifyIntent(message) {
  if (!message || typeof message !== 'string') {
    return {
      intent: INTENTS.UNKNOWN,
      label: intentLabels[INTENTS.UNKNOWN],
      confidence: 0,
      entities: {},
      sentiment: { sentiment: 'neutral', score: 0 },
    };
  }

  const normalized = message.toLowerCase().trim().replace(/\s+/g, ' ');
  if (normalized.length === 0) {
    return {
      intent: INTENTS.UNKNOWN,
      label: intentLabels[INTENTS.UNKNOWN],
      confidence: 0,
      entities: {},
      sentiment: { sentiment: 'neutral', score: 0 },
    };
  }

  // Extraire les entités
  const entities = extractEntities(message);
  const sentiment = detectSentiment(message);

  // Tester chaque pattern d'intention
  let bestMatch = {
    intent: INTENTS.UNKNOWN,
    confidence: 0,
    matchedPattern: null,
  };

  for (const entry of intentPatterns) {
    for (const pattern of entry.patterns) {
      if (pattern.test(normalized)) {
        const confidence = entry.priority / 10;
        if (confidence > bestMatch.confidence) {
          bestMatch = {
            intent: entry.intent,
            confidence: confidence,
            matchedPattern: pattern,
          };
        }
        break; // Un seul pattern par intention suffit
      }
    }
  }

  // Ajustement de confiance basé sur la longueur du message
  // Les messages très courts (< 5 mots) ont une confiance réduite
  const wordCount = normalized.split(/\s+/).length;
  if (wordCount < 3 && bestMatch.confidence > 0) {
    bestMatch.confidence = Math.min(bestMatch.confidence, 0.6);
  }

  // Bonus pour les messages avec des entités extraites
  if (bestMatch.confidence > 0) {
    const hasEntities = entities.categories.length > 0 || entities.cities.length > 0 || entities.prices.length > 0;
    if (hasEntities && wordCount >= 3) {
      bestMatch.confidence = Math.min(bestMatch.confidence + 0.1, 1.0);
    }
  }

  // Si confiance trop faible, essayer une détection par mots-clés
  if (bestMatch.confidence < 0.3) {
    const keywordMatch = detectIntentByKeywords(normalized);
    if (keywordMatch.confidence > bestMatch.confidence) {
      bestMatch = keywordMatch;
    }
  }

  return {
    intent: bestMatch.intent,
    label: intentLabels[bestMatch.intent] || 'Non identifié',
    confidence: Math.round(bestMatch.confidence * 100) / 100,
    entities,
    sentiment,
  };
}

// -------------------------------------------------------------------
// KEYWORD-BASED FALLBACK
// -------------------------------------------------------------------

/**
 * Détection d'intention basée sur des mots-clés (fallback quand les patterns ne matchent pas).
 */
function detectIntentByKeywords(message) {
  const kw = message.toLowerCase();

  // Achats
  if ((/\b(acheter|commander|achat|prix|combien|coûte|cout|panier)\b/i.test(kw))) {
    return { intent: INTENTS.ASK_HOW_TO_BUY, confidence: 0.4, matchedPattern: null };
  }
  if (/\b(commande|suivi|statut|livraison|colis|livré|livree)\b/i.test(kw)) {
    return { intent: INTENTS.ASK_ORDER_STATUS, confidence: 0.4, matchedPattern: null };
  }

  // Vente
  if (/\b(vendre|vendeur|boutique|commission|annonce|publier)\b/i.test(kw)) {
    return { intent: INTENTS.BECOME_SELLER, confidence: 0.4, matchedPattern: null };
  }

  // Compte
  if (/\b(compte|inscription|inscrire|mot de passe|connexion|connecter|profil)\b/i.test(kw)) {
    return { intent: INTENTS.CREATE_ACCOUNT, confidence: 0.35, matchedPattern: null };
  }

  // Support
  if (/\b(contact|support|aide|assistance|problème|probleme|bug|erreur|signaler)\b/i.test(kw)) {
    return { intent: INTENTS.CONTACT_SUPPORT, confidence: 0.35, matchedPattern: null };
  }

  // Paiement
  if (/\b(paiement|payer|mobile money|mtn|moov|orange money|remboursement|facture|recu)\b/i.test(kw)) {
    return { intent: INTENTS.ASK_PAYMENT_METHODS, confidence: 0.35, matchedPattern: null };
  }

  return { intent: INTENTS.UNKNOWN, confidence: 0.1, matchedPattern: null };
}

// -------------------------------------------------------------------
// UTILITY
// -------------------------------------------------------------------

/**
 * Vérifie si un message est une question sur un sujet spécifique.
 * @param {string} message
 * @param {string[]} topics
 * @returns {boolean}
 */
export function isAboutTopics(message, topics) {
  const lower = message.toLowerCase();
  return topics.some(topic => {
    if (lower.includes(topic.toLowerCase())) return true;
    // Vérifie aussi les mots-clés associés connus
    const related = topicSynonyms[topic.toLowerCase()] || [];
    return related.some(syn => lower.includes(syn));
  });
}

/** Synonymes par thème */
const topicSynonyms = {
  achat: ['acheter', 'commander', 'achat', 'panier', 'prix', 'commande'],
  vente: ['vendre', 'vendeur', 'boutique', 'annonce', 'publier', 'commission'],
  livraison: ['livrer', 'transport', 'colis', 'expédition', 'envoi'],
  paiement: ['payer', 'mobile money', 'mtn', 'moov', 'remboursement'],
  compte: ['inscription', 'connexion', 'profil', 'mot de passe'],
};

export default classifyIntent;
