// ============================================================
// BoutiKonect ML Assistant — Main Engine
// ============================================================
//
// Orchestre la classification d'intention, la recherche dans
// la base de connaissances, les requêtes live, et la génération
// de réponses contextuelles avec scoring de confiance.

import Fuse from 'fuse.js';
import { knowledgeBase, topicLabels, contextFollowUps, suggestedQuestions } from './knowledge';
import { classifyIntent, INTENTS, intentLabels, detectSentiment } from './intent';
import * as dataQueries from './data-queries';

// -------------------------------------------------------------------
// CONSTANTS
// -------------------------------------------------------------------

const CONFIDENCE_HIGH = 0.75;
const CONFIDENCE_MEDIUM = 0.5;
const CONFIDENCE_LOW = 0.3;

const MAX_CONTEXT_TURNS = 6; // mémoire de conversation (tours)

// -------------------------------------------------------------------
// FUSE INDEX — Recherche floue optimisée
// -------------------------------------------------------------------

let _fuseIndex = null;

function getFuseIndex() {
  if (!_fuseIndex) {
    const docs = [];
    for (const entry of knowledgeBase) {
      // Chaque mot-clé devient un document
      for (const kw of entry.keywords) {
        docs.push({
          text: kw.toLowerCase(),
          entry,
          type: 'keyword',
          topic: entry.topic,
        });
      }
      // Patterns comme documents
      for (const pat of entry.patterns || []) {
        docs.push({
          text: pat.source.toLowerCase(),
          entry,
          type: 'pattern',
          topic: entry.topic,
        });
      }
      // Topic entier comme document
      docs.push({
        text: entry.topic.toLowerCase(),
        entry,
        type: 'topic',
        subtopic: entry.subtopic || '',
      });
      // Subtopic
      if (entry.subtopic) {
        docs.push({
          text: entry.subtopic.toLowerCase(),
          entry,
          type: 'subtopic',
        });
      }
    }

    _fuseIndex = new Fuse(docs, {
      keys: ['text'],
      threshold: 0.38,      // assez permissif pour des phrases naturelles
      distance: 120,
      includeScore: true,
      minMatchCharLength: 2,
      shouldSort: true,
      findAllMatches: false,
    });
  }
  return _fuseIndex;
}

// -------------------------------------------------------------------
// CONVERSATION CONTEXT
// -------------------------------------------------------------------

/**
 * Gère le contexte de conversation.
 */
class ConversationMemory {
  constructor() {
    this.history = [];
    this.lastIntent = null;
    this.lastEntities = {};
    this.topicStack = [];   // sujets abordés (FILO)
    this.userName = null;
  }

  addTurn(message, response, intent, entities) {
    this.history.push({
      message,
      response,
      intent,
      entities,
      timestamp: Date.now(),
    });

    // Garder seulement les N derniers tours
    if (this.history.length > MAX_CONTEXT_TURNS) {
      this.history.shift();
    }

    this.lastIntent = intent;
    this.lastEntities = entities || {};

    // Mettre à jour la pile de sujets
    if (intent && intent !== 'unknown') {
      this.topicStack = this.topicStack.filter(t => t !== intent);
      this.topicStack.push(intent);
      if (this.topicStack.length > 4) this.topicStack.shift();
    }
  }

  getLastMessage() {
    return this.history.length > 0 ? this.history[this.history.length - 1] : null;
  }

  getContextSummary() {
    if (this.history.length === 0) return null;
    return {
      lastTurns: this.history.slice(-3),
      currentTopics: this.topicStack.slice(-2),
      lastIntent: this.lastIntent,
    };
  }

  /**
   * Détecte si le message est une réponse à la question précédente
   * (follow-up naturel comme "oui", "non", "combien", "comment")
   */
  isFollowUp(message) {
    const lower = message.toLowerCase().trim();
    const followUpMarkers = [
      'oui', 'non', 'ok', 'd\'accord', 'daccord', 'combien',
      'comment', 'pourquoi', 'alors', 'et', 'mais', 'donc',
      'je veux', 'je voudrais', 'encore', 'aussi', 'vraiment',
    ];
    return followUpMarkers.some(marker => lower.startsWith(marker))
      || lower.length < 20; // messages courts = souvent des follow-ups
  }
}

// Instance globale du contexte
let conversationMemory = new ConversationMemory();

// -------------------------------------------------------------------
// SCORING & MATCHING
// -------------------------------------------------------------------

/**
 * Calcule un score de similarité textuelle simple (basé sur les mots communs).
 * Utile en complément de Fuse.js.
 */
function computeTextSimilarity(message, keywords) {
  const msgWords = message.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const kwText = keywords.join(' ').toLowerCase();

  let matches = 0;
  for (const word of msgWords) {
    if (kwText.includes(word)) matches++;
  }

  return msgWords.length > 0 ? matches / Math.max(msgWords.length, 3) : 0;
}

/**
 * Recherche dans la base de connaissances avec stratégies multiples.
 */
function searchKnowledge(message) {
  const normalized = message.toLowerCase().trim();

  // STRATÉGIE 1: Pattern matching direct (le plus précis)
  for (const entry of knowledgeBase) {
    for (const pat of entry.patterns || []) {
      try {
        if (pat.test(normalized)) {
          return {
            entry,
            confidence: Math.min(0.95, 0.7 + entry.priority * 0.03),
            method: 'pattern',
          };
        }
      } catch (e) {
        // Regex invalide, on ignore
      }
    }
  }

  // STRATÉGIE 2: Fuse.js fuzzy search
  const fuse = getFuseIndex();
  const fuseResults = fuse.search(normalized);

  if (fuseResults.length > 0) {
    const best = fuseResults[0];
    if (best.score <= 0.38) {
      const confidence = Math.max(0.4, 1 - best.score * 1.5);
      const entry = best.item.entry;
      return {
        entry,
        confidence: Math.min(confidence, 0.9),
        method: 'fuse',
        score: best.score,
      };
    }
  }

  // STRATÉGIE 3: Correspondance par mots-clés (text similarity)
  let bestEntry = null;
  let bestScore = 0;

  for (const entry of knowledgeBase) {
    const kwScore = computeTextSimilarity(message, entry.keywords);

    // Bonus si le message contient des mots de l'intitulé du topic
    const topicBonus = computeTextSimilarity(message, [topicLabels[entry.topic] || entry.topic]);

    const totalScore = kwScore * 0.7 + topicBonus * 0.3;
    // Bonus de priorité
    const adjustedScore = totalScore * (0.5 + entry.priority * 0.05);

    if (adjustedScore > bestScore && adjustedScore > 0.15) {
      bestScore = adjustedScore;
      bestEntry = entry;
    }
  }

  if (bestEntry) {
    return {
      entry: bestEntry,
      confidence: Math.min(bestScore, 0.75),
      method: 'keyword',
    };
  }

  // STRATÉGIE 4: Contexte — si follow-up, utiliser le dernier sujet
  if (conversationMemory.isFollowUp(message)) {
    const lastTurn = conversationMemory.getLastMessage();
    if (lastTurn && lastTurn.intent) {
      // Chercher une entrée liée au dernier intent
      const contextEntry = knowledgeBase.find(e => e.context.includes(lastTurn.intent));
      if (contextEntry) {
        return {
          entry: contextEntry,
          confidence: 0.3,
          method: 'context',
        };
      }
    }
  }

  return null;
}

/**
 * Score de confiance final avec prise en compte multiple.
 */
function computeFinalConfidence(intentResult, knowledgeMatch, hasLiveData) {
  let confidence = 0;

  if (knowledgeMatch) {
    confidence = knowledgeMatch.confidence;
  }

  // Bonus si l'intention est clairement identifiée
  if (intentResult.confidence >= 0.7) {
    confidence = Math.max(confidence, intentResult.confidence * 0.8);
  }

  // Bonus si on a des données live
  if (hasLiveData) {
    confidence = Math.max(confidence, 0.6);
  }

  return Math.min(confidence, 1.0);
}

// -------------------------------------------------------------------
// HANDLERS — Gestionnaires spécialisés par intention
// -------------------------------------------------------------------

// Mapping des intentions vers leurs handlers
const intentHandlers = {
  // --- Recherche live ---
  [INTENTS.SEARCH_PRODUCTS]: async (message, intent) => {
    const entities = intent.entities;
    const query = entities.products?.[0] || entities.categories?.[0] || message.replace(/cherche|trouver|produit|article/gi, '').trim();
    const result = await dataQueries.searchProducts({
      query: query.length > 2 ? query : undefined,
      category: entities.categories?.[0],
      city: entities.cities?.[0],
    });
    return result.text;
  },

  [INTENTS.SEARCH_SERVICES]: async (message, intent) => {
    const entities = intent.entities;
    const query = entities.products?.[0] || entities.categories?.[0] || message.replace(/cherche|trouver|service|prestataire/gi, '').trim();
    const result = await dataQueries.searchServices({
      query: query.length > 2 ? query : undefined,
      category: entities.categories?.[0],
      city: entities.cities?.[0],
    });
    return result.text;
  },

  [INTENTS.NEARBY_SEARCH]: async (message, intent) => {
    const city = intent.entities?.cities?.[0];
    const result = await dataQueries.searchProducts({ city, limit: 5 });
    if (result.found) return result.text;
    return "**📍 Recherche de proximité :**\n\nPour voir les produits près de chez vous :\n1️⃣ Utilisez le filtre \"À proximité\" sur la page de recherche\n2️⃣ Activez la géolocalisation dans votre navigateur\n3️⃣ Choisissez un rayon (5 km, 10 km, 25 km)\n\n👉 Ou dites-moi votre ville !";
  },

  // --- Catégories & données générales ---
  [INTENTS.ASK_FEATURES]: async () => {
    return dataQueries.getPlatformStats();
  },
};

// -------------------------------------------------------------------
// MAIN ENGINE
// -------------------------------------------------------------------

/**
 * Traite un message utilisateur et génère une réponse.
 * Combine classification d'intention, recherche connaissances,
 * requêtes live, et contexte de conversation.
 *
 * @param {string} message - Message de l'utilisateur
 * @param {object} [options]
 * @param {boolean} [options.skipLiveQueries=false] - Évite les requêtes DB (mode déconnecté)
 * @returns {Promise<{text: string, confidence: number, intent: string, suggestions: string[], metadata: object}>}
 */
export async function processMessage(message, options = {}) {
  const startTime = Date.now();

  if (!message || typeof message !== 'string' || !message.trim()) {
    return {
      text: "Bonjour ! Je suis l'assistant BoutiKonect. Comment puis-je vous aider ?",
      confidence: 1,
      intent: INTENTS.GREETING,
      suggestions: suggestedQuestions.slice(0, 4),
      metadata: { processingTime: 0 },
    };
  }

  const trimmed = message.trim();
  const context = conversationMemory.getContextSummary();

  // Étape 1: Classification d'intention
  const intent = classifyIntent(trimmed);

  // Étape 2: Détection de sentiment
  const sentiment = detectSentiment(trimmed);

  // Étape 3: Recherche dans la base de connaissances
  const knowledgeMatch = searchKnowledge(trimmed);

  // Étape 4: Handler spécialisé pour les intentions qui nécessitent des données live
  let liveDataResponse = null;
  let hasLiveData = false;

  const handler = intentHandlers[intent.intent];
  if (handler && !options.skipLiveQueries) {
    try {
      liveDataResponse = await handler(trimmed, intent);
      hasLiveData = true;
    } catch (error) {
      console.error('[Assistant] Handler error:', error);
    }
  }

  // Étape 5: Génération de la réponse
  let response;
  let confidence;

  // Si on a des données live, les utiliser
  if (liveDataResponse) {
    response = liveDataResponse;
    confidence = Math.max(CONFIDENCE_HIGH, computeFinalConfidence(intent, knowledgeMatch, true));
  }
  // Sinon, utiliser la base de connaissances
  else if (knowledgeMatch && knowledgeMatch.confidence >= CONFIDENCE_LOW) {
    response = knowledgeMatch.entry.response;
    confidence = knowledgeMatch.confidence;

    // Adapter la réponse si sentiment négatif
    if (sentiment.sentiment === 'negative') {
      response = "Je comprends votre préoccupation. " + response;
    }

    // Messages courts avec follow-up personnalisé
    if (context && conversationMemory.isFollowUp(trimmed) && context.currentTopics?.length > 0) {
      const lastTopic = context.currentTopics[context.currentTopics.length - 1];
      const topicEntry = knowledgeBase.find(e => e.topic === lastTopic || e.id === lastTopic);
      if (topicEntry) {
        response = topicEntry.response;
        confidence = Math.max(confidence, 0.4);
      }
    }
  }
  // Salutations / remerciements : toujours répondre
  else if (intent.intent === INTENTS.GREETING || intent.intent === INTENTS.THANKS || intent.intent === INTENTS.FAREWELL) {
    const salutationEntry = knowledgeBase.find(e => {
      const keywords = e.keywords?.map(k => k.toLowerCase()) || [];
      return keywords.some(k => trimmed.toLowerCase().includes(k));
    });
    response = salutationEntry?.response || defaultResponses[intent.intent];
    confidence = 0.9;
  }
  // Fallback : réponse générique + suggestions
  else {
    response = getFallbackResponse(trimmed, intent, context);
    confidence = CONFIDENCE_LOW;
  }

  // Étape 6: Suggestions contextuelles
  const suggestions = getSuggestions(intent, knowledgeMatch);

  // Étape 7: Sauvegarder le contexte
  conversationMemory.addTurn(trimmed, response, intent.intent, intent.entities);

  const processingTime = Date.now() - startTime;

  return {
    text: response,
    confidence,
    intent: intent.intent,
    intentLabel: intent.label,
    suggestions,
    sentiment: sentiment.sentiment,
    metadata: {
      processingTime,
      matchMethod: knowledgeMatch?.method || 'fallback',
      entities: intent.entities,
    },
  };
}

// -------------------------------------------------------------------
// FALLBACK RESPONSE
// -------------------------------------------------------------------

/** Réponses par défaut pour les intentions spéciales */
const defaultResponses = {
  [INTENTS.GREETING]: `Bonjour ! 👋 Je suis l'assistant virtuel de **BoutiKonect**. Comment puis-je vous aider aujourd'hui ?\n\nVous pouvez me poser des questions sur :\n🛒 Les achats\n💼 La vente\n🚚 La livraison\n💳 Les paiements\n🔧 Les fonctionnalités\n\nOu tapez simplement ce que vous cherchez !`,
  [INTENTS.THANKS]: "De rien ! 😊 C'est un plaisir de vous aider. N'hésitez pas si vous avez d'autres questions.",
  [INTENTS.FAREWELL]: "Au revoir ! 👋 Merci d'avoir utilisé l'assistant BoutiKonect. Passez une excellente journée et revenez quand vous voulez !",
};

/**
 * Génère une réponse de fallback quand aucune correspondance n'est trouvée.
 */
function getFallbackResponse(message, intent, context) {
  // Message négatif : offrir du support
  if (intent.sentiment?.sentiment === 'negative') {
    return `Je vois que vous rencontrez un problème. 😔 Je veux vous aider !\n\n👉 Pouvez-vous me donner plus de détails ?\n👉 Vous pouvez aussi contacter notre support directement :\n   📧 contact@boutikonect.bj\n   💬 WhatsApp : +229 01 XX XX XX XX\n\nOu dites-moi simplement ce qui ne va pas.`;
  }

  // Message avec des entités de catégories
  if (intent.entities?.categories?.length > 0) {
    const cat = intent.entities.categories[0];
    return `**${cat}** — Bonne idée ! 😊\n\nPour voir les articles dans cette catégorie :\n1️⃣ Allez sur la page d'accueil\n2️⃣ Utilisez la barre de recherche\n3️⃣ Ou filtrez par catégorie directement\n\n👉 Je peux vous donner plus d'informations sur cette catégorie si vous voulez !`;
  }

  // Message avec une ville
  if (intent.entities?.cities?.length > 0) {
    const city = intent.entities.cities[0];
    return `**${city}** — Très bien ! 🏙️\n\nBoutiKonect est actif à ${city} ! Vous pouvez :\n• Parcourir les produits disponibles dans cette ville\n• Utiliser le filtre de localisation sur la page de recherche\n• Vous inscrire et préciser votre localisation pour voir les offres près de chez vous\n\n👉 Souhaitez-vous voir ce qui est disponible à ${city} ?`;
  }

  // Follow-up sur le sujet précédent
  if (context && context.currentTopics?.length > 0) {
    const lastTopic = context.currentTopics[context.currentTopics.length - 1];
    const topicLabel = intentLabels[lastTopic] || topicLabels[lastTopic] || 'ce sujet';
    return `Je suis là pour vous aider sur **${topicLabel}** ! 😊\n\nPourriez-vous préciser votre question ? Je peux vous donner des détails sur :\n💰 Les tarifs\n📝 Les étapes\n🤔 Les avantages\n\nDites-moi ce que vous voulez savoir exactement.`;
  }

  // Réponse générique
  return `Je n'ai pas bien compris votre demande. 🤔\n\nVoici les sujets sur lesquels je peux vous aider :\n\n🛒 **Achats** — Comment acheter, suivre une commande, panier\n💼 **Vente** — Devenir vendeur, publier, commission\n🚚 **Livraison** — Délais, frais, zones couvertes\n💳 **Paiement** — Moyens de paiement, sécurité, remboursement\n👤 **Compte** — Création, connexion, profil\n📋 **Catégories** — Voir ce qui est disponible\n\n👉 Pouvez-vous reformuler votre question avec plus de détails ?`;
}

// -------------------------------------------------------------------
// SUGGESTIONS
// -------------------------------------------------------------------

/**
 * Génère des suggestions contextuelles basées sur l'intention et le match.
 */
function getSuggestions(intent, knowledgeMatch) {
  // Suggestions par défaut
  const defaultSuggestions = suggestedQuestions.slice(0, 4);

  // Intentions spécifiques → suggestions personnalisées
  const intentSuggestions = {
    [INTENTS.ASK_HOW_TO_BUY]: ['Comment puis-je payer ?', 'Délais de livraison', 'Puis-je commander sans compte ?', 'Voir les catégories'],
    [INTENTS.BECOME_SELLER]: ['Commission vendeur', 'Comment publier une annonce ?', 'Conseils pour bien vendre', 'Tableau de bord'],
    [INTENTS.ASK_PAYMENT_METHODS]: ['Paiement sécurisé ?', 'Remboursement', 'Paiement à la livraison', 'Mobile Money'],
    [INTENTS.ASK_DELIVERY_INFO]: ['Frais de livraison', 'Délais express', 'Zones couvertes', 'Point de retrait'],
    [INTENTS.ASK_DELIVERY_COST]: ['Délais de livraison', 'Livraison gratuite', 'Zones couvertes', 'Contact support'],
    [INTENTS.CREATE_ACCOUNT]: ['Mot de passe oublié', 'Connexion Google', 'Modifier mon profil', 'Devenir vendeur'],
    [INTENTS.CONTACT_SUPPORT]: ['Signaler un abus', 'Problème commande', 'Horaires support', 'WhatsApp'],
    [INTENTS.ASK_REVIEWS]: ['Donner mon avis', 'Meilleurs produits', 'Catégories populaires', 'Contact support'],
  };

  const custom = intentSuggestions[intent.intent];
  if (custom) return custom;

  // Suggestions basées sur le contexte de l'entrée de connaissance
  if (knowledgeMatch?.entry?.context) {
    const contextTags = knowledgeMatch.entry.context;
    for (const tag of contextTags) {
      const followUps = contextFollowUps[tag];
      if (followUps) return followUps;
    }
  }

  return defaultSuggestions;
}

// -------------------------------------------------------------------
// PUBLIC API
// -------------------------------------------------------------------

/**
 * Réinitialise la mémoire de conversation.
 */
export function resetConversation() {
  conversationMemory = new ConversationMemory();
}

/**
 * Obtient un résumé de la conversation en cours.
 */
export function getConversationSummary() {
  return conversationMemory.getContextSummary();
}

/**
 * Renvoie les questions suggérées pour un nouvel utilisateur.
 */
export function getSuggestedQuestions() {
  return suggestedQuestions;
}

/**
 * Compte le nombre d'entrées dans la base de connaissances.
 */
export function getKnowledgeStats() {
  const topics = {};
  knowledgeBase.forEach(e => {
    topics[e.topic] = (topics[e.topic] || 0) + 1;
  });
  return {
    totalEntries: knowledgeBase.length,
    topicsCount: Object.keys(topics).length,
    topics,
  };
}

export default {
  processMessage,
  resetConversation,
  getConversationSummary,
  getSuggestedQuestions,
  getKnowledgeStats,
};
