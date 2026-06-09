// ============================================================
// BoutiKonect ML Assistant — Public API
// ============================================================
//
// Point d'entrée unique pour le système d'assistant ML.
// Exporte uniquement ce dont VirtualAssistant a besoin.

export {
  processMessage,
  resetConversation,
  getConversationSummary,
  getSuggestedQuestions,
  getKnowledgeStats,
} from './engine';

export { classifyIntent, INTENTS, intentLabels, detectSentiment } from './intent';
export { topicLabels, suggestedQuestions } from './knowledge';
