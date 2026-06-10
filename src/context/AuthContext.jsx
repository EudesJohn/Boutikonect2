import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchingProfileRef = useRef(false);

  // ---------------------------------------------------------------------------
  // Fetch profile from the "profiles" table
  // ---------------------------------------------------------------------------
  const fetchProfile = useCallback(async (userId) => {
    if (!userId || fetchingProfileRef.current) return;

    fetchingProfileRef.current = true;
    try {
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      if (!data) {
        // No profile row yet -- not an error, user may just have signed up
        setProfile(null);
        return;
      }

      setProfile(data);
    } catch (err) {
      console.error('Error fetching profile:', err.message, err.code, err.details);
      setProfile(null);
    } finally {
      fetchingProfileRef.current = false;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Auth state change subscription + initial session check
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let ignore = false;

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (ignore) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);

      if (currentSession?.user) {
        fetchProfile(currentSession.user.id);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        if (ignore) return;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          fetchProfile(currentSession.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      ignore = true;
      authListener?.subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  // Also re-fetch profile if the user object reference changes
  useEffect(() => {
    if (user) {
      fetchProfile(user.id);
    } else {
      setProfile(null);
    }
  }, [user, fetchProfile]);

  // ---------------------------------------------------------------------------
  // signUp
  // ---------------------------------------------------------------------------
  const signUp = useCallback(async ({ email, password, name, phone }) => {
    setError(null);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name || email,
            phone: phone || '',
          },
        },
      });

      if (signUpError) throw signUpError;

      if (data?.user) {
        // Wait for the DB trigger (handle_new_user) to create the profile row
        let profileCreated = false;
        for (let i = 0; i < 5; i++) {
          await new Promise((r) => setTimeout(r, 500));
          const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', data.user.id)
            .maybeSingle();
          if (existing) {
            profileCreated = true;
            break;
          }
        }

        // Upsert additional fields (name, phone) that the trigger doesn't set
        if (profileCreated) {
          const { error: updateError } = await supabase.from('profiles').update({
            full_name: name || data.user.email,
            phone: phone || '',
            updated_at: new Date().toISOString(),
          }).eq('id', data.user.id);

          if (updateError) {
            console.error('[Auth] Profile update after signup failed:', updateError.message);
            toast.error('Profil créé, mais mise à jour des informations a échoué.');
          }
        } else {
          console.warn('[Auth] Profile row was never created by DB trigger — attempting update anyway');
          // Still try — the trigger may have created the row between the loop and here
          const { error: updateError } = await supabase.from('profiles').update({
            full_name: name || data.user.email,
            phone: phone || '',
            updated_at: new Date().toISOString(),
          }).eq('id', data.user.id);

          if (updateError) {
            console.error('[Auth] Profile update after signup failed (no profile row):', updateError.message);
          }
        }

        // Fetch the profile
        await fetchProfile(data.user.id);
      }

      return { user: data.user, session: data.session };
    } catch (err) {
      setError(err.message || 'Une erreur est survenue lors de l inscription.');
      toast.error(err.message || 'Echec de l inscription.');
      throw err;
    }
  }, [fetchProfile]);

  // ---------------------------------------------------------------------------
  // signInWithGoogle
  // ---------------------------------------------------------------------------
  const signInWithGoogle = useCallback(async () => {
    setError(null);
    try {
      const { data, error: googleError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          skipBrowserRedirect: false,
        },
      });

      if (googleError) throw googleError;

      // Fallback: if the SDK didn't redirect automatically
      if (data?.url) {
        window.location.href = data.url;
      }

      return data;
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError(err.message || 'Google sign-in failed.');
      toast.error(err.message || 'Connexion Google échouée.');
      throw err;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // signIn
  // ---------------------------------------------------------------------------
  const signIn = useCallback(async ({ email, password }) => {
    setError(null);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      setUser(data.user);
      setSession(data.session);
      await fetchProfile(data.user.id);

      toast.success('Bon retour parmi nous !');
      return { user: data.user, session: data.session };
    } catch (err) {
      setError(err.message || 'Identifiants de connexion invalides.');
      toast.error(err.message || 'Connexion echouee.');
      throw err;
    }
  }, [fetchProfile]);

  // ---------------------------------------------------------------------------
  // signOut
  // ---------------------------------------------------------------------------
  const signOut = useCallback(async () => {
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;

      setUser(null);
      setSession(null);
      setProfile(null);

      toast.success('Vous etes deconnecte.');
    } catch (err) {
      setError(err.message || 'Une erreur est survenue lors de la deconnexion.');
      toast.error(err.message || 'Echec de la deconnexion.');
      throw err;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // updateProfile
  // ---------------------------------------------------------------------------
  const updateProfile = useCallback(
    async (updates) => {
      if (!user) {
        const msg = 'Vous devez etre connecte pour modifier votre profil.';
        toast.error(msg);
        throw new Error(msg);
      }

      setError(null);
      try {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (updateError) throw updateError;

        // Refresh local profile state
        await fetchProfile(user.id);

        toast.success('Profil mis a jour avec succes.');
        return true;
      } catch (err) {
        setError(err.message || 'Echec de la mise a jour du profil.');
        toast.error(err.message || 'Mise a jour du profil echouee.');
        throw err;
      }
    },
    [user, fetchProfile]
  );

  // ---------------------------------------------------------------------------
  // becomeSeller
  // ---------------------------------------------------------------------------
  const becomeSeller = useCallback(async () => {
    if (!user) {
      const msg = 'Vous devez etre connecte pour devenir vendeur.';
      toast.error(msg);
      throw new Error(msg);
    }

    setError(null);
    try {
      const { error: sellerError } = await supabase
        .from('profiles')
        .update({
          is_seller: true,
          role: 'seller',
          seller_since: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (sellerError) throw sellerError;

      await fetchProfile(user.id);

      toast.success('Vous etes maintenant vendeur ! Configurez votre boutique pour commencer a vendre.');
      return true;
    } catch (err) {
      setError(err.message || 'Echec du passage au statut vendeur.');
      toast.error(err.message || 'Impossible de devenir vendeur.');
      throw err;
    }
  }, [user, fetchProfile]);

  // ---------------------------------------------------------------------------
  // resetPassword
  // ---------------------------------------------------------------------------
  const resetPassword = useCallback(async (email) => {
    setError(null);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (resetError) throw resetError;
      return true;
    } catch (err) {
      setError(err.message || 'Echec de l envoi de l email de reinitialisation.');
      throw err;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Value bag
  // ---------------------------------------------------------------------------
  const value = {
    user,
    profile,
    session,
    loading,
    error,
    isAuthenticated: !!user,
    isSeller: profile?.is_seller ?? false,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    updateProfile,
    becomeSeller,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
}

export default AuthContext;
