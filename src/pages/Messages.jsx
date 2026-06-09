import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  MessageCircle,
  Send,
  User,
  Loader2,
  Inbox,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getUserConversations,
  getMessages,
  sendMessage,
  markMessagesAsRead,
} from '../lib/database';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  if (diff < 86400000) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function formatMessageTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat'
  const [showNewConv, setShowNewConv] = useState(false);
  const [unreadMap, setUnreadMap] = useState({});

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = useCallback((smooth = true) => {
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: smooth ? 'smooth' : 'auto',
        });
      }
    }, 50);
  }, []);

  // Load conversations
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    async function load() {
      try {
        const { data } = await getUserConversations(user.id);
        setConversations(data || []);
        // Build unread map
        const map = {};
        (data || []).forEach((c) => {
          const unread = user.id === c.buyer_id ? (c.buyer_unread_count || 0) : (c.seller_unread_count || 0);
          if (unread > 0) map[c.id] = unread;
        });
        setUnreadMap(map);
      } catch (err) {
        console.error(err);
        toast.error('Erreur lors du chargement des conversations');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.id]);

  // Load messages when a conversation is selected
  useEffect(() => {
    if (!selectedConv) { setMessages([]); return; }
    let cancelled = false;
    setMessagesLoading(true);
    async function load() {
      try {
        const data = await getMessages(selectedConv.id);
        if (!cancelled) {
          setMessages(data || []);
          scrollToBottom(false);
          // Mark as read
          if (user) {
            await markMessagesAsRead(selectedConv.id, user.id);
            // Clear unread for this conversation
            setUnreadMap((prev) => {
              const next = { ...prev };
              delete next[selectedConv.id];
              return next;
            });
          }
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) toast.error('Erreur lors du chargement des messages');
      } finally {
        if (!cancelled) setMessagesLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [selectedConv, user]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!selectedConv || !user) return;

    const channel = supabase
      .channel(`messages:${selectedConv.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConv.id}`,
        },
        async (payload) => {
          const newMsg = payload.new;
          // If the message was sent by someone else, add it
          if (newMsg.sender_id !== user.id) {
            // Fetch the full message with sender info
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('id', newMsg.sender_id)
              .single();

            setMessages((prev) => [
              ...prev,
              { ...newMsg, sender: senderProfile || {} },
            ]);
            scrollToBottom();

            // Mark as read immediately
            await markMessagesAsRead(selectedConv.id, user.id);
          }
        }
      )
      .subscribe();

    // Also listen for conversation updates (e.g. when the other person reads)
    const convChannel = supabase
      .channel(`conv:${selectedConv.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${selectedConv.id}`,
        },
        () => {
          // Refresh conversations list in background
          if (user) {
            getUserConversations(user.id).then(({ data }) => {
              if (data) setConversations(data);
            }).catch(() => {});
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(convChannel);
    };
  }, [selectedConv, user]);

  // Poll for conversation updates (new conversations, unread changes)
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      try {
        const { data } = await getUserConversations(user.id);
        if (data) {
          setConversations((prev) => {
            // Merge: keep the same reference for selected conversation if possible
            const merged = data.map((newC) => {
              const oldC = prev.find((p) => p.id === newC.id);
              return oldC ? { ...oldC, ...newC } : newC;
            });
            return merged;
          });
          // Update unread map
          const map = {};
          data.forEach((c) => {
            const unread = user.id === c.buyer_id ? (c.buyer_unread_count || 0) : (c.seller_unread_count || 0);
            if (unread > 0 && c.id !== selectedConv?.id) map[c.id] = unread;
          });
          setUnreadMap(map);
        }
      } catch {}
    }, 10000); // every 10s

    return () => clearInterval(interval);
  }, [user, selectedConv]);

  const handleSend = useCallback(async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConv || !user) return;
    const content = newMessage.trim();
    setSending(true);
    try {
      const msg = await sendMessage(selectedConv.id, user.id, content);
      setMessages((prev) => [...prev, msg]);
      // Update conversation preview in sidebar
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConv.id
            ? { ...c, last_message_preview: content, last_message_at: new Date().toISOString() }
            : c
        )
      );
      setNewMessage('');
      scrollToBottom();
    } catch (err) {
      toast.error("Erreur lors de l'envoi");
      console.error(err);
    } finally {
      setSending(false);
    }
  }, [newMessage, selectedConv, user, scrollToBottom]);

  const getParticipant = (conv) => {
    if (!conv) return { name: 'Utilisateur', avatar_url: null, id: null };
    const isBuyer = user?.id === conv.buyer_id;
    const participant = isBuyer ? conv.seller : conv.buyer;
    return {
      name: participant?.full_name || participant?.store_name || 'Utilisateur',
      avatar_url: participant?.avatar_url || null,
      id: participant?.id || null,
    };
  };

  const selectConversation = (conv) => {
    setSelectedConv(conv);
    setMobileView('chat');
  };

  const goBackToList = () => {
    setSelectedConv(null);
    setMobileView('list');
  };

  // Current participant for the selected conversation
  const currentParticipant = selectedConv ? getParticipant(selectedConv) : null;

  return (
    <div className="min-h-screen bg-gray-950 py-8">
      <div className="max-w-6xl mx-auto px-4 h-[calc(100vh-8rem)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="h-full"
        >
          <h1 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-amber-400" />
            Messages
            {Object.keys(unreadMap).length > 0 && (
              <span className="text-sm font-normal text-gray-400">
                ({Object.values(unreadMap).reduce((a, b) => a + b, 0)} non lu(s))
              </span>
            )}
          </h1>

          <div className="h-[calc(100%-4rem)] flex rounded-2xl bg-gray-900/70 backdrop-blur-xl border border-gray-800 overflow-hidden">
            {/* ─── Conversations list ─── */}
            <div className={`${
              mobileView === 'chat' ? 'hidden md:flex' : 'flex'
            } w-full md:w-80 lg:w-96 border-r border-gray-800 flex-col`}>
              <div className="p-4 border-b border-gray-800 space-y-2">
                <div className="relative">
                  <Inbox className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 placeholder-gray-500"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-thin">
                {loading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                    <MessageCircle className="w-12 h-12 text-gray-700 mb-3" />
                    <p className="text-gray-400 text-sm">Aucune conversation</p>
                    <p className="text-gray-600 text-xs mt-1">
                      Visitez la page d&apos;un produit et cliquez sur &laquo; Contacter &raquo;
                    </p>
                  </div>
                ) : (
                  conversations.map((conv) => {
                    const { name: participantName, avatar_url: participantAvatar } = getParticipant(conv);
                    const unread = unreadMap[conv.id] || 0;
                    return (
                      <button
                        key={conv.id}
                        onClick={() => selectConversation(conv)}
                        className={`w-full p-4 flex items-center gap-3 hover:bg-gray-800/50 transition-colors text-left cursor-pointer border-b border-gray-800/50 ${
                          selectedConv?.id === conv.id ? 'bg-gray-800/50' : ''
                        }`}
                      >
                        <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                          {participantAvatar ? (
                            <img src={participantAvatar} alt={participantName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                              <User className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          {unread > 0 && (
                            <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                              <span className="text-[9px] font-bold text-black">{unread > 9 ? '9+' : unread}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className={`text-sm truncate ${unread > 0 ? 'font-semibold text-white' : 'text-gray-300'}`}>
                              {participantName}
                            </p>
                            {unread > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />}
                          </div>
                          <p className={`text-xs truncate ${unread > 0 ? 'text-gray-300' : 'text-gray-500'}`}>
                            {conv.last_message_preview || 'Pas encore de message'}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="text-[10px] text-gray-500 whitespace-nowrap">
                            {formatDate(conv.last_message_at)}
                          </span>
                          <ChevronRight className="w-3 h-3 text-gray-600" />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* ─── Chat area ─── */}
            <div className={`${
              mobileView === 'list' ? 'hidden md:flex' : 'flex'
            } flex-1 flex-col`}>
              {selectedConv && currentParticipant ? (
                <>
                  {/* Chat header with back button on mobile */}
                  <div className="p-4 border-b border-gray-800 flex items-center gap-3">
                    <button
                      onClick={goBackToList}
                      className="md:hidden p-1 text-gray-400 hover:text-white transition-colors cursor-pointer"
                      aria-label="Retour"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                      {currentParticipant.avatar_url ? (
                        <img src={currentParticipant.avatar_url} alt={currentParticipant.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{currentParticipant.name}</p>
                      <p className="text-xs text-gray-500">En ligne récemment</p>
                    </div>
                  </div>

                  {/* Messages container */}
                  <div
                    ref={messagesContainerRef}
                    className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin"
                  >
                    {messagesLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <MessageCircle className="w-12 h-12 text-gray-700 mb-2" />
                        <p className="text-gray-500 text-sm">Aucun message</p>
                        <p className="text-gray-600 text-xs">Envoyez le premier message</p>
                      </div>
                    ) : (
                      <>
                        {messages.map((msg, idx) => {
                          const isMine = msg.sender_id === user?.id;
                          const showDate = idx === 0 || new Date(msg.created_at).toDateString() !== new Date(messages[idx - 1]?.created_at).toDateString();
                          return (
                            <div key={msg.id}>
                              {showDate && (
                                <div className="flex justify-center my-3">
                                  <span className="text-[10px] text-gray-600 bg-gray-800 px-2 py-1 rounded-full">
                                    {formatDate(msg.created_at)}
                                  </span>
                                </div>
                              )}
                              <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                                {!isMine && (
                                  <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 mb-1">
                                    {currentParticipant.avatar_url ? (
                                      <img src={currentParticipant.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                        <User className="w-3 h-3 text-gray-500" />
                                      </div>
                                    )}
                                  </div>
                                )}
                                <div className={`max-w-[75%] ${isMine ? 'order-1' : 'order-2'}`}>
                                  <div
                                    className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                      isMine
                                        ? 'bg-amber-500 text-black rounded-br-md'
                                        : 'bg-gray-800 text-gray-100 rounded-bl-md'
                                    }`}
                                  >
                                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                  </div>
                                  <div className={`flex items-center gap-1 mt-0.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                    <span className={`text-[10px] ${
                                      isMine ? 'text-gray-600' : 'text-gray-600'
                                    }`}>
                                      {formatMessageTime(msg.created_at)}
                                    </span>
                                    {isMine && (
                                      <span className="text-[10px] text-gray-600">
                                        {msg.is_read ? '✓✓' : '✓'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>

                  {/* Input */}
                  <form onSubmit={handleSend} className="p-4 border-t border-gray-800">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Écrivez votre message..."
                        className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 placeholder-gray-500"
                        disabled={sending}
                      />
                      <button
                        type="submit"
                        disabled={sending || !newMessage.trim() || !selectedConv}
                        className="w-10 h-10 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-gray-700 flex items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed"
                        aria-label="Envoyer le message"
                      >
                        {sending ? (
                          <Loader2 className="w-4 h-4 text-black animate-spin" />
                        ) : (
                          <Send className="w-4 h-4 text-black" />
                        )}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center px-4">
                    <MessageCircle className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">Sélectionnez une conversation</p>
                    <p className="text-gray-600 text-sm mt-1">
                    ou cliquez sur &laquo; Contacter &raquo; depuis un produit
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
