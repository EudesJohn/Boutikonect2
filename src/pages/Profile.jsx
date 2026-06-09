import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  Loader2,
  Camera,
  Shield,
  CalendarDays,
  Store,
  MessageCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { uploadImage } from '../lib/database';

export default function Profile() {
  const { profile, user, updateProfile } = useAuth();
  const avatarInputRef = useRef(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    whatsapp: '',
    address: '',
    bio: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        whatsapp: profile.whatsapp || '',
        address: profile.address || '',
        bio: profile.bio || '',
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez selectionner une image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Limage doit faire moins de 5 Mo.');
      return;
    }

    setUploadingAvatar(true);
    try {
      if (!user?.id) { toast.error('Utilisateur non identifié.'); return; }
      const url = await uploadImage(file, 'products', `avatars/${user.id}`);
      if (url) {
        await updateProfile({ avatar_url: url });
        toast.success('Photo de profil mise a jour !');
      }
    } catch (err) {
      toast.error(err.message || 'Erreur lors du telechargement.');
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(form);
      toast.success('Profil mis a jour avec succes');
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la mise a jour');
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-black" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Mon Profil</h1>
              <p className="text-gray-400 text-sm">{user?.email || ''}</p>
            </div>
          </div>

          <div className="grid gap-6">
            {/* Avatar card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="p-6 rounded-2xl bg-gray-900/70 backdrop-blur-xl border border-gray-800"
            >
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden">
                    {uploadingAvatar ? (
                      <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                    ) : profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="" loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-gray-600" />
                    )}
                  </div>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-black hover:bg-amber-600 disabled:bg-gray-600 transition-colors cursor-pointer"
                    aria-label="Changer la photo de profil"
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">{profile.full_name || 'Utilisateur'}</h2>
                  <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                    <CalendarDays className="w-3.5 h-3.5" />
                    Membre depuis {new Date(profile.created_at || Date.now()).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                  </p>
                  {profile.role && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 mt-2 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Shield className="w-3 h-3" />
                      {profile.role === 'admin' ? 'Administrateur' : profile.role === 'seller' ? 'Vendeur' : 'Acheteur'}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Profile form */}
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onSubmit={handleSubmit}
              className="p-6 rounded-2xl bg-gray-900/70 backdrop-blur-xl border border-gray-800 space-y-5"
            >
              <h2 className="text-lg font-semibold text-white">Informations personnelles</h2>

              {/* Full name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Nom complet</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    name="full_name"
                    value={form.full_name}
                    onChange={handleChange}
                    placeholder="Votre nom"
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-400 text-sm outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Telephone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+229 XX XX XX XX"
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* WhatsApp */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  WhatsApp <span className="text-gray-500">(pour etre contacte par les acheteurs)</span>
                </label>
                <div className="relative">
                  <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                  <input
                    type="tel"
                    name="whatsapp"
                    value={form.whatsapp}
                    onChange={handleChange}
                    placeholder="+229 XX XX XX XX"
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  <MessageCircle className="w-3 h-3 inline text-green-500" /> Un bouton &quot;Contacter via WhatsApp&quot; apparaitra sur vos annonces
                </p>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Adresse</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Votre adresse"
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Bio</label>
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Parlez-nous de vous..."
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none placeholder-gray-500"
                />
              </div>

              {/* Seller info */}
              {profile.is_seller && (
                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                  <div className="flex items-center gap-2 text-amber-400 mb-2">
                    <Store className="w-4 h-4" />
                    <span className="font-medium">Compte vendeur</span>
                  </div>
                  <p className="text-sm text-gray-400">
                    Vous etes inscrit en tant que vendeur depuis le{' '}
                    {profile.seller_since
                      ? new Date(profile.seller_since).toLocaleDateString('fr-FR')
                      : '...'}
                  </p>
                </div>
              )}

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-700 disabled:text-gray-500 text-black font-semibold rounded-xl transition-all cursor-pointer"
                >
                  {saving ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</>
                  ) : (
                    <><Save className="w-4 h-4" /> Enregistrer</>
                  )}
                </button>
              </div>
            </motion.form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
