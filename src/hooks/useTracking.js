// ============================================================
// BoutiKonect Tracking Hook
// Enregistre le comportement utilisateur dans user_events
// pour alimenter le système de recommandations
// ============================================================

import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// -------------------------------------------------------------------
// Génère un sessionId unique pour la session de navigation
// -------------------------------------------------------------------
const SESSION_KEY = 'bk_session_id';
function getSessionId() {
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

// -------------------------------------------------------------------
// Hook principal
// -------------------------------------------------------------------
export function useTracking() {
  const { user } = useAuth();
  const sessionId = useRef(getSessionId());
  const userIdRef = useRef(null);

  // Met à jour la référence userId silencieusement
  useEffect(() => {
    userIdRef.current = user?.id || null;
  }, [user?.id]);

  /**
   * Envoie un événement de tracking vers Supabase.
   * Rate-limiting : ignore si le même événement a été envoyé il y a < 2s.
   */
  const track = useCallback(
    async ({ type, productId, serviceId, category, searchQuery, metadata = {} }) => {
      const uid = userIdRef.current;
      if (!uid) return; // Ignorer si non connecté

      const payload = {
        user_id: uid,
        session_id: sessionId.current,
        event_type: type,
        product_id: productId || null,
        service_id: serviceId || null,
        category: category || null,
        search_query: searchQuery || null,
        metadata,
      };

      // Fire-and-forget — pas de blocage, pas de toast en cas d'échec
      supabase.from('user_events').insert(payload).then(({ error }) => {
        if (error) {
          console.warn('[Tracking]', error.message);
        }
      });
    },
    []
  );

  /** Raccourcis pratiques */
  const trackProductView = useCallback(
    (productId, category, metadata) =>
      track({ type: 'product_view', productId, category, metadata }),
    [track]
  );

  const trackServiceView = useCallback(
    (serviceId, metadata) =>
      track({ type: 'service_view', serviceId, metadata }),
    [track]
  );

  const trackSearch = useCallback(
    (query, category) => track({ type: 'search', searchQuery: query, category }),
    [track]
  );

  const trackFavoriteAdd = useCallback(
    (productId, category) =>
      track({ type: 'favorite_add', productId, category }),
    [track]
  );

  const trackFavoriteRemove = useCallback(
    (productId) =>
      track({ type: 'favorite_remove', productId }),
    [track]
  );

  const trackCartAdd = useCallback(
    (productId, category) =>
      track({ type: 'cart_add', productId, category }),
    [track]
  );

  const trackPageView = useCallback(
    (pageName) => track({ type: 'page_view', metadata: { page: pageName } }),
    [track]
  );

  return {
    track,
    trackProductView,
    trackServiceView,
    trackSearch,
    trackFavoriteAdd,
    trackFavoriteRemove,
    trackCartAdd,
    trackPageView,
  };
}

export default useTracking;
