import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles, Cpu } from 'lucide-react';

const WELCOME_MESSAGE = {
  id: 'welcome',
  text: "Bonjour ! 🧠 Je suis l'assistant intelligent de **BoutiKonect**. Je peux répondre à toutes vos questions sur les achats, les ventes, la livraison, les produits disponibles, et bien plus encore. Comment puis-je vous aider ?",
  sender: 'bot',
};

// Suggestions de départ — chargées dynamiquement depuis le moteur ML
const DEFAULT_SUGGESTIONS = [
  'Comment acheter un produit ?',
  'Comment devenir vendeur ?',
  'Quels sont les moyens de paiement ?',
  'Délais de livraison',
  'Contact support',
];

/**
 * VirtualAssistant — Floating chatbot widget alimenté par le ML.
 *
 * Features ML :
 * - Classification d'intention en temps réel
 * - Recherche sémantique dans la base de connaissances
 * - Requêtes live Supabase pour les produits/services
 * - Contexte de conversation (follow-ups)
 * - Scoring de confiance
 * - Suggestions adaptatives
 */
export default function VirtualAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [hasOpened, setHasOpened] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(DEFAULT_SUGGESTIONS);
  const [engineReady, setEngineReady] = useState(null); // null=chargement, true=prêt, false=erreur
  const pendingRef = useRef(null); // message en attente pendant le chargement

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Référence au moteur pour éviter les reimports
  const engineRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Traite un message en attente une fois le moteur chargé
  const processPendingMessage = useCallback(async () => {
    const pending = pendingRef.current;
    if (!pending || !engineRef.current) return;
    pendingRef.current = null;
    try {
      const result = await engineRef.current.processMessage(pending);
      const elapsed = result.metadata?.processingTime || 0;
      if (elapsed < 300) {
        await new Promise((r) => setTimeout(r, 300 + Math.random() * 200));
      }
      const botMessage = {
        id: `bot-${Date.now()}`,
        text: result.text,
        sender: 'bot',
        confidence: result.confidence,
        intent: result.intentLabel,
      };
      setMessages((prev) => [...prev, botMessage]);
      if (result.suggestions?.length > 0) {
        setSuggestions(result.suggestions);
      }
    } catch {
      setMessages((prev) => [...prev, {
        id: `bot-${Date.now()}`,
        text: "Désolé, j'ai eu un problème technique. 😔 Pouvez-vous reformuler votre question ?",
        sender: 'bot',
      }]);
    }
  }, []);

  useEffect(() => {
    if (isOpen && !hasOpened) {
      setHasOpened(true);

      // Charger le moteur ML de manière asynchrone (lazy load)
      if (!engineRef.current) {
        setIsLoading(true);
        import('../lib/assistant')
          .then((mod) => {
            engineRef.current = mod;
            // Afficher le message de bienvenue seulement une fois le moteur chargé
            setMessages([WELCOME_MESSAGE]);
            // Mettre à jour les suggestions avec celles du moteur
            const engineSuggestions = mod.getSuggestedQuestions?.();
            if (engineSuggestions) {
              setSuggestions(engineSuggestions.slice(0, 5));
            }
            setEngineReady(true);
            // Traiter un éventuel message envoyé pendant le chargement
            processPendingMessage();
          })
          .catch((err) => {
            console.error('[Assistant] Failed to load engine:', err);
            setEngineReady(false);
            setMessages([{
              id: 'welcome',
              text: "Bonjour ! 👋 Je suis l'assistant BoutiKonect (mode hors-ligne). Je peux répondre aux questions de base. Tapez votre question pour commencer.",
              sender: 'bot',
            }]);
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        setMessages([WELCOME_MESSAGE]);
      }
    }
  }, [isOpen, hasOpened, processPendingMessage]);

  useEffect(() => {
    if (isOpen && inputRef.current && !isLoading) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isLoading]);

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleSend = useCallback(
    async (text) => {
      const trimmedMessage = (text || inputValue).trim();
      if (!trimmedMessage || isSending) return;

      setIsSending(true);
      setInputValue('');

      // Message utilisateur
      const userMessage = {
        id: `user-${Date.now()}`,
        text: trimmedMessage,
        sender: 'user',
      };
      setMessages((prev) => [...prev, userMessage]);

      // Utiliser le moteur ML si disponible
      if (engineRef.current) {
        try {
          // Timing adaptatif selon la complexité
          const result = await engineRef.current.processMessage(trimmedMessage);

          // Petite pause naturelle pour l'UX (sauf si la réponse était instantanée)
          const elapsed = result.metadata?.processingTime || 0;
          if (elapsed < 300) {
            await new Promise((r) => setTimeout(r, 300 + Math.random() * 200));
          }

          const botMessage = {
            id: `bot-${Date.now()}`,
            text: result.text,
            sender: 'bot',
            confidence: result.confidence,
            intent: result.intentLabel,
          };
          setMessages((prev) => [...prev, botMessage]);

          // Mettre à jour les suggestions avec les suggestions contextuelles
          if (result.suggestions?.length > 0) {
            setSuggestions(result.suggestions);
          }
        } catch (err) {
          console.error('[Assistant] Engine error:', err);
          const fallbackMessage = {
            id: `bot-${Date.now()}`,
            text: "Désolé, j'ai eu un problème technique. 😔 Pouvez-vous reformuler votre question ou réessayer ?",
            sender: 'bot',
          };
          setMessages((prev) => [...prev, fallbackMessage]);
        }
      } else if (engineReady === null) {
        // Moteur en cours de chargement → mettre en file d'attente
        pendingRef.current = trimmedMessage;
      } else {
        // Moteur indisponible → réponse basique
        await new Promise((r) => setTimeout(r, 500));
        setMessages((prev) => [...prev, {
          id: `bot-${Date.now()}`,
          text: "Le moteur d'intelligence artificielle n'est pas disponible actuellement. Veuillez réessayer plus tard ou actualiser la page. 🔄",
          sender: 'bot',
        }]);
      }

      setIsSending(false);
    },
    [inputValue, isSending, engineReady]
  );

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleSuggestionClick = (question) => {
    handleSend(question);
  };

  const formatMessage = (text) => {
    if (!text) return null;
    // Traite le format Markdown basique et les listes
    const lines = text.split('\n');
    return lines.map((line, i) => {
      // Ligne vide
      if (!line.trim()) return <br key={i} />;

      // Liste à puces
      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        return (
          <span key={i} className="block ml-2">
            {formatInline(line)}
          </span>
        );
      }

      // Liste numérotée
      if (/^\d+[.)]/.test(line.trim())) {
        return (
          <span key={i} className="block ml-2">
            {formatInline(line)}
          </span>
        );
      }

      // Titre avec **
      if (line.trim().startsWith('**') && line.trim().endsWith('**')) {
        return (
          <span key={i} className="block font-bold text-amber-300 mt-1">
            {formatInline(line)}
          </span>
        );
      }

      // Texte normal
      return (
        <span key={i} className="block">
          {formatInline(line)}
        </span>
      );
    });
  };

  const formatInline = (text) => {
    return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith('**') && part.endsWith('**') ? (
        <strong key={i} className="font-semibold text-amber-200">
          {part.slice(2, -2)}
        </strong>
      ) : (
        part
      )
    );
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col items-end">
      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="mb-4 w-[380px] max-w-[calc(100vw-48px)] h-[560px] max-h-[80vh] flex flex-col rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
            style={{
              background: 'rgba(15, 23, 42, 0.92)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Sparkles size={16} className="text-white" />
                </div>
                <div>
                  <span className="font-semibold text-sm block leading-tight">
                    Assistant IA BoutiKonect
                  </span>
                  <span className="text-[11px] text-white/70 flex items-center gap-1">
                    {engineReady === true ? (
                      <>
                        <span className="w-1.5 h-1.5 bg-green-300 rounded-full inline-block" />
                        ML Actif
                      </>
                    ) : engineReady === false ? (
                      <>
                        <span className="w-1.5 h-1.5 bg-yellow-300 rounded-full inline-block" />
                        Mode basique
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse inline-block" />
                        Chargement...
                      </>
                    )}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleChat}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                aria-label="Fermer le chat"
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scroll-smooth chat-scroll">
              {messages.length === 0 && !isLoading && (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                  Posez votre question à l&apos;assistant
                </div>
              )}

              {isLoading && messages.length === 0 && (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm gap-2">
                  <Cpu size={16} className="animate-pulse text-amber-400" />
                  Initialisation du moteur ML...
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-br-md shadow-lg shadow-amber-500/20'
                        : 'bg-white/10 text-gray-100 rounded-bl-md border border-white/5'
                    }`}
                  >
                    {msg.sender === 'bot' ? formatMessage(msg.text) : msg.text}

                    {/* Petit indicateur de confiance pour les réponses bot (optionnel) */}
                    {msg.sender === 'bot' && msg.confidence != null && msg.confidence < 0.5 && (
                      <span className="block text-[10px] text-gray-500 mt-1 italic">
                        ( réponse approximative )
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {/* Suggestion chips — après chaque message du bot */}
              {messages.length > 0 && messages[messages.length - 1].sender === 'bot' && !isSending && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {suggestions.slice(0, 4).map((question) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() => handleSuggestionClick(question)}
                      className="text-xs px-2.5 py-1.5 rounded-full bg-white/10 text-amber-300 border border-white/10
                        hover:bg-amber-500/20 hover:border-amber-500/30 transition-all duration-200 cursor-pointer"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              )}

              {/* Typing indicator */}
              {isSending && (
                <div className="flex justify-start">
                  <div className="bg-white/10 text-gray-400 px-3.5 py-2.5 rounded-2xl rounded-bl-md text-sm border border-white/5">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  </div>
                </div>
              )}

              {/* Invisible sentinel for auto-scroll */}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="shrink-0 border-t border-white/10 px-3 py-3">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={isLoading ? 'Chargement...' : 'Posez votre question...'}
                  disabled={isSending || isLoading}
                  maxLength={500}
                  aria-label="Message pour l'assistant"
                  className="flex-1 px-4 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl outline-none
                    focus:ring-2 focus:ring-amber-500/50 focus:bg-white/10 transition-all
                    placeholder-gray-500 disabled:opacity-50 text-white"
                />
                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={!inputValue.trim() || isSending || isLoading}
                  aria-label="Envoyer"
                  className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white
                    hover:from-amber-400 hover:to-orange-500
                    disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed
                    transition-all duration-200 shrink-0 shadow-lg shadow-amber-500/20"
                >
                  <Send size={18} />
                </button>
              </div>
              <p className="text-[10px] text-gray-600 text-center mt-1.5">
                Assistant ML — Recherche sémantique + données temps réel
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.button
        type="button"
        onClick={toggleChat}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label={isOpen ? 'Fermer le chat' : 'Ouvrir le chat'}
        className="relative p-3.5 rounded-full shadow-lg shadow-amber-500/30
          bg-gradient-to-br from-amber-500 to-orange-600
          hover:from-amber-400 hover:to-orange-500
          hover:shadow-amber-500/50
          text-white transition-shadow duration-300"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X size={24} />
            </motion.span>
          ) : (
            <motion.span
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageCircle size={24} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
