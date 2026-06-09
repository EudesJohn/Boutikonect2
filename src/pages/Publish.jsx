import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Package,
  Wrench,
  Upload,
  X,
  Loader2,
  CheckCircle,
  DollarSign,
  MapPin,
  Crosshair,
  MessageCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { createProduct, createService, updateProduct, updateService, getProductById, getServiceById, uploadMultipleImages } from '../lib/database';
import beninCities, { departments } from '../lib/beninCities';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PRODUCT_CATEGORIES = [
  { label: 'Electronique', value: 'electronics' },
  { label: 'Vetements', value: 'clothing' },
  { label: 'Alimentation', value: 'food_beverages' },
  { label: 'Maison & Jardin', value: 'home_garden' },
  { label: 'Beaute & Sante', value: 'beauty_health' },
  { label: 'Sports', value: 'sports' },
  { label: 'Jouets & Enfants', value: 'baby_kids' },
  { label: 'Vehicules', value: 'automotive' },
  { label: 'Autres', value: 'other' },
];

const SERVICE_CATEGORIES = [
  { label: 'Services a domicile', value: 'home_repair' },
  { label: 'Freelance & Digital', value: 'it_support' },
  { label: 'Education & Formation', value: 'education_tutoring' },
  { label: 'Sante & Bien-etre', value: 'beauty_wellness' },
  { label: 'Transport & Logistique', value: 'delivery_logistics' },
  { label: 'Evenementiel', value: 'event_planning' },
  { label: 'Construction & Renovation', value: 'home_repair' },
  { label: 'Conseil & Expertise', value: 'consulting' },
  { label: 'Photographie', value: 'photography' },
  { label: 'Nettoyage', value: 'cleaning' },
  { label: 'Autres services', value: 'other' },
];

// ---------------------------------------------------------------------------
// Tab config
// ---------------------------------------------------------------------------

const TABS = [
  { key: 'product', label: 'Produit', icon: Package },
  { key: 'service', label: 'Service', icon: Wrench },
];

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4 },
  }),
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function Publish() {
  const { user, profile, loading: authLoading, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef(null);

  // Type from query param
  const initialType = searchParams.get('type') === 'service' ? 'service' : 'product';
  const [type, setType] = useState(initialType);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('');
  const [isQuoteBased, setIsQuoteBased] = useState(false);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  // Location
  const [locationMode, setLocationMode] = useState('manual');
  const [city, setCity] = useState('');
  const [departmentSel, setDepartmentSel] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [locating, setLocating] = useState(false);
  // WhatsApp
  const [whatsapp, setWhatsapp] = useState('');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Edit mode
  const editId = searchParams.get('edit') || null;
  const [editMode] = useState(!!editId);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [existingImages, setExistingImages] = useState([]);

  // -----------------------------------------------------------------------
  // Initialize WhatsApp from profile
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (profile?.whatsapp) {
      setWhatsapp(profile.whatsapp);
    }
  }, [profile]);

  // -----------------------------------------------------------------------
  // Redirect if not authenticated
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/signin', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // -----------------------------------------------------------------------
  // Reset form on type change
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (editMode) return;
    setTitle('');
    setDescription('');
    setPrice('');
    setCategory('');
    setStock('');
    setIsQuoteBased(false);
    setImages([]);
    setImagePreviews([]);
    setExistingImages([]);
    setCity('');
    setDepartmentSel('');
    setLatitude('');
    setLongitude('');
    setWhatsapp(profile?.whatsapp || '');
    setErrors({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [type, editMode]);

  // -----------------------------------------------------------------------
  // Handle image selection
  // -----------------------------------------------------------------------
  function handleImageSelect(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter((f) => f.type.startsWith('image/'));
    if (validFiles.length !== files.length) {
      toast.error('Seuls les fichiers image sont acceptes.');
    }

    if (validFiles.length + images.length > 5) {
      toast.error('Maximum 5 images autorisees.');
      return;
    }

    const newPreviews = validFiles.map((file) => URL.createObjectURL(file));
    setImages((prev) => [...prev, ...validFiles]);
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  }

  function removeImage(index) {
    URL.revokeObjectURL(imagePreviews[index]);
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -----------------------------------------------------------------------
  // Validation
  // -----------------------------------------------------------------------
  function validate() {
    const newErrors = {};

    if (!title.trim()) newErrors.title = 'Le titre est requis.';
    if (!description.trim()) newErrors.description = 'La description est requise.';
    if (!category) newErrors.category = 'Veuillez selectionner une categorie.';

    if (type === 'product') {
      if (!price || isNaN(Number(price)) || Number(price) <= 0) {
        newErrors.price = 'Veuillez entrer un prix valide.';
      }
      if (!stock || isNaN(Number(stock)) || Number(stock) < 0) {
        newErrors.stock = 'Veuillez entrer un stock valide.';
      }
    }

    if (type === 'service' && !isQuoteBased) {
      if (!price || isNaN(Number(price)) || Number(price) <= 0) {
        newErrors.price = 'Veuillez entrer un prix valide.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // -----------------------------------------------------------------------
  // Geolocation - detect current position & find nearest commune
  // -----------------------------------------------------------------------
  function detectLocation() {
    if (!navigator.geolocation) {
      toast.error('La geolocalisation nest pas supportee par votre navigateur.');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat.toFixed(6));
        setLongitude(lng.toFixed(6));
        setLocationMode('auto');

        // Find nearest commune from beninCities
        let nearest = null;
        let minDist = Infinity;
        for (const c of beninCities) {
          const dlat = c.lat - lat;
          const dlng = c.lng - lng;
          const dist = Math.sqrt(dlat * dlat + dlng * dlng);
          if (dist < minDist) {
            minDist = dist;
            nearest = c;
          }
        }
        if (nearest) {
          setCity(nearest.name);
          setDepartmentSel(nearest.department);
          toast.success(`Position detectee : ${nearest.name}, ${nearest.department}`);
        } else {
          toast.success('Position detectee avec succes !');
        }
        setLocating(false);
      },
      (error) => {
        setLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error('Veuillez autoriser la geolocalisation.');
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error('Position indisponible. Saisissez votre ville manuellement.');
            break;
          case error.TIMEOUT:
            toast.error('Delai depasse. Veuillez reessayer.');
            break;
          default:
            toast.error('Erreur de geolocalisation.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // When department changes, reset city
  function handleDepartmentChange(dept) {
    setDepartmentSel(dept);
    setCity('');
  }

  // When city changes, set coords from beninCities if available
  function handleCityChange(communeName) {
    setCity(communeName);
    if (communeName && locationMode === 'manual') {
      const found = beninCities.find((c) => c.name === communeName);
      if (found) {
        setLatitude(found.lat.toFixed(6));
        setLongitude(found.lng.toFixed(6));
      }
    }
  }

  // -----------------------------------------------------------------------
  // Load existing data for edit mode
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!editId || !user) return;
    loadEditData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, user]);

  async function loadEditData() {
    setLoadingEdit(true);
    try {
      let item;
      let detectedType = type;

      // Try specified type first, then auto-detect by checking both tables
      if (detectedType === 'service') {
        item = await getServiceById(editId);
      } else if (detectedType === 'product') {
        item = await getProductById(editId);
      }

      // If URL has no type or wrong type, auto-detect
      if (!item) {
        item = await getProductById(editId);
        if (item) detectedType = 'product';
      }
      if (!item) {
        item = await getServiceById(editId);
        if (item) detectedType = 'service';
      }

      if (!item) {
        toast.error('Annonce introuvable.');
        navigate('/my-products');
        return;
      }

      // Ensure correct type tab is active
      if (detectedType !== type) {
        setType(detectedType);
      }

      setTitle(item.title || '');
      setDescription(item.description || '');
      setPrice(item.price != null ? String(item.price) : '');
      setCategory(item.category || '');

      if (detectedType === 'service') {
        setIsQuoteBased(item.pricing_type === 'custom_quote');
      }
      if (detectedType === 'product' && item.quantity != null) {
        setStock(String(item.quantity));
      }

      // Images
      if (item.images && Array.isArray(item.images)) {
        setExistingImages(item.images.filter(Boolean));
      }

      // Location
      if (item.city) setCity(item.city);
      if (item.department) setDepartmentSel(item.department);
      if (item.latitude != null) setLatitude(String(item.latitude));
      if (item.longitude != null) setLongitude(String(item.longitude));
      if (item.city) setLocationMode('manual');
    } catch (err) {
      toast.error('Erreur lors du chargement des donnees.');
      console.error(err);
    } finally {
      setLoadingEdit(false);
    }
  }

  // -----------------------------------------------------------------------
  // Submit
  // -----------------------------------------------------------------------
  async function handleSubmit(e) {
    e.preventDefault();

    if (!validate()) {
      toast.error('Veuillez corriger les erreurs dans le formulaire.');
      return;
    }

    setSubmitting(true);

    try {
      // Upload new images
      let newImageUrls = [];
      if (images.length > 0) {
        try {
          newImageUrls = await uploadMultipleImages(images);
        } catch (imgErr) {
          toast.error(
            "Certaines images n'ont pas pu etre telechargees. Voulez-vous continuer sans?"
          );
        }
      }

      // Combine existing (kept) images with newly uploaded ones
      const allImageUrls = [...existingImages, ...newImageUrls];

      const locationData = {
        city: city || null,
        department: departmentSel || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      };

      const baseData = {
        title: title.trim(),
        description: description.trim(),
        price: type === 'service' && isQuoteBased ? 0 : Number(price),
        category,
        images: allImageUrls,
        cover_image: allImageUrls.length > 0 ? allImageUrls[0] : null,
        ...locationData,
      };

      if (editMode) {
        // ---- UPDATE ----
        if (type === 'service') {
          await updateService(editId, {
            ...baseData,
            pricing_type: isQuoteBased ? 'custom_quote' : 'fixed',
          });
        } else {
          await updateProduct(editId, {
            ...baseData,
            quantity: Number(stock || 1),
          });
        }
        toast.success('Annonce modifiee avec succes !');
      } else {
        // ---- CREATE ----
        if (type === 'service') {
          await createService({
            ...baseData,
            seller_id: user.id,
            pricing_type: isQuoteBased ? 'custom_quote' : 'fixed',
          });
        } else {
          await createProduct({
            ...baseData,
            seller_id: user.id,
            quantity: Number(stock || 1),
          });
        }
        toast.success(
          type === 'product'
            ? 'Produit publie avec succes!'
            : 'Service publie avec succes!'
        );
      }

      // Sauvegarder le WhatsApp dans le profil si modifie
      saveWhatsappIfChanged();

      navigate('/my-products');
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la publication.');
    } finally {
      setSubmitting(false);
    }
  }

  async function saveWhatsappIfChanged() {
    const trimmedWhatsapp = whatsapp.trim();
    if (trimmedWhatsapp !== (profile?.whatsapp || '')) {
      try {
        await updateProfile({ whatsapp: trimmedWhatsapp || null });
      } catch {
        // Non bloquant
      }
    }
  }

  // -----------------------------------------------------------------------
  // Auth loading
  // -----------------------------------------------------------------------
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Chargement...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Redirection vers la connexion...</p>
      </div>
    );
  }

  if (editMode && loadingEdit) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Chargement des donnees...</span>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-gray-900 mb-8"
        >
          {editMode ? 'Modifier l\'annonce' : 'Publier une annonce'}
        </motion.h1>

        {/* Type Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-1.5 inline-flex mb-8"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = type === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setType(tab.key)}
                disabled={editMode}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md'
                    : editMode
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <motion.div
            custom={0}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
          >
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Titre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                type === 'product'
                  ? 'Ex: iPhone 14 Pro Max 256Go'
                  : 'Ex: Coaching en marketing digital'
              }
              className={`w-full px-4 py-3 rounded-xl border bg-white text-gray-900 ${
                errors.title ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-200'
              } focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all`}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500">{errors.title}</p>
            )}
          </motion.div>

          {/* Description */}
          <motion.div
            custom={1}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
          >
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Decrivez votre produit ou service en details..."
              className={`w-full px-4 py-3 rounded-xl border bg-white text-gray-900 ${
                errors.description
                  ? 'border-red-300 ring-2 ring-red-100'
                  : 'border-gray-200'
              } focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all resize-y`}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-500">{errors.description}</p>
            )}
          </motion.div>

          {/* Price */}
          <motion.div
            custom={2}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Prix{' '}
                {type === 'product'
                  ? '(FCFA)'
                  : isQuoteBased
                  ? '(optionnel)'
                  : '(FCFA)'}
                {!isQuoteBased && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="5000"
                  disabled={type === 'service' && isQuoteBased}
                  min="0"
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.price ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-200'
                  } ${
                    type === 'service' && isQuoteBased
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'bg-white text-gray-900'
                  } focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all pl-10`}
                />
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              {errors.price && (
                <p className="mt-1 text-sm text-red-500">{errors.price}</p>
              )}
            </div>

            {/* Service: Sur Devis checkbox */}
            {type === 'service' && (
              <div className="flex items-end pb-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isQuoteBased}
                    onChange={(e) => {
                      setIsQuoteBased(e.target.checked);
                      if (e.target.checked) setPrice('');
                    }}
                    className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Sur Devis (le prix sera discute avec le client)
                  </span>
                </label>
              </div>
            )}

            {/* Stock (products only) */}
            {type === 'product' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Stock <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="10"
                  min="0"
                  className={`w-full px-4 py-3 rounded-xl border bg-white text-gray-900 ${
                    errors.stock
                      ? 'border-red-300 ring-2 ring-red-100'
                      : 'border-gray-200'
                  } focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all`}
                />
                {errors.stock && (
                  <p className="mt-1 text-sm text-red-500">{errors.stock}</p>
                )}
              </div>
            )}
          </motion.div>

          {/* Category */}
          <motion.div
            custom={3}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
          >
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Categorie <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border text-gray-900 ${
                errors.category
                  ? 'border-red-300 ring-2 ring-red-100'
                  : 'border-gray-200'
              } focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all bg-white`}
            >
              <option value="" className="text-gray-500">Selectionnez une categorie</option>
              {(type === 'product' ? PRODUCT_CATEGORIES : SERVICE_CATEGORIES).map(
                (cat) => (
                  <option key={cat.value} value={cat.value} className="text-gray-900">
                    {cat.label}
                  </option>
                )
              )}
            </select>
            {errors.category && (
              <p className="mt-1 text-sm text-red-500">{errors.category}</p>
            )}
          </motion.div>

          {/* Images */}
          <motion.div
            custom={4}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
          >
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Images (max 5)
            </label>

            {/* Upload area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50/30 transition-all"
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600">
                Cliquez pour ajouter des images
              </p>
              <p className="text-xs text-gray-400 mt-1">
                PNG, JPG, WebP acceptes
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>

            {/* Previews */}
            {(imagePreviews.length > 0 || existingImages.length > 0) && (
              <div className="flex flex-wrap gap-3 mt-4">
                {/* New images (Files) */}
                {imagePreviews.map((preview, index) => (
                  <div key={`new-${index}`} className="relative group">
                    <img
                      src={preview}
                      alt={`Apercu ${index + 1}`}
                      className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {/* Existing images (URLs) */}
                {existingImages.map((url, index) => (
                  <div key={`existing-${index}`} className="relative group">
                    <img
                      src={url}
                      alt={`Image ${index + 1}`}
                      className="w-24 h-24 object-cover rounded-lg border border-green-200"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setExistingImages((prev) => prev.filter((_, i) => i !== index))
                      }
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* ================================================================ */}
          {/* Location */}
          {/* ================================================================ */}
          <motion.div
            custom={5}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Localisation
                  </h3>
                </div>
                {(latitude && longitude) && (
                  <span className="text-xs text-gray-400 font-mono">
                    {latitude}, {longitude}
                  </span>
                )}
              </div>

              {/* Detect button */}
              <button
                type="button"
                onClick={detectLocation}
                disabled={locating}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 mb-4 border-2 border-dashed border-purple-300 text-purple-700 font-medium rounded-xl hover:bg-purple-50 hover:border-purple-400 transition-all disabled:opacity-60 cursor-pointer"
              >
                {locating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Detection en cours...
                  </>
                ) : (
                  <>
                    <Crosshair className="w-5 h-5" />
                    {locationMode === 'auto'
                      ? 'Re-detecter ma position'
                      : 'Detecter ma position'}
                  </>
                )}
              </button>

              {/* Location status */}
              {locationMode === 'auto' && city && (
                <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                  <MapPin className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700 font-medium">
                    {city} ({departmentSel})
                  </span>
                </div>
              )}

              {/* Manual inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Departement
                  </label>
                  <select
                    value={departmentSel}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all bg-white text-sm text-gray-900"
                  >
                    <option value="" className="text-gray-500">Selectionnez un departement</option>
                    {departments.map((d) => (
                      <option key={d.name} value={d.name} className="text-gray-900">
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ville / Commune
                  </label>
                  <select
                    value={city}
                    onChange={(e) => handleCityChange(e.target.value)}
                    disabled={!departmentSel}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all bg-white text-sm text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="" className="text-gray-500">
                      {departmentSel
                        ? 'Selectionnez une commune'
                        : 'Choisissez un departement d\'abord'}
                    </option>
                    {departmentSel &&
                      departments
                        .find((d) => d.name === departmentSel)
                        ?.communes.sort((a, b) => a.name.localeCompare(b.name))
                        .map((c) => (
                          <option key={c.id} value={c.name} className="text-gray-900">
                            {c.name}
                          </option>
                        ))}
                  </select>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ================================================================ */}
          {/* WhatsApp */}
          {/* ================================================================ */}
          <motion.div
            custom={6}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <MessageCircle className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Contact WhatsApp
                </h3>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Ce numero apparaîtra sur votre annonce pour permettre aux acheteurs de vous contacter directement.
              </p>
              <div className="relative">
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+229 XX XX XX XX"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none transition-all bg-white text-gray-900 text-sm"
                />
                <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
              </div>
              {whatsapp && (
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Un bouton WhatsApp sera affiche sur votre annonce
                </p>
              )}
            </div>
          </motion.div>

          {/* Submit */}
          <motion.div
            custom={7}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="pt-2"
          >
            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {editMode ? 'Enregistrement...' : 'Publication en cours...'}
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  {editMode
                    ? 'Enregistrer les modifications'
                    : type === 'product'
                    ? 'Publier le produit'
                    : 'Publier le service'}
                </>
              )}
            </button>
          </motion.div>
        </form>
      </div>
    </div>
  );
}
