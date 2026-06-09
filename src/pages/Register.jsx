import { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  MessageCircle,
  ChevronRight,
  ChevronLeft,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Store,
  Home,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { validateBeninPhone } from '../lib/database';
import toast from 'react-hot-toast';
import beninCities, { getArrondissements } from '../data/beninCities';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const STEPS = [
  { number: 1, title: 'Identifiants', icon: User },
  { number: 2, title: 'Localisation', icon: MapPin },
  { number: 3, title: 'WhatsApp', icon: MessageCircle },
];

const sortedCities = [...beninCities].sort((a, b) => a.name.localeCompare(b.name));

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------
function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((step, idx) => (
        <div key={step.number} className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              currentStep === step.number
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : currentStep > step.number
                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                : 'bg-gray-800 text-gray-500 border border-gray-700'
            }`}
          >
            <step.icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{step.title}</span>
          </div>
          {idx < STEPS.length - 1 && (
            <div
              className={`w-6 h-px ${
                currentStep > step.number ? 'bg-green-500/50' : 'bg-gray-800'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Slide animation
// ---------------------------------------------------------------------------
const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

// ===================================================================
// Register Page
// ===================================================================
export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signUp, signInWithGoogle, user, loading: authLoading } = useAuth();

  // Step state
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(0);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [city, setCity] = useState('');
  const [arrondissement, setArrondissement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');

  const [whatsapp, setWhatsapp] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [becomeSeller, setBecomeSeller] = useState(
    searchParams.get('become_seller') === '1'
  );

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  // -----------------------------------------------------------------------
  // Field validation per step
  // -----------------------------------------------------------------------
  const validateStep = useCallback(
    (step) => {
      const errors = {};

      if (step === 1) {
        if (!name.trim()) errors.name = 'Le nom est requis.';
        if (!email.trim()) errors.email = "L'email est requis.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
          errors.email = 'Format d email invalide.';
        if (!phone.trim()) errors.phone = 'Le telephone est requis.';
        else if (!validateBeninPhone(phone))
          errors.phone = 'Format beninois invalide (+229 XX XX XX XX ou 01 XX XX XX XX).';
        if (!password) errors.password = 'Le mot de passe est requis.';
        else if (password.length < 6)
          errors.password = 'Le mot de passe doit contenir au moins 6 caracteres.';
        if (password !== confirmPassword)
          errors.confirmPassword = 'Les mots de passe ne correspondent pas.';
      }

      if (step === 2) {
        if (!city) errors.city = 'Veuillez selectionner votre commune.';
        if (!neighborhood.trim())
          errors.neighborhood = 'Veuillez indiquer votre quartier.';
      }

      if (step === 3) {
        if (!whatsapp.trim()) errors.whatsapp = 'Le numero WhatsApp est requis.';
        else if (!validateBeninPhone(whatsapp))
          errors.whatsapp = 'Format invalide.';
        if (!acceptTerms)
          errors.acceptTerms = 'Vous devez accepter les conditions.';
      }

      setFieldErrors(errors);
      return Object.keys(errors).length === 0;
    },
    [
      name, email, phone, password, confirmPassword,
      city, neighborhood,
      whatsapp, acceptTerms,
    ]
  );

  // -----------------------------------------------------------------------
  // Step navigation
  // -----------------------------------------------------------------------
  const goToNextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, validateStep]);

  const goToPrevStep = useCallback(() => {
    setDirection(-1);
    setCurrentStep((prev) => prev - 1);
  }, []);

  // -----------------------------------------------------------------------
  // Submit
  // -----------------------------------------------------------------------
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!validateStep(3)) return;

      setSubmitting(true);
      try {
        const result = await signUp({
          email: email.trim(),
          password,
          name: name.trim(),
          phone: phone.trim(),
        });

        // Use the returned user from signUp (not the context user which is stale)
        const resultUser = user || result?.user;
        if (resultUser?.id) {
          try {
            await supabase
              .from('profiles')
              .update({
                full_name: name.trim(),
                city,
                arrondissement: arrondissement || null,
                neighborhood,
                whatsapp: whatsapp.trim(),
                is_seller: becomeSeller,
                role: becomeSeller ? 'seller' : 'buyer',
                seller_since: becomeSeller ? new Date().toISOString() : null,
                updated_at: new Date().toISOString(),
              })
              .eq('id', resultUser.id);
          } catch (profileErr) {
            console.error('Profile update error:', profileErr);
            // Non-blocking: account is created
          }
        }

        // Wait, the user might not be confirmed yet → stay on a confirmation page
        if (!result?.session) {
          toast.success(
            becomeSeller
              ? 'Compte cree ! Verifiez vos emails pour confirmer votre inscription.'
              : 'Compte cree avec succes ! Verifiez vos emails pour confirmer votre inscription.',
            { duration: 6000 }
          );
          navigate('/login', { replace: true, state: { emailJustRegistered: email } });
        } else {
          toast.success(
            becomeSeller
              ? 'Compte cree ! Vous etes maintenant inscrit comme vendeur.'
              : 'Compte cree avec succes ! Bienvenue sur BoutiKonect.'
          );
          navigate('/', { replace: true });
        }
      } catch (err) {
        toast.error(err.message || 'Echec de la creation du compte.');
      } finally {
        setSubmitting(false);
      }
    },
    [
      email, password, name, phone, city, neighborhood,
      whatsapp, becomeSeller, user, navigate, signUp, validateStep,
    ]
  );

  // -----------------------------------------------------------------------
  // Auth loading state
  // -----------------------------------------------------------------------
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <div className="relative overflow-hidden rounded-2xl bg-gray-900/70 backdrop-blur-xl border border-gray-800 shadow-2xl shadow-black/30">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 p-6 md:p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-8 h-8 text-black" />
              </div>
              <h1 className="text-2xl font-bold text-white">Creation de compte</h1>
              <p className="text-gray-400 text-sm mt-1">
                Rejoignez la communaute BoutiKonect
              </p>
            </div>

            {/* Step indicator */}
            <StepIndicator currentStep={currentStep} />

            {/* Step content */}
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <form onSubmit={currentStep === 3 ? handleSubmit : (e) => e.preventDefault()}>
                  {/* ==================== STEP 1 ==================== */}
                  {currentStep === 1 && (
                    <div className="space-y-4">
                      {/* Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                          Nom complet *
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Votre nom et prenom"
                            className={`w-full pl-9 pr-3 py-2.5 bg-gray-800 border rounded-lg text-white text-sm outline-none focus:ring-2 transition-all placeholder-gray-500 ${
                              fieldErrors.name
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-gray-700 focus:ring-amber-500'
                            }`}
                          />
                        </div>
                        {fieldErrors.name && (
                          <p className="text-xs text-red-400 mt-1">{fieldErrors.name}</p>
                        )}
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                          Adresse email *
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="vous@exemple.com"
                            autoComplete="email"
                            className={`w-full pl-9 pr-3 py-2.5 bg-gray-800 border rounded-lg text-white text-sm outline-none focus:ring-2 transition-all placeholder-gray-500 ${
                              fieldErrors.email
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-gray-700 focus:ring-amber-500'
                            }`}
                          />
                        </div>
                        {fieldErrors.email && (
                          <p className="text-xs text-red-400 mt-1">{fieldErrors.email}</p>
                        )}
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                          Telephone * (Format Benin)
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+229 XX XX XX XX"
                            className={`w-full pl-9 pr-3 py-2.5 bg-gray-800 border rounded-lg text-white text-sm outline-none focus:ring-2 transition-all placeholder-gray-500 ${
                              fieldErrors.phone
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-gray-700 focus:ring-amber-500'
                            }`}
                          />
                        </div>
                        {fieldErrors.phone && (
                          <p className="text-xs text-red-400 mt-1">{fieldErrors.phone}</p>
                        )}
                      </div>

                      {/* Password */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                          Mot de passe *
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Au moins 6 caracteres"
                            autoComplete="new-password"
                            className={`w-full pl-9 pr-10 py-2.5 bg-gray-800 border rounded-lg text-white text-sm outline-none focus:ring-2 transition-all placeholder-gray-500 ${
                              fieldErrors.password
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-gray-700 focus:ring-amber-500'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                            aria-label={showPassword ? 'Masquer' : 'Afficher'}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {fieldErrors.password && (
                          <p className="text-xs text-red-400 mt-1">{fieldErrors.password}</p>
                        )}
                      </div>

                      {/* Confirm password */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                          Confirmer le mot de passe *
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Retapez votre mot de passe"
                            autoComplete="new-password"
                            className={`w-full pl-9 pr-3 py-2.5 bg-gray-800 border rounded-lg text-white text-sm outline-none focus:ring-2 transition-all placeholder-gray-500 ${
                              fieldErrors.confirmPassword
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-gray-700 focus:ring-amber-500'
                            }`}
                          />
                        </div>
                        {fieldErrors.confirmPassword && (
                          <p className="text-xs text-red-400 mt-1">{fieldErrors.confirmPassword}</p>
                        )}
                      </div>

                      {/* Become seller checkbox */}
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={becomeSeller}
                          onChange={(e) => setBecomeSeller(e.target.checked)}
                          className="w-4 h-4 mt-0.5 rounded border-gray-600 bg-gray-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-0 cursor-pointer"
                        />
                        <div>
                          <span className="text-sm text-gray-300 font-medium">Devenir vendeur</span>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Cochez cette case si vous souhaitez egalement vendre des produits ou
                            services sur BoutiKonect.
                          </p>
                        </div>
                      </label>
                    </div>
                  )}

                  {/* ==================== STEP 2 ==================== */}
                  {currentStep === 2 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                        <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
                        <p className="text-xs text-indigo-300">
                          Indiquez votre localisation pour permettre aux acheteurs de vous trouver
                          facilement.
                        </p>
                      </div>

                      {/* City */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                          Commune / Ville *
                        </label>
                        <div className="relative">
                          <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <select
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className={`w-full pl-9 pr-3 py-2.5 bg-gray-800 border rounded-lg text-white text-sm outline-none focus:ring-2 transition-all appearance-none cursor-pointer ${
                              fieldErrors.city
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-gray-700 focus:ring-amber-500'
                            }`}
                          >
                            <option value="">Selectionnez votre commune</option>
                            {sortedCities.map((c) => (
                              <option key={c.name} value={c.name}>
                                {c.name} ({c.department})
                              </option>
                            ))}
                          </select>
                        </div>
                        {fieldErrors.city && (
                          <p className="text-xs text-red-400 mt-1">{fieldErrors.city}</p>
                        )}
                      </div>

                      {/* Arrondissement — sélecteur visible uniquement après choix de la commune */}
                      {city && getArrondissements(city).length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1.5">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4 text-gray-500" />
                              Arrondissement
                            </span>
                          </label>
                          <div className="relative">
                            <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <select
                              value={arrondissement}
                              onChange={(e) => setArrondissement(e.target.value)}
                              className="w-full pl-9 pr-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-all appearance-none cursor-pointer"
                            >
                              <option value="">Sélectionnez l'arrondissement</option>
                              {getArrondissements(city).map((arr) => (
                                <option key={arr} value={arr}>
                                  {arr}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Neighborhood */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                          Quartier *
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <input
                            type="text"
                            value={neighborhood}
                            onChange={(e) => setNeighborhood(e.target.value)}
                            placeholder="Votre quartier"
                            className={`w-full pl-9 pr-3 py-2.5 bg-gray-800 border rounded-lg text-white text-sm outline-none focus:ring-2 transition-all placeholder-gray-500 ${
                              fieldErrors.neighborhood
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-gray-700 focus:ring-amber-500'
                            }`}
                          />
                        </div>
                        {fieldErrors.neighborhood && (
                          <p className="text-xs text-red-400 mt-1">{fieldErrors.neighborhood}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ==================== STEP 3 ==================== */}
                  {currentStep === 3 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                        <MessageCircle className="w-4 h-4 text-green-400 shrink-0" />
                        <p className="text-xs text-green-300">
                          WhatsApp est le principal moyen de contact sur BoutiKonect. Les acheteurs
                          vous contacteront via ce numero.
                        </p>
                      </div>

                      {/* WhatsApp */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                          Numero WhatsApp *
                        </label>
                        <div className="relative">
                          <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                          <input
                            type="tel"
                            value={whatsapp}
                            onChange={(e) => setWhatsapp(e.target.value)}
                            placeholder="+229 XX XX XX XX"
                            className={`w-full pl-9 pr-3 py-2.5 bg-gray-800 border rounded-lg text-white text-sm outline-none focus:ring-2 transition-all placeholder-gray-500 ${
                              fieldErrors.whatsapp
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-gray-700 focus:ring-amber-500'
                            }`}
                          />
                        </div>
                        {fieldErrors.whatsapp && (
                          <p className="text-xs text-red-400 mt-1">{fieldErrors.whatsapp}</p>
                        )}
                      </div>

                      {/* Accept terms */}
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={acceptTerms}
                          onChange={(e) => setAcceptTerms(e.target.checked)}
                          className="w-4 h-4 mt-0.5 rounded border-gray-600 bg-gray-800 text-amber-500 focus:ring-amber-500 focus:ring-offset-0 cursor-pointer"
                        />
                        <div>
                          <span className="text-sm text-gray-300">
                            J'accepte les{' '}
                            <Link to="/terms" className="text-amber-400 hover:text-amber-300">
                              conditions generales d'utilisation
                            </Link>{' '}
                            et la{' '}
                            <Link to="/privacy" className="text-amber-400 hover:text-amber-300">
                              politique de confidentialite
                            </Link>{' '}
                            de BoutiKonect. *
                          </span>
                        </div>
                      </label>
                      {fieldErrors.acceptTerms && (
                        <p className="text-xs text-red-400">{fieldErrors.acceptTerms}</p>
                      )}
                    </div>
                  )}

                  {/* Navigation buttons */}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-800">
                    {currentStep > 1 ? (
                      <button
                        type="button"
                        onClick={goToPrevStep}
                        className="inline-flex items-center gap-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Precedent
                      </button>
                    ) : (
                      <div />
                    )}

                    {currentStep < STEPS.length ? (
                      <button
                        type="button"
                        onClick={goToNextStep}
                        className="inline-flex items-center gap-1 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg text-sm transition-colors"
                      >
                        Suivant
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-700 disabled:text-gray-500 text-black font-bold rounded-lg text-sm transition-all disabled:cursor-not-allowed cursor-pointer"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Creation en cours...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            Creer mon compte
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </form>
              </motion.div>
            </AnimatePresence>

            {/* Social login */}
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="flex-1 h-px bg-gray-800" />
                <span className="text-xs text-gray-500">ou continuer avec</span>
                <span className="flex-1 h-px bg-gray-800" />
              </div>

              <motion.button
                type="button"
                onClick={async () => {
                  try {
                    await signInWithGoogle();
                  } catch (err) {
                    toast.error('Connexion Google échouée.');
                  }
                }}
                className="group relative w-full flex items-center justify-center gap-2.5 px-4 py-2.5 bg-white hover:bg-gray-100 text-gray-800 font-medium rounded-lg transition-all duration-200 overflow-hidden"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.03) 50%, transparent 100%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 2s linear infinite',
                  }}
                  aria-hidden="true"
                />
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="text-sm">S'inscrire avec Google</span>
              </motion.button>
            </div>

            {/* Login link */}
            <p className="text-center text-sm text-gray-500 mt-6">
              Deja un compte ?{' '}
              <Link to="/login" className="text-amber-400 hover:text-amber-300 font-medium transition-colors">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
