// ============================================================
// BoutiKonect ML Assistant — Base de Connaissances
// ============================================================
//
// Structure d'une entrée :
//   id          : Identifiant unique
//   topic       : Catégorie principale
//   subtopic    : Sous-catégorie (optionnelle)
//   keywords    : Mots-clés pour le matching
//   patterns    : Expressions régulières pour la détection d'intention
//   response    : Réponse texte
//   priority    : Priorité (1-10, 10 = le plus spécifique)
//   context     : Tags de contexte pour les follow-ups
//   requires    : Données nécessaires (pour les requêtes live)
//   entities    : Entités à extraire de la question

export const knowledgeBase = [
  // ===================================================================
  // TOPIC: PRÉSENTATION & GÉNÉRAL
  // ===================================================================
  {
    id: 'intro',
    topic: 'general',
    subtopic: 'presentation',
    keywords: ['boutikonect', 'c\'est quoi', 'qu\'est-ce que', 'presentation', 'platforme', 'plateforme',
      'a quoi ça sert', 'but', 'mission', 'site'],
    patterns: [/c('|’)est quoi (boutikonect|c(e|')est|ce site)/i, /qu('|’)est ce que (c(e|')est|boutikonect)/i,
      /presente?(-moi)? (boutikonect|la plateforme|le site)/i, /a quoi (sert|ca sert) boutikonect/i],
    response:
      "**BoutiKonect** est une plateforme de mise en relation entre acheteurs et vendeurs au **Bénin**, dans les 77 communes du pays. 🎯\n\nNotre mission est de faciliter le commerce local en connectant directement les acheteurs avec les vendeurs, prestataires de services et artisans près de chez eux.\n\n**Ce que vous pouvez faire :**\n\n✅ **Acheter** des produits et services près de chez vous\n✅ **Vendre** vos produits ou proposer vos services\n✅ **Rechercher** par catégorie, localisation ou mot-clé\n✅ **Contacter** les vendeurs directement via WhatsApp\n✅ **Géolocalisation** pour trouver des offres autour de vous\n\n**Couverture :** Toutes les 77 communes du Bénin 🇧🇯\n\nBesoin d'aide sur un sujet en particulier ? Dites-moi ce que vous cherchez !",
    priority: 3,
    context: ['general'],
  },
  {
    id: 'features_overview',
    topic: 'general',
    subtopic: 'fonctionnalites',
    keywords: ['fonctionnalités', 'features', 'fonctionalites', 'possibilités', 'tout', 'fonctionnalite',
      'que pouvez vous faire', 'capacités', 'capabilities'],
    patterns: [/quelles sont (les fonctionnalit|vos capacit)/i, /que (pouvez|peux)-tu/i, /liste (des|de) (fonctionnalit|capacit)/i],
    response:
      "Voici tout ce que vous pouvez faire sur **BoutiKonect** :\n\n**🛒 Pour les acheteurs :**\n- Parcourir les produits et services par catégorie\n- Rechercher par mot-clé, localisation ou proximité\n- Voir les détails d'un produit (photos, prix, description)\n- Lire les avis des autres clients\n- Contacter le vendeur via WhatsApp\n- Ajouter au panier et commander (même sans compte !)\n- Suivre vos commandes\n\n**💼 Pour les vendeurs :**\n- Créer votre boutique en ligne gratuitement\n- Publier des produits et services avec photos\n- Gérer vos commandes et stocks\n- Voir vos statistiques de vente\n- Promouvoir vos annonces (badge \"Promu\")\n- Générer des reçus et factures PDF\n\n**🔧 Fonctionnalités techniques :**\n- Géolocalisation des offres\n- Paiement mobile (MTN MoMo, Moov Money, Orange Money)\n- Profil vérifié avec badge\n- Messagerie intégrée\n- Recommandations personnalisées\n- Filtres de recherche avancés\n\nDes questions sur une fonctionnalité en particulier ?",
    priority: 2,
    context: ['general', 'features'],
  },
  {
    id: 'technologies',
    topic: 'general',
    subtopic: 'technique',
    keywords: ['technologie', 'tech stack', 'react', 'supabase', 'framework', 'vite', 'tailwind',
      'technique', 'construit avec', 'comment c\'est fait', 'code', 'développement'],
    patterns: [/technologie/i, /stack technique/i, /comment (c'est fait|le site est (fait|construit))/i,
      /framework/i, /avec quoi/i],
    response:
      "BoutiKonect est construit avec les technologies modernes suivantes :\n\n**Frontend :**\n- ⚛️ **React 19** — Bibliothèque UI\n- ⚡ **Vite 8** (Rolldown) — Bundler ultra-rapide\n- 🎨 **Tailwind CSS v4** — Styles utilitaires\n- 🎭 **Framer Motion** — Animations fluides\n- 🔷 **Lucide React** — Icônes\n\n**Backend & Infrastructure :**\n- 🗄️ **Supabase** — Base de données PostgreSQL + Auth + Storage\n- 🔐 **Row Level Security (RLS)** — Sécurité au niveau ligne\n- 📦 **Supabase Storage** — Images et fichiers\n\n**Fonctionnalités avancées :**\n- 🧠 **Assistant IA** — Machine Learning pour vous assister\n- 🔍 **Fuse.js** — Recherche floue intelligente\n- 📄 **html2pdf.js / jsPDF** — Génération de reçus PDF\n\nLe code source est organisé en composants réutilisables avec une architecture modulaire. Les pages sont dans `src/pages/`, les composants dans `src/components/`, et la logique métier dans `src/lib/`.",
    priority: 2,
    context: ['general', 'technique'],
  },

  // ===================================================================
  // TOPIC: ACHATS & COMMANDES
  // ===================================================================
  {
    id: 'how_to_buy',
    topic: 'buying',
    subtopic: 'achat',
    keywords: ['acheter', 'commander', 'achat', 'comment acheter', 'passer commande', 'faire un achat',
      'procédure achat', 'étapes achat', 'guide achat', 'acheter produit', 'acheter service'],
    patterns: [/comment (acheter|commander|passer commande)/i, /(je veux|je voudrais) (acheter|commander)/i,
      /procédure (d'|d)(achat|e commande)/i, /étapes (pour|d')(achat|e commande)/i],
    response:
      "Voici comment acheter sur **BoutiKonect** :\n\n**📝 Étapes pour acheter un produit ou service :**\n\n1️⃣ **Trouvez ce que vous cherchez** : Utilisez la barre de recherche, parcourez les catégories, ou filtrez par localisation.\n\n2️⃣ **Consultez l'annonce** : Cliquez sur le produit/service pour voir les photos, le prix, la description et les avis.\n\n3️⃣ **Ajoutez au panier** : Cliquez sur le bouton \"Ajouter au panier\" ou \"Je commande\".\n\n4️⃣ **Commandez** : Rendez-vous dans votre panier, remplissez vos coordonnées (nom, téléphone, adresse de livraison) et validez.\n\n5️⃣ **Paiement** : Choisissez votre mode de paiement (Mobile Money, livraison, etc.).\n\n6️⃣ **Suivi** : Vous recevrez une confirmation et pourrez suivre votre commande depuis votre tableau de bord.\n\n**🔓 Bon à savoir :** Vous pouvez commander **sans créer de compte** ! Vos coordonnées suffisent.\n\nVous avez besoin d'aide pour une étape en particulier ?",
    priority: 7,
    context: ['buying', 'orders'],
  },
  {
    id: 'order_without_account',
    topic: 'buying',
    subtopic: 'guest_checkout',
    keywords: ['sans compte', 'sans inscription', 'commander sans compte', 'guest', 'invité',
      'pas de compte', 'sans connecter', 'anonyme', 'sans créer compte'],
    patterns: [/sans (compte|inscription|connecter)/i, /pas (besoin de |besoin d')(compte|inscription)/i,
      /commander (sans |en tant qu')(compte|invit|anonyme)/i, /guest (checkout|commande)/i],
    response:
      "✅ **Oui, vous pouvez commander sans créer de compte sur BoutiKonect !**\n\nLa commande \"invité\" est disponible pour tous les produits et services.\n\n**Comment faire :**\n1️⃣ Ajoutez le produit/service à votre panier\n2️⃣ Cliquez sur le panier 🛒\n3️⃣ Remplissez vos coordonnées :\n   - Votre nom\n   - Votre numéro de téléphone\n   - Votre adresse de livraison\n4️⃣ Validez la commande\n\n**C'est tout !** Vous recevrez une confirmation avec votre numéro de commande.\n\n**Pourquoi créer un compte quand même ?**\nAvoir un compte vous permet de :\n- Suivre vos commandes en temps réel\n- Voir l'historique de vos achats\n- Laisser des avis sur les produits\n- Bénéficier de recommandations personnalisées\n- Accéder à votre tableau de bord client\n\nMais c'est **100% optionnel** pour commander !",
    priority: 9,
    context: ['buying', 'orders', 'guest'],
  },
  {
    id: 'order_status',
    topic: 'buying',
    subtopic: 'suivi_commande',
    keywords: ['statut commande', 'suivi commande', 'où est ma commande', 'commande en cours',
      'état commande', 'suivre colis', 'avancement commande', 'status', 'commande livrée',
      'commande confirmée', 'commande en traitement'],
    patterns: [/statut (de |de la |de mon|de ma)? commande/i, /suivi (de|d')? ?commande/i,
      /où (est|se trouve) (ma|la) commande/i, /(avancement|état) (de |de la )?commande/i,
      /quand (est-ce que )?(ma )?commande (va |sera )? (arriver|livr)/i],
    response:
      "Voici les différents statuts d'une commande sur **BoutiKonect** :\n\n📦 **Statuts de commande :**\n\n1. ⏳ **Pending** (En attente) — Votre commande vient d'être créée\n2. ✅ **Confirmed** (Confirmée) — Le vendeur a confirmé votre commande\n3. 🔄 **Processing** (En traitement) — Le vendeur prépare votre colis\n4. 🚚 **Shipped** (Expédiée) — Votre colis a été envoyé\n5. 📬 **Delivered** (Livrée) — Vous avez reçu votre colis !\n6. ❌ **Cancelled** (Annulée) — La commande a été annulée\n7. ↩️ **Refunded** (Remboursée) — Vous avez été remboursé\n\n**Comment suivre votre commande :**\n- Connectez-vous à votre compte et allez dans \"Mes commandes\"\n- Vous verrez le statut actuel et l'historique\n- Contactez le vendeur si vous avez des questions\n\n**Vous avez un problème ?** Contactez le vendeur directement ou utilisez la section \"Aide\" du tableau de bord.",
    priority: 6,
    context: ['buying', 'orders', 'suivi'],
  },
  {
    id: 'cancel_order',
    topic: 'buying',
    subtopic: 'annulation',
    keywords: ['annuler commande', 'annulation', 'commande annulée', 'stopper commande',
      'ne plus vouloir', 'annuler achat', 'retour'],
    patterns: [/annuler (ma |la )?commande/i, /(je veux|je voudrais) annuler/i,
      /comment annuler/i, /annulation (commande|d'achat)/i],
    response:
      "**Comment annuler une commande sur BoutiKonect :**\n\n1️⃣ Connectez-vous à votre compte\n2️⃣ Allez dans \"Mes commandes\"\n3️⃣ Trouvez la commande concernée\n4️⃣ Cliquez sur \"Annuler la commande\"\n\n**Conditions d'annulation :**\n- ✅ Vous pouvez annuler tant que la commande est en statut \"En attente\" ou \"Confirmée\"\n- ❌ Une fois la commande \"Expédiée\" ou \"Livrée\", vous devez contacter le vendeur\n- 💰 Le remboursement est effectué sous 48-72h après annulation\n\n**Commande passée sans compte ?**\nUtilisez le numéro de commande (BK-XXXX) reçu par email/SMS pour contacter notre support.",
    priority: 6,
    context: ['buying', 'orders', 'cancel'],
  },
  {
    id: 'add_to_cart',
    topic: 'buying',
    subtopic: 'panier',
    keywords: ['panier', 'ajouter au panier', 'mon panier', 'voir panier', 'contenu panier',
      'vider panier', 'supprimer panier', 'modifier panier'],
    patterns: [/ajouter au panier/i, /(mon |le )?panier/i, /voir (mon |le )?panier/i,
      /(supprimer|enlever|retirer) (du |de mon )?panier/i],
    response:
      "**🛒 Gérer votre panier sur BoutiKonect :**\n\n**Ajouter un produit au panier :**\n- Ouvrez la page du produit qui vous intéresse\n- Cliquez sur le bouton \"Ajouter au panier\"\n- Le produit est ajouté avec la quantité souhaitée\n\n**Voir votre panier :**\n- Cliquez sur l'icône 🛒 en haut à droite\n- Vous verrez tous les articles ajoutés avec leurs prix\n\n**Modifier votre panier :**\n- Ajustez les quantités avec les boutons +/-\n- Supprimez un article avec l'icône poubelle\n- Les prix sont mis à jour automatiquement\n\n**Passer commande :**\n- Cliquez sur \"Valider le panier\" ou \"Commander\"\n- Remplissez vos coordonnées de livraison\n- Confirmez et votre commande est envoyée au vendeur !\n\n💡 **Astuce :** Votre panier est sauvegardé même si vous quittez la page !",
    priority: 6,
    context: ['buying', 'cart'],
  },

  // ===================================================================
  // TOPIC: VENTE & VENDEURS
  // ===================================================================
  {
    id: 'become_seller',
    topic: 'selling',
    subtopic: 'devenir_vendeur',
    keywords: ['devenir vendeur', 'vendre', 'vendeur', 'inscrire vendeur', 'créer boutique',
      'ouvrir boutique', 'vendre produits', 'vendre services', 's\'inscrire comme vendeur',
      'devenir marchand', 'inscription vendeur'],
    patterns: [/devenir (vendeur|marchand|commerçant|prestataire)/i, /comment (vendre|devenir vendeur)/i,
      /(je veux|je voudrais) vendre/i, /(créer|ouvrir) (une |ma )?boutique/i,
      /s'inscrire (comme|en tant que) vendeur/i],
    response:
      "**💼 Devenir vendeur sur BoutiKonect — C'est simple et gratuit !**\n\n**Étapes :**\n\n1️⃣ **Créez un compte** — Inscrivez-vous sur la plateforme\n2️⃣ **Activez le mode vendeur** — Cochez \"Devenir vendeur\" lors de l'inscription ou activez-le depuis votre profil\n3️⃣ **Complétez votre profil vendeur** :\n   - Nom de votre boutique\n   - Description de votre activité\n   - Votre numéro WhatsApp\n   - Votre ville et quartier\n   - Photo de profil ou logo\n4️⃣ **Publiez vos annonces** :\n   - Cliquez sur \"Publier une annonce\"\n   - Choisissez Produit ou Service\n   - Ajoutez photos, description, prix\n5️⃣ **Commencez à vendre !** Recevez les commandes et gérez-les depuis votre tableau de bord.\n\n**💰 Tarifs :**\n- Inscription : **Gratuite** 🆓\n- Publication d'annonces : **Gratuite** (jusqu'à 50)\n- Commission par vente : **5% seulement**\n\n**📊 Tableau de bord vendeur :**\n- Gérez vos produits/services\n- Suivez vos commandes en temps réel\n- Consultez vos statistiques (revenus, ventes, etc.)\n- Générez des reçus PDF pour vos clients\n\nDes questions sur la vente ? Je suis là pour vous guider !",
    priority: 8,
    context: ['selling', 'seller'],
  },
  {
    id: 'publish_product',
    topic: 'selling',
    subtopic: 'publier_annonce',
    keywords: ['publier annonce', 'ajouter produit', 'ajouter service', 'publier produit',
      'mettre en vente', 'créer annonce', 'nouveau produit', 'nouvelle annonce',
      'publier', 'poster annonce'],
    patterns: [/comment (publier|ajouter|mettre en ligne) (une |mon |un )?(annonce|produit|service)/i,
      /publier (une |mon )(annonce|produit|service)/i,
      /ajouter (un |mon )(produit|service)/i],
    response:
      "**📝 Publier une annonce sur BoutiKonect :**\n\n**Pour les produits :**\n1. Connectez-vous avec votre compte vendeur\n2. Allez dans \"Publier\" ou \"Ajouter un produit\" depuis le menu\n3. Remplissez les informations :\n   - Titre du produit (court et descriptif)\n   - Prix (en FCFA)\n   - Catégorie (Électronique, Mode, Alimentation, etc.)\n   - Photos (jusqu'à 5 images)\n   - Description détaillée\n   - Quantité en stock\n   - Ville et département\n4. Cliquez sur \"Publier\" ✅\n\n**Pour les services :**\nMême procédure, avec des champs adaptés :\n   - Type de service\n   - Zone d'intervention\n   - Disponibilités\n\n**💡 Conseils pour une bonne annonce :**\n- 📸 Photos de qualité, bien éclairées\n- ✏️ Titre clair avec mots-clés importants\n- 📝 Description détaillée (matériaux, dimensions, état, etc.)\n- 💰 Prix juste et compétitif\n- 📍 Localisation précise\n\nVotre annonce sera visible immédiatement après publication !",
    priority: 7,
    context: ['selling', 'publish'],
  },
  {
    id: 'seller_commission',
    topic: 'selling',
    subtopic: 'commission',
    keywords: ['commission', 'frais vente', 'commission vendeur', 'pourcentage', 'tarif vendeur',
      'combien ça coûte de vendre', 'frais plateforme', 'taxe vente'],
    patterns: [/commission/i, /frais (de |des )?vente/i, /combien (coûte|prend) (la plateforme|boutikonect)/i,
      /quel (est le |est le )?pourcentage/i, /tarif (vendeur|pour vendre)/i],
    response:
      "**💰 Tarifs pour les vendeurs sur BoutiKonect :**\n\n| Service | Tarif |\n|---------|------|\n| Inscription vendeur | **Gratuite** 🆓 |\n| Publication d'annonces | **Gratuite** (50 premières) |\n| Commission par vente | **5%** du montant |\n| Mise en avant (Promu) | 5 000 FCFA/semaine |\n\n**Détail de la commission :**\n- La commission de 5% est prélevée **uniquement** lorsque vous réalisez une vente\n- Vous gardez donc **95%** du montant de chaque vente\n- Pas de frais cachés ni d'abonnement mensuel\n\n**Pourquoi cette commission ?**\n- Hébergement de vos annonces\n- Visibilité sur la plateforme\n- Système de paiement sécurisé\n- Support client\n- Fonctionnalités de gestion\n\nC'est l'une des offres les plus avantageuses du marché béninois !",
    priority: 7,
    context: ['selling', 'commission'],
  },
  {
    id: 'seller_dashboard',
    topic: 'selling',
    subtopic: 'tableau_bord',
    keywords: ['tableau de bord', 'dashboard', 'statistiques vente', 'stats vendeur',
      'mes ventes', 'mes produits', 'gérer boutique', 'administration vente'],
    patterns: [/tableau de bord (vendeur|vente)?/i, /(mes|voir mes) (ventes|statistiques|stats)/i,
      /dashboard vendeur/i, /gérer (ma |mes )?(boutique|annonces|produits)/i],
    response:
      "**📊 Le tableau de bord vendeur — Votre centre de contrôle :**\n\nDepuis votre tableau de bord, vous pouvez gérer toute votre activité :\n\n**📦 Commandes :**\n- Voir les nouvelles commandes\n- Confirmer, expédier ou marquer comme livrée\n- Contacter les acheteurs\n- Historique complet\n\n**📋 Mes annonces :**\n- Liste de tous vos produits/services\n- Modifier ou mettre à jour une annonce\n- Activer/désactiver un produit\n- Voir le nombre de vues\n\n**📈 Statistiques :**\n- Revenus totaux et par période\n- Nombre de commandes\n- Produits les plus vendus\n- Évaluations moyennes\n\n**🛠️ Profil boutique :**\n- Modifier les informations de votre boutique\n- Changer votre photo/logo\n- Mettre à jour votre numéro WhatsApp\n\n**📄 Reçus :**\n- Générer des reçus PDF pour vos clients\n- Imprimer les factures\n\nAccédez-y depuis le menu en cliquant sur votre profil > \"Tableau de bord\".",
    priority: 6,
    context: ['selling', 'dashboard'],
  },
  {
    id: 'seller_verification',
    topic: 'selling',
    subtopic: 'verification',
    keywords: ['badge vérifié', 'compte vérifié', 'verification', 'vérifié', 'badge', 'certification',
      'valider compte', 'identité vérifiée', 'compte certifié'],
    patterns: [/badge (vérifié|de vérification|verified)?/i, /(comment )?(vérifier|valider) (mon |le )?compte/i,
      /obtenir le badge/i, /(être |devenir )?vérifié/i],
    response:
      "**✅ Badge \"Vérifié\" sur BoutiKonect :**\n\nLe badge vérifié est un gage de confiance qui rassure les acheteurs.\n\n**Comment l'obtenir :**\n1. Complétez votre profil vendeur (photo, description, coordonnées)\n2. Publiez au moins 3 annonces avec photos réelles\n3. Ayez un historique de ventes positif\n4. Soumettez une demande de vérification depuis votre tableau de bord\n\n**Avantages du badge vérifié :**\n- 🔵 Visibilité accrue dans les recherches\n- 🤝 Confiance renforcée auprès des acheteurs\n- 📈 Jusqu'à 40% de vues supplémentaires\n- 🏆 Apparaît en priorité dans certains résultats\n\nLa vérification est **gratuite** et traitée sous 24-48h par notre équipe.",
    priority: 5,
    context: ['selling', 'verification'],
  },

  // ===================================================================
  // TOPIC: SERVICES
  // ===================================================================
  {
    id: 'services_overview',
    topic: 'services',
    subtopic: 'general',
    keywords: ['service', 'prestataire', 'prestation', 'service disponible', 'type de service',
      'offrir service', 'proposer service'],
    patterns: [/quels (sont les|types de) services/i, /service (disponible|propos)/i,
      /(comment |je veux )?proposer (un |mon )?service/i],
    response:
      "**🔧 Services sur BoutiKonect :**\n\nVous pouvez trouver ou proposer une large gamme de services :\n\n**📚 Éducation :**\n- Cours particuliers (maths, physique, langues)\n- Tutorat et soutien scolaire\n- Formations professionnelles\n\n**🔧 Réparation & Entretien :**\n- Électricien, plombier, menuisier\n- Réparation téléphone/ordinateur\n- Entretien ménager et jardinage\n\n**💇 Coiffure & Beauté :**\n- Coiffure hommes/femmes\n- Soins esthétiques\n- Manucure/pédicure\n\n**💻 Support Informatique :**\n- Installation et maintenance\n- Dépannage\n- Création de sites web\n\n**📸 Photographie & Vidéo :**\n- Shooting photo\n- Couverture d'événements\n- Montage vidéo\n\n**🚚 Livraison :**\n- Coursier et transport\n- Livraison de colis\n\n**🏠 Et bien plus :**\n- Consultation, conseil\n- Organisation d'événements\n- Nettoyage\n\n👉 Pour proposer un service, créez votre compte vendeur et publiez votre annonce dans la catégorie appropriée !",
    priority: 5,
    context: ['services', 'service'],
  },

  // ===================================================================
  // TOPIC: LIVRAISON
  // ===================================================================
  {
    id: 'delivery_info',
    topic: 'delivery',
    subtopic: 'details',
    keywords: ['livraison', 'livrer', 'transport', 'colis', 'expédition', 'envoi', 'livré',
      'recevoir', 'récupérer', 'commande livrée'],
    patterns: [/livraison/i, /(frais|délais?|tarif)s? de livraison/i, /comment (est-ce que )?(la )?livraison/i,
      /transport (du |de |des )?(produit|colis|marchandise)/i],
    response:
      "**🚚 Livraison sur BoutiKonect — 77 communes couvertes !**\n\n**Options de livraison :**\n📦 **Standard :** 2 à 5 jours ouvrés — **1 000 à 3 000 FCFA**\n⚡ **Express :** 24 à 48h dans les grandes villes — **3 000 à 5 000 FCFA**\n🚴 **Course locale :** le jour même (même ville) — **500 à 1 500 FCFA**\n\n**Les grandes villes desservies :**\n- Cotonou, Porto-Novo, Abomey-Calavi (express disponible)\n- Parakou, Bohicon, Lokossa, Natitingou, Djougou\n- Toutes les 77 communes du Bénin 🇧🇯\n\n**Modes de réception :**\n- 🏠 **À domicile** : Le livreur vous apporte le colis\n- 📍 **Point relais** : Retrait dans un point près de chez vous\n- 🤝 **Chez le vendeur** : Convenez d'un rendez-vous\n\n💰 **Livraison offerte** chez certains vendeurs (indiqué sur l'annonce)\n\nSouhaitez-vous estimer les frais pour une adresse spécifique ?",
    priority: 7,
    context: ['delivery'],
  },
  {
    id: 'delivery_cost',
    topic: 'delivery',
    subtopic: 'tarifs',
    keywords: ['frais livraison', 'tarif livraison', 'combien livraison', 'coût livraison',
      'prix livraison', 'livraison gratuite', 'livraison offerte'],
    patterns: [/frais (de |d'|des )?livraison/i, /combien (coûte|ça coûte) la livraison/i,
      /livraison (gratuite|offerte|payante)/i, /tarif (de |des )?livraison/i],
    response:
      "**💰 Tarifs de livraison indicatifs :**\n\n| Type | Délai | Prix |\n|------|-------|------|\n| 🚴 Course locale (même ville) | Jour même | 500 - 1 500 FCFA |\n| 📦 Standard (département) | 2-3 jours | 1 000 - 2 000 FCFA |\n| 🚚 Standard (autre région) | 3-5 jours | 2 000 - 3 000 FCFA |\n| ⚡ Express (grandes villes) | 24-48h | 3 000 - 5 000 FCFA |\n\n**Facteurs influençant le prix :**\n- Distance entre le vendeur et votre localité\n- Poids et dimensions du colis\n- Type de livraison choisi\n\n**💡 Astuce :** Certains vendeurs offrent la livraison gratuite — cherchez le badge \"Livraison offerte\" sur les annonces !\n\nLe montant exact est calculé et affiché avant la confirmation de votre commande.",
    priority: 6,
    context: ['delivery', 'cost'],
  },

  // ===================================================================
  // TOPIC: PAIEMENT
  // ===================================================================
  {
    id: 'payment_methods',
    topic: 'payment',
    subtopic: 'moyens',
    keywords: ['paiement', 'payer', 'payment', 'mobile money', 'mtn', 'moov', 'orange money',
      'carte', 'carte bancaire', 'moyen de paiement', 'comment payer'],
    patterns: [/moyen(s)? de paiement/i, /comment (payer|régler|effectuer le paiement)/i,
      /(accepter|prendre) (quel|quels) (paiement|moyens)/i,
      /(mtn|moov|orange) (money|mobile)?/i],
    response:
      "**💳 Moyens de paiement acceptés sur BoutiKonect :**\n\n**📱 Mobile Money (Recommandé) :**\n- ✅ **MTN MoMo** (Mobile Money) — Le plus utilisé\n- ✅ **Moov Money**\n- ✅ **Orange Money**\n\n**💵 Paiement à la livraison :**\n- Payez en espèces ou par Mobile Money à la réception\n- Idéal pour vérifier le produit avant de payer\n\n**🏦 Autres options :**\n- Virement bancaire (selon le vendeur)\n- Paiement sur place (retrait chez le vendeur)\n\n**🔒 Sécurité :**\n- Transactions cryptées et sécurisées\n- Paiement à la livraison disponible\n- Pas de stockage de vos informations bancaires\n- Chaque transaction est tracée\n\n**Le Mobile Money est le moyen le plus utilisé** car il est rapide, sécurisé et accessible à tous les Béninois.",
    priority: 8,
    context: ['payment'],
  },
  {
    id: 'payment_security',
    topic: 'payment',
    subtopic: 'securite',
    keywords: ['sécurisé', 'sécurité', 'transaction sécurisée', 'arnaque', 'vol', 'fraude',
      'piratage', 'sûr', 'fiable', 'protection'],
    patterns: [/sécurit/i, /est-ce que (c'est|le paiement est) (sécurisé|sûr|fiable)/i,
      /risque (d'|d)(arnaque|escroquerie|fraude)/i,
      /(comment )?(protéger|sécuriser) (mon|le) (paiement|compte)/i],
    response:
      "**🔒 La sécurité sur BoutiKonect — Notre priorité !**\n\n**Comment vos transactions sont protégées :**\n\n🛡️ **Cryptage SSL** — Toutes les données échangées sont cryptées\n📋 **RLS (Row Level Security)** — Chaque utilisateur ne voit que ses propres données\n✅ **Paiement à la livraison** — Vous payez après avoir reçu et vérifié le produit\n📱 **Double confirmation** — Chaque transaction est confirmée par notification\n👁️ **Modération** — Toutes les annonces et avis sont modérés\n\n**🏆 Conseils pour éviter les arnaques :**\n- ✅ Privilégiez les vendeurs avec badge \"Vérifié\"\n- ✅ Utilisez le paiement à la livraison si vous avez un doute\n- ✅ Vérifiez les avis des autres acheteurs\n- ✅ Communiquez via WhatsApp intégré (pas de partage de coordonnées bancaires)\n- ❌ Ne jamais envoyer d'argent sans confirmation de commande\n- ❌ Ne pas partager vos codes PIN Mobile Money\n\n**Un problème ?** Contactez notre support immédiatement !",
    priority: 7,
    context: ['payment', 'security'],
  },
  {
    id: 'refund_policy',
    topic: 'payment',
    subtopic: 'remboursement',
    keywords: ['remboursement', 'rembourser', 'être remboursé', 'annulation paiement',
      'retour produit', 'produit défectueux', 'défectueux', 'rembourser commande'],
    patterns: [/rembours(e|ement)/i, /(être |se faire )?rembourser/i,
      /retour (produit|marchandise|colis)/i,
      /produit (défectueux|abimé|cassé|non conforme)/i],
    response:
      "**💰 Politique de remboursement — 7 jours satisfait ou remboursé :**\n\n**Conditions :**\n- Vous disposez de **7 jours** après réception pour demander un remboursement\n- Le produit doit être retourné dans son emballage d'origine\n- Le produit doit être en bon état (sauf défaut)\n\n**Procédure :**\n1️⃣ Contactez le vendeur depuis votre tableau de bord\n2️⃣ Expliquez le motif du retour\n3️⃣ Renvoyez le produit (frais de retour à votre charge sauf défaut)\n4️⃣ Le remboursement est traité sous **48 à 72h** après réception\n\n**Cas particuliers :**\n- 📱 **Produit défectueux ou non conforme** : Retour gratuit, remboursement intégral\n- ❌ **Annulation avant expédition** : Remboursement intégral sous 24-48h\n- ↪️ **Simple changement d'avis** : Remboursement après retour du produit (frais de retour : 2 000 FCFA)\n\n**Moyen de remboursement :**\n- Mobile Money : sous 24-48h\n- Virement bancaire : sous 3-5 jours\n\nContactez le vendeur pour initier la démarche !",
    priority: 6,
    context: ['payment', 'refund'],
  },

  // ===================================================================
  // TOPIC: COMPTE & PROFIL
  // ===================================================================
  {
    id: 'create_account',
    topic: 'account',
    subtopic: 'inscription',
    keywords: ['créer compte', 'inscription', 's\'inscrire', 'nouveau compte', 'inscrire',
      'enregistrer', 'sign up', 'ouvrir compte'],
    patterns: [/créer (un |mon )?compte/i, /(s'|comment s')inscrire/i,
      /(comment )?(créer|ouvrir|faire) (un |mon )?compte/i,
      /inscription (sur |à )?/i],
    response:
      "**📝 Créer un compte sur BoutiKonect :**\n\n**Méthode 1 — Email et mot de passe :**\n1️⃣ Cliquez sur \"S'inscrire\" en haut de la page\n2️⃣ Remplissez : nom, prénom, email, téléphone, mot de passe\n3️⃣ Choisissez votre ville et quartier\n4️⃣ Vous pouvez cocher \"Devenir vendeur\" si vous souhaitez vendre\n5️⃣ Cliquez sur \"Créer mon compte\" ✅\n\n**Méthode 2 — Google (rapide) :**\n1️⃣ Cliquez sur \"S'inscrire avec Google\"\n2️⃣ Autorisez l'accès à votre compte Google\n3️⃣ Complétez votre profil (téléphone, ville)\n4️⃣ C'est fait ! ✅\n\n**📋 Informations demandées :**\n- Nom et prénom\n- Adresse email (valide)\n- Numéro de téléphone\n- Ville et quartier\n- Mot de passe sécurisé\n\n**🔓 Optionnel :** Vous pouvez aussi commander sans compte !",
    priority: 7,
    context: ['account', 'registration'],
  },
  {
    id: 'login_help',
    topic: 'account',
    subtopic: 'connexion',
    keywords: ['connexion', 'connecter', 'se connecter', 'login', 'sign in', 'identifier',
      'accéder compte', 'mon compte'],
    patterns: [/se connecter/i, /(comment )?(je me )?connecter/i, /login/i,
      /(je n'arrive pas|impossible de) (me connecter|se connecter)/i],
    response:
      "**🔑 Se connecter à BoutiKonect :**\n\n**Par email :**\n1️⃣ Cliquez sur \"Connexion\"\n2️⃣ Entrez votre adresse email\n3️⃣ Entrez votre mot de passe\n4️⃣ Cliquez sur \"Se connecter\"\n\n**Par Google :**\n1️⃣ Cliquez sur \"Connexion avec Google\"\n2️⃣ Choisissez votre compte Google\n3️⃣ Vous êtes connecté !\n\n**Mot de passe oublié ?**\n- Cliquez sur \"Mot de passe oublié\" sur la page de connexion\n- Saisissez votre email\n- Vous recevrez un lien de réinitialisation\n- Créez un nouveau mot de passe (8 caractères min.)\n\n**Problèmes de connexion ?**\n- Vérifiez votre email et mot de passe\n- Essayez de réinitialiser votre mot de passe\n- Videz le cache de votre navigateur\n- Contactez le support si le problème persiste\n\n📱 Après connexion, vous accédez à votre tableau de bord, vos commandes et votre profil.",
    priority: 6,
    context: ['account', 'login'],
  },
  {
    id: 'profile_settings',
    topic: 'account',
    subtopic: 'profil',
    keywords: ['modifier profil', 'éditer profil', 'photo profil', 'changer photo', 'paramètres',
      'informations personnelles', 'mon profil', 'biographie', 'description boutique'],
    patterns: [/modifier (mon |le )?profil/i, /changer (ma |la )?photo/i,
      /(éditer|mettre à jour) (mon |les |mes )?(informations|profil|coordonnées)/i,
      /paramètres (du |de mon )?compte/i],
    response:
      "**👤 Gérer votre profil BoutiKonect :**\n\n**Accéder à votre profil :**\n1. Connectez-vous\n2. Cliquez sur votre avatar/nom en haut à droite\n3. Sélectionnez \"Mon profil\"\n\n**Ce que vous pouvez modifier :**\n- 📸 **Photo de profil** ou avatar\n- ✏️ Nom et prénom\n- 📞 Numéro de téléphone et WhatsApp\n- 📍 Ville, département, quartier\n- 🏪 **Nom de votre boutique** (si vendeur)\n- 📝 Biographie ou description\n\n**Pour les vendeurs :**\n- Ajoutez votre numéro WhatsApp pour que les acheteurs vous contactent facilement\n- Décrivez votre activité et vos horaires\n- Mettez un logo ou photo professionnelle\n\n**Sauvegarde :** N'oubliez pas de cliquer sur \"Enregistrer\" après vos modifications !",
    priority: 5,
    context: ['account', 'profile'],
  },
  {
    id: 'reset_password',
    topic: 'account',
    subtopic: 'mot_de_passe',
    keywords: ['mot de passe', 'mdp', 'changer mot de passe', 'réinitialiser', 'mot de passe oublié',
      'nouveau mot de passe', 'password', 'reset password'],
    patterns: [/mot de passe (oublié|perdu)/i, /réinitialiser (mon |le )?mot de passe/i,
      /changer (mon |de )?mot de passe/i, /(je n'ai plus|j'ai oublié) mon mot de passe/i],
    response:
      "**🔐 Mot de passe — Gestion :**\n\n**Mot de passe oublié ?**\n1. Allez sur la page de connexion\n2. Cliquez sur \"Mot de passe oublié\"\n3. Saisissez votre adresse email\n4. Vérifiez votre boîte mail (pensez aux spams)\n5. Cliquez sur le lien reçu\n6. Créez un nouveau mot de passe (8 caractères minimum)\n\n**Changer son mot de passe :**\n1. Connectez-vous\n2. Allez dans votre profil > \"Sécurité\" \n3. Saisissez l'ancien et le nouveau mot de passe\n4. Confirmez\n\n**💡 Conseils :**\n- Utilisez au moins 8 caractères (lettres + chiffres)\n- Évitez les mots de passe trop simples (123456, motdepasse)\n- Ne partagez jamais votre mot de passe\n- Utilisez des mots de passe différents pour chaque site",
    priority: 6,
    context: ['account', 'password'],
  },

  // ===================================================================
  // TOPIC: RECHERCHE & FILTRES
  // ===================================================================
  {
    id: 'search_features',
    topic: 'search',
    subtopic: 'recherche',
    keywords: ['recherche', 'chercher', 'trouver', 'rechercher produit', 'rechercher service',
      'barre recherche', 'filtre', 'recherche avancée'],
    patterns: [/comment (rechercher|trouver|chercher)/i,
      /(je cherche|je veux trouver|je recherche) (un |des )?(produit|service|article)/i,
      /recherche (avancée|par |de )/i],
    response:
      "**🔍 Rechercher sur BoutiKonect :**\n\n**Plusieurs façons de trouver ce que vous cherchez :**\n\n**1️⃣ Barre de recherche :**\n- Tapez un mot-clé (nom du produit, catégorie, marque)\n- Les résultats s'affichent en temps réel\n\n**2️⃣ Par catégorie :**\n- Parcourez depuis l'accueil\n- Choisissez une catégorie (Mode, Électronique, etc.)\n- Affinez par sous-catégorie\n\n**3️⃣ Par localisation :**\n- Utilisez le filtre \"À proximité\"\n- Entrez votre ville ou activez la géolocalisation\n- Résultats triés par distance\n\n**4️⃣ Filtres disponibles :**\n- 💰 **Prix min et max**\n- 📍 **Localisation** (ville, département)\n- 📏 **Distance** (5 km, 10 km, 25 km, 50 km)\n- 📂 **Catégorie**\n- ⭐ **Note minimale**\n\n**5️⃣ Tri :**\n- Par pertinence\n- Par prix (croissant/décroissant)\n- Par note\n- Par date (plus récents)\n\nUtilisez tous ces outils pour trouver exactement ce qu'il vous faut !",
    priority: 6,
    context: ['search', 'filters'],
  },
  {
    id: 'geolocation_search',
    topic: 'search',
    subtopic: 'geolocalisation',
    keywords: ['proximité', 'près de chez moi', 'géolocalisation', 'autour de moi', 'distance',
      'localisation', 'à côté', 'proche', 'rayon', 'km'],
    patterns: [/près de (chez moi|moi)/i, /autour de moi/i, /(à |de )?proximité/i,
      /géolocalis/i, /dans (un rayon|une zone) (de )?/i,
      /(dans |à |depuis )?(mon |ma )?(ville|localité|quartier|commune)/i],
    response:
      "**📍 Recherche par proximité sur BoutiKonect :**\n\nTrouvez des produits et services près de chez vous !\n\n**Comment utiliser la géolocalisation :**\n\n1️⃣ **Activez la géolocalisation** :\n   - Autorisez l'accès à votre position dans le navigateur\n   - Ou entrez manuellement votre ville\n\n2️⃣ **Filtrez par distance** :\n   - 5 km : votre quartier/village\n   - 10 km : votre ville/commune\n   - 25 km : les communes voisines\n   - 50 km : tout le département\n\n3️⃣ **Les résultats sont triés** du plus proche au plus éloigné\n\n**Avantages :**\n- 🚶‍➡️ Produits disponibles près de chez vous\n- 💰 Frais de livraison réduits\n- 🤝 Relation directe avec les vendeurs locaux\n- 🌍 Découverte des artisans de votre région\n- ⏱ Livraison plus rapide\n\n**Villes disponibles :** Cotonou, Porto-Novo, Abomey-Calavi, Parakou, et toutes les 77 communes du Bénin.",
    priority: 6,
    context: ['search', 'geolocation'],
  },

  // ===================================================================
  // TOPIC: AVIS & ÉVALUATIONS
  // ===================================================================
  {
    id: 'reviews_ratings',
    topic: 'reviews',
    subtopic: 'evaluations',
    keywords: ['avis', 'note', 'évaluation', 'étoile', 'commentaire', 'review', 'évaluations',
      'donner avis', 'laisser avis', 'notation'],
    patterns: [/avis (sur |des |de )?(produit|service|vendeur)/i,
      /comment (donner|laisser) (mon |un )?avis/i,
      /(note|étoile|star) (du |des )?(produit|service)/i,
      /évaluations? (des |du )?(produit|service|vendeur)/i],
    response:
      "**⭐ Avis et évaluations sur BoutiKonect :**\n\n**Donner un avis :**\n1️⃣ Ouvrez la page du produit/service que vous avez acheté\n2️⃣ Cliquez sur \"Donner mon avis\"\n3️⃣ Choisissez une note (1 à 5 étoiles) ⭐\n4️⃣ Ajoutez un commentaire (optionnel)\n5️⃣ Publiez !\n\n**Lire les avis :**\n- Les avis sont affichés sur chaque page produit/service\n- Vous voyez la note moyenne et la distribution\n- Les avis sont triés par date (plus récents d'abord)\n\n**Pourquoi laisser un avis ?**\n- 💡 Aidez les autres acheteurs à faire leur choix\n- 🏆 Encouragez les bons vendeurs\n- 📈 Les vendeurs avec de bonnes notes sont mieux classés\n- 🎯 Plus il y a d'avis, plus la note est fiable\n\n**Transparence :** Tous les avis sont authentiques et vérifiés.",
    priority: 5,
    context: ['reviews', 'ratings'],
  },

  // ===================================================================
  // TOPIC: PROMOTION & VISIBILITÉ
  // ===================================================================
  {
    id: 'promotion_ads',
    topic: 'promotion',
    subtopic: 'promouvoir',
    keywords: ['promouvoir', 'promu', 'promotion', 'badge promu', 'publicité', 'visibilité',
      'mettre en avant', 'boost', 'annonce sponsorisée', 'produit en vedette'],
    patterns: [/promouvoir (mon |mes |un |des )?(produit|service|annonce)/i,
      /(badge |produit |service )?promu/i,
      /mettre en avant/i,
      /(augmenter|améliorer) (la |ma )?visibilité/i],
    response:
      "**📢 Promotion sur BoutiKonect — Augmentez votre visibilité !**\n\n**Options disponibles :**\n\n1️⃣ **🌟 Produit en vedette** — 5 000 FCFA/semaine\n   - Apparaît en haut des résultats de recherche\n   - Badge \"Promu\" visible\n   - Idéal pour lancer un nouveau produit\n\n2️⃣ **📌 Annonce boostée** — 3 000 FCFA/semaine\n   - Mise en avant dans la catégorie concernée\n   - Visibilité augmentée de 200%\n\n3️⃣ **🎯 Bannière accueil** — 15 000 FCFA/semaine\n   - Affichée sur toute la page d'accueil\n   - Touché des milliers de visiteurs\n\n4️⃣ **✨ Pack Premium (tout inclus)** — 25 000 FCFA/mois\n   - Produit en vedette + annonce boostée\n   - Bannière accueil 1 semaine\n   - Statistiques avancées\n\n**🎁 Nouveaux vendeurs :** 7 jours de promotion gratuite pour votre première annonce !\n\n**Comment promouvoir :**\n- Allez dans votre tableau de bord vendeur\n- Sélectionnez \"Promouvoir\" sur l'annonce de votre choix\n- Choisissez l'option et la durée\n- Payez par Mobile Money\n- C'est en ligne ! 📈",
    priority: 5,
    context: ['promotion', 'visibility'],
  },

  // ===================================================================
  // TOPIC: CONTACT & SUPPORT
  // ===================================================================
  {
    id: 'contact_support',
    topic: 'support',
    subtopic: 'contact',
    keywords: ['contact', 'support', 'assistance', 'aide', 'service client', 'joindre',
      'contacter', 'problème', 'bug', 'erreur', 'sos', 'urgence'],
    patterns: [/contacter (le |le )?(support|service (client|après-vente)|équipe|admin)/i,
      /(comment )?(joindre|contacter|appeler) (boutikonect|l'équipe|le support)/i,
      /j'ai (un problème|besoin d'aide)/i,
      /(numéro |adresse )?(téléphone|email|whatsapp) (du |de )?(support|contact)/i],
    response:
      "**📞 Contacter le support BoutiKonect :**\n\n**📧 Email :** contact@boutikonect.bj\n_Réponse sous 24h ouvrées_\n\n**💬 WhatsApp :** +229 01 XX XX XX XX\n_Réponse immédiate aux horaires d'ouverture_\n\n**🌐 Formulaire de contact :**\nDisponible sur le site (rubrique \"Contact\")\n\n**⏰ Horaires :**\n- Lundi au vendredi : 8h00 - 18h00\n- Samedi : 9h00 - 13h00\n- Dimanche : Fermé\n\n**📱 Réseaux sociaux :**\n- Facebook : @BoutiKonect\n- Instagram : @boutikonect\n\n**Avant de nous contacter :**\n✅ Consultez la FAQ de l'assistant (peut-être que la réponse est déjà ici !)\n✅ Vérifiez votre tableau de bord pour le suivi de commande\n✅ Contactez d'abord le vendeur en cas de problème de commande\n\nNous sommes là pour vous aider ! 🎯",
    priority: 8,
    context: ['support', 'contact'],
  },
  {
    id: 'report_issue',
    topic: 'support',
    subtopic: 'signaler',
    keywords: ['signaler', 'signaler abus', 'signaler produit', 'contenu inapproprié',
      'faux produit', 'contrefaçon', 'comportement abusif', 'signalement'],
    patterns: [/signaler (un |ce |cet |cette )?(produit|service|vendeur|utilisateur|abus|contenu)/i,
      /(produit|service) (frauduleux|faux|arnaque|contrefaçon)/i,
      /(comportement|message) (inapproprié|abusif|offensant)/i],
    response:
      "**🚨 Signaler un contenu sur BoutiKonect :**\n\n**Comment signaler :**\n1️⃣ Ouvrez la page du produit, service ou profil concerné\n2️⃣ Cliquez sur le bouton \"Signaler\" (icône 🚩)\n3️⃣ Choisissez la raison :\n   - Spam ou publicité\n   - Produit contrefait ou frauduleux\n   - Contenu inapproprié ou offensant\n   - Fausse information\n   - Comportement abusif\n4️⃣ Ajoutez une description\n5️⃣ Soumettez ✅\n\n**Ce qui se passe après :**\n- Notre équipe examine le signalement sous 24-48h\n- Vous restez anonyme\n- Les mesures appropriées sont prises (avertissement, suspension, bannissement)\n- Vous recevez une confirmation du traitement\n\n**⚠️ Signalements abusifs :** Les signalements injustifiés peuvent entraîner des sanctions.",
    priority: 5,
    context: ['support', 'report'],
  },

  // ===================================================================
  // TOPIC: CODE & DÉVELOPPEMENT
  // ===================================================================
  {
    id: 'code_structure',
    topic: 'development',
    subtopic: 'architecture',
    keywords: ['architecture code', 'structure projet', 'organisation code', 'dossier',
      'src', 'composant', 'pages', 'code source', 'fichiers'],
    patterns: [/comment (est organisé|s'organise) le code/i,
      /structure (du |des |de )?(projet|code|fichiers)/i,
      /(organisation|architecture) (du |des |de )?(projet|code|fichiers)/i],
    response:
      "**📁 Structure du projet BoutiKonect :**\n\n```\nboutikonect/\n├── src/\n│   ├── components/     # Composants réutilisables\n│   │   ├── ReviewForm.jsx\n│   │   ├── StarRating.jsx\n│   │   ├── ProductCard.jsx\n│   │   ├── VirtualAssistant.jsx\n│   │   └── ... (30+ composants)\n│   ├── pages/          # Pages de l'application\n│   │   ├── Home.jsx       # Page d'accueil\n│   │   ├── Products.jsx   # Liste des produits\n│   │   ├── Services.jsx   # Liste des services\n│   │   ├── ProductDetail.jsx\n│   │   ├── ServiceDetail.jsx\n│   │   ├── Cart.jsx       # Panier\n│   │   ├── Checkout.jsx   # Paiement\n│   │   ├── Profile.jsx    # Profil utilisateur\n│   │   ├── Publish.jsx    # Publier une annonce\n│   │   └── ... (15+ pages)\n│   ├── context/        # Contextes React\n│   │   ├── AuthContext.jsx\n│   │   └── CartContext.jsx\n│   ├── lib/            # Logique métier\n│   │   ├── supabase.js     # Client Supabase\n│   │   ├── database.js     # Fonctions DB\n│   │   └── assistant/      # Moteur ML Assistant\n│   ├── data/           # Données statiques\n│   └── App.jsx         # Point d'entrée\n├── database/           # Migrations SQL\n├── public/             # Fichiers statiques\n└── package.json\n```\n\n**Technologies :** React 19 + Vite 8 + Tailwind CSS v4 + Supabase\n\nL'architecture suit le principe de séparation des concerns :\n- **Components** : UI pure\n- **Pages** : Assemblage de composants + logique métier\n- **Context** : État global\n- **Lib** : Accès aux données et services",
    priority: 2,
    context: ['development', 'code'],
  },
  {
    id: 'db_schema',
    topic: 'development',
    subtopic: 'base_de_donnees',
    keywords: ['base de données', 'schéma', 'tables', 'database', 'supabase', 'postgresql',
      'table produits', 'table services', 'table profils', 'reviews', 'orders', 'migration'],
    patterns: [/structure (de |de la )?(base|bd|database)/i,
      /(schéma|schema) (de |de la )?(base|bd|database|données)/i,
      /quelles (sont les |tables )/i, /tables (sql|postgres|supabase)/i],
    response:
      "**🗄️ Base de données BoutiKonect (PostgreSQL / Supabase) :**\n\n**Tables principales :**\n\n**👤 profiles** — Utilisateurs\n- id, full_name, email, phone, avatar_url\n- city, department, neighborhood\n- role (buyer/seller/admin), is_seller, seller_since\n- store_name, whatsapp, total_revenue\n- latitude, longitude\n\n**📦 products** — Produits\n- id, title, description, price, quantity\n- images (TEXT[]), cover_image\n- category, city, department\n- seller_id → profiles\n- status (active/inactive), is_promoted\n- rating, review_count, view_count\n- latitude, longitude\n\n**🔧 services** — Services\n- id, title, description, price\n- images (TEXT[]), cover_image\n- category, city, department\n- seller_id → profiles\n- status, is_promoted, rating, review_count\n\n**📋 orders** — Commandes\n- id, order_number (BK-XXXXX), item_type\n- product_id → products, service_id → services\n- buyer_id → profiles, seller_id → profiles\n- quantity, unit_price, total_amount\n- status (pending→confirmed→processing→shipped→delivered)\n- shipping_address, delivery_contact_name, delivery_contact_phone\n- notes\n\n**⭐ reviews** — Avis\n- id, rating (1-5), comment\n- product_id → products\n- service_id → services\n- reviewer_id → profiles\n- status (approved/pending), created_at\n\n**👁️ user_events** — Tracking comportement\n- Pour les recommandations personnalisées\n\n**🔒 Sécurité :** RLS (Row Level Security) sur toutes les tables",
    priority: 2,
    context: ['development', 'database'],
  },
  {
    id: 'api_functions',
    topic: 'development',
    subtopic: 'fonctions_db',
    keywords: ['fonctions database', 'rpc', 'api', 'database.js', 'getproducts', 'getservices',
      'createreview', 'createorder', 'fonctions', 'helpers'],
    patterns: [/comment (accéder|interroger|récupérer) (les |des )?(données|produits|services)/i,
      /(quelles |les )?fonctions (database|db|rpc)/i,
      /comment (fonctionne|est structuré) le (back-end|backend|serveur)/i],
    response:
      "**⚙️ API et fonctions Supabase :**\n\n**Fonctions principales dans `src/lib/database.js` :**\n\n**👤 Profils :**\n- `getProfile(id)` → Récupère un profil\n- `createProfile(data)` → Crée un profil\n\n**📦 Produits :**\n- `getProducts(filters)` → Liste filtrée\n- `getFullProductById(slug)` → Détail complet\n- `getPromotedProducts()` → Produits promus\n- `getRecommendedProducts(userId)` → Recommandations ML\n- `getTrendingProducts()` → Tendances\n\n**🔧 Services :**\n- `getServices(filters)` → Liste filtrée\n- `getServiceById(id)` → Détail complet\n\n**📋 Commandes :**\n- `createOrder(data)` → Nouvelle commande\n- `getOrderById(id)` → Détail commande\n- `getAllOrders()` → Toutes (admin)\n- `getSellerOrders(sellerId)` → Commandes reçues\n\n**⭐ Avis :**\n- `createReview(data)` → Publier un avis\n- `getProductReviews(productId)` → Avis d'un produit\n- `getServiceReviews(serviceId)` → Avis d'un service\n\n**📊 Autres :**\n- `searchProducts(query)` / `searchServices(query)` → Recherche\n- `getSellerStats(sellerId)` → Statistiques vendeur\n- `formatPrice(amount)` → Format FCFA\n- `validateBeninPhone(phone)` → Validation téléphone\n\n**Comportement important :**\n- Certaines fonctions **throw** une erreur (try/catch requis)\n- D'autres retournent `{data, error}` (vérifier .error)\n- Voir la documentation dans le code pour chaque fonction",
    priority: 2,
    context: ['development', 'api'],
  },

  // ===================================================================
  // TOPIC: GÉOLOCALISATION
  // ===================================================================
  {
    id: 'cities_benin',
    topic: 'geolocation',
    subtopic: 'villes',
    keywords: ['villes', 'communes', 'bénin', 'département', 'localisation', 'région',
      'cotonou', 'porto-novo', 'parakou', 'abomey', 'calavi', 'bohicon'],
    patterns: [/villes? (disponibles|couvertes|desservies)/i,
      /(dans |à )?(quelle |ma )?(ville|commune|département)/i,
      /(liste|quelles sont) (des |les )?(villes|communes|départements)/i],
    response:
      "**🇧🇯 Les 12 départements du Bénin couverts par BoutiKonect :**\n\n| Département | Chef-lieu | Nb communes |\n|-------------|-----------|-------------|\n| **Alibori** | Kandi | 6 |\n| **Atacora** | Natitingou | 9 |\n| **Atlantique** | Allada | 8 |\n| **Borgou** | Parakou | 8 |\n| **Collines** | Dassa-Zoumé | 6 |\n| **Couffo** | Aplahoué | 5 |\n| **Donga** | Djougou | 4 |\n| **Littoral** | Cotonou | 1 |\n| **Mono** | Lokossa | 6 |\n| **Ouémé** | Porto-Novo | 9 |\n| **Plateau** | Pobè | 5 |\n| **Zou** | Abomey | 9 |\n\n**Total : 77 communes** 🎯\n\n**Les plus actives :** Cotonou, Porto-Novo, Abomey-Calavi, Parakou, Bohicon, Lokossa, Natitingou, Djougou, Ouidah, Grand-Popo.\n\nQue vous soyez dans une grande ville ou un village reculé, BoutiKonect vous permet d'acheter et de vendre près de chez vous !",
    priority: 3,
    context: ['geolocation', 'cities'],
  },
  {
    id: 'nearby_products',
    topic: 'geolocation',
    subtopic: 'proximite',
    keywords: ['produits près', 'services près', 'autour', 'quartier', 'voisinage',
      'commerçant local', 'artisan local', 'achat local'],
    patterns: [/pr(è|e)s de (chez )?moi/i, /dans (mon |le )?quartier/i,
      /(produit|service|vendeur) (local|du coin|du quartier|pr(è|e)s)/i,
      /(commerce|achat) (local|de proximité)/i],
    response:
      "**📍 Achat local sur BoutiKonect :**\n\n**Pourquoi acheter près de chez vous ?**\n\n✅ **Livraison rapide** — Le jour même dans votre quartier\n✅ **Économies** — Frais de livraison réduits ou gratuits\n✅ **Qualité** — Vous pouvez voir le produit avant d'acheter\n✅ **Proximité** — Relation directe avec le vendeur\n✅ **Communauté** — Vous soutenez l'économie locale\n\n**Comment trouver des produits près de chez vous :**\n\n1️⃣ Ouvrez la page d'accueil ou la recherche\n2️⃣ Activez la **géolocalisation** dans votre navigateur\n3️⃣ Utilisez le filtre \"À proximité\"\n4️⃣ Choisissez un rayon (5 km, 10 km, 25 km)\n5️⃣ Découvrez les vendeurs et artisans de votre quartier !\n\n**💡 Astuce :** Suivez les vendeurs locaux pour être notifié de leurs nouvelles annonces !",
    priority: 4,
    context: ['geolocation', 'local'],
  },

  // ===================================================================
  // TOPIC: FACTURES & REÇUS
  // ===================================================================
  {
    id: 'invoice_receipt',
    topic: 'documents',
    subtopic: 'facture',
    keywords: ['facture', 'reçu', 'reçu de paiement', 'justificatif', 'preuve achat',
      'PDF', 'télécharger facture', 'imprimer reçu', 'document'],
    patterns: [/facture/i, /re(u|çu) (de |d')(achat|paiement)/i,
      /(télécharger|obtenir|imprimer) (ma |la )?facture/i,
      /(justificatif|preuve) (de |d')(achat|paiement|commande)/i],
    response:
      "**📄 Factures et reçus sur BoutiKonect :**\n\nVous pouvez obtenir un reçu PDF pour chaque commande.\n\n**Pour les acheteurs :**\n1️⃣ Connectez-vous à votre compte\n2️⃣ Allez dans \"Mes commandes\"\n3️⃣ Cliquez sur la commande concernée\n4️⃣ Cliquez sur \"Télécharger la facture\" ou \"Voir le reçu\"\n5️⃣ Le PDF se télécharge automatiquement\n\n**Pour les vendeurs (générer un reçu pour un client) :**\n1️⃣ Tableau de bord > \"Commandes reçues\"\n2️⃣ Sélectionnez une commande\n3️⃣ Cliquez sur \"Générer le reçu\"\n4️⃣ Un reçu professionnel est créé avec :\n   - Logo de votre boutique\n   - Nom du client et coordonnées\n   - Détail des articles\n   - Montant total\n   - Numéro de commande\n   - Date\n\n**📋 Le reçu inclut :**\n- Numéro de commande (BK-XXXXX)\n- Nom de l'acheteur et du vendeur\n- Produits/services commandés\n- Quantités et prix unitaires\n- Montant total\n- Statut du paiement\n- Date de la commande\n\nLe format est optimisé pour l'impression (A4).",
    priority: 4,
    context: ['documents', 'invoice'],
  },

  // ===================================================================
  // TOPIC: RECOMMANDATIONS
  // ===================================================================
  {
    id: 'recommendations',
    topic: 'features',
    subtopic: 'recommandations',
    keywords: ['recommandation', 'suggestion', 'personnalisé', 'suggéré', 'pour vous',
      'recommended', 'suggestions produits', 'recommander'],
    patterns: [/recommandation/i, /suggestion/i, /(produit|article) recommand/i,
      /(comment )?(sont )?faites (les )?recommandations/i,
      /pourquoi (ces |ce )?(produit|suggestion)/i],
    response:
      "**🎯 Recommandations personnalisées :**\n\nBoutiKonect utilise un système intelligent pour vous recommander des produits qui pourraient vous intéresser.\n\n**Comment ça marche :**\n- 📊 Basé sur votre historique de navigation et d'achats\n- 🏷️ Analyse des catégories que vous consultez le plus\n- 📍 Tient compte de votre localisation\n- ⭐ Priorise les produits les mieux notés\n\n**Où voir les recommandations :**\n- 🏠 Sur la page d'accueil (section \"Recommandé pour vous\")\n- 🔍 Dans les résultats de recherche (tri par pertinence)\n- 📄 Sur les pages produits (suggestions similaires)\n\n**Les tendances (pour les nouveaux visiteurs) :**\n- Si vous n'êtes pas connecté, vous voyez les produits tendances\n- Basé sur les notes, les vues et la popularité\n- Mise à jour en temps réel\n\n**💡 Conseil :** Connectez-vous et naviguez dans différentes catégories pour affiner vos recommandations !",
    priority: 4,
    context: ['features', 'recommendations'],
  },

  // ===================================================================
  // TOPIC: ASSISTANT ML
  // ===================================================================
  {
    id: 'assistant_info',
    topic: 'assistant',
    subtopic: 'presentation',
    keywords: ['assistant', 'chatbot', 'ia', 'intelligence artificielle', 'ml', 'machine learning',
      'robot', 'virtuel', 'vous êtes qui', 'qui êtes-vous', 'c\'est toi', 'ton nom'],
    patterns: [/qui (est-ce que tu )?(es|est(-ce)? (que )?tu)/i,
      /(tu es |c'est )?(un |une )?(ia|robot|assistant|bot|algorithme)/i,
      /comment (tu |vous )?(fonctionne|t'appelles|marche)/i,
      /(c'est |c'était )?(toi|vous) qui/i],
    response:
      "**🧠 Bonjour ! Je suis l'assistant intelligent de BoutiKonect !**\n\nJe suis un assistant **ML (Machine Learning)** conçu spécialement pour vous aider sur la plateforme.\n\n**Ce que je peux faire :**\n\n✅ **Vous guider** — Achat, vente, livraison, pas à pas\n✅ **Répondre à vos questions** — Sur les fonctionnalités, les produits, les services\n✅ **Chercher des produits** — Je peux interroger la base de données en temps réel\n✅ **Vous assister** — Problèmes de compte, commandes, profil\n✅ **Vous conseiller** — Astuces pour mieux vendre ou acheter\n\n**Comment je fonctionne :**\n- J'utilise des techniques de **machine learning** (embeddings vectoriels, classification d'intention, similarité sémantique) pour comprendre vos questions\n- Je suis connecté à la **base de données** pour vous donner des réponses à jour\n- J'apprends de mes conversations pour m'améliorer\n\n**Domaines de connaissance :**\n📦 Produits & Services | 🛒 Achats & Commandes\n💼 Vente & Marketing | 🚚 Livraison & Logistique\n💳 Paiements & Sécurité | 🔧 Support & Dépannage\n📁 Code & Architecture | 📊 Base de données\n\n**Comment puis-je vous aider aujourd'hui ?** 😊",
    priority: 9,
    context: ['assistant'],
  },
  {
    id: 'assistant_limitations',
    topic: 'assistant',
    subtopic: 'limites',
    keywords: ['limite', 'limitations', 'tu ne peux pas', 'tu sais pas', 'incapable',
      'tu comprends pas', 'pas capable', 'tu échoues'],
    patterns: [/qu'est-ce que tu (ne peux|ne sais |n'arrive) pas/i,
      /(quelles sont |c'est quoi )?tes (limites|limitations)/i,
      /tu ne (peux|connais|comprends) pas/i],
    response:
      "**📋 Ce que je peux et ne peux pas faire :**\n\n**✅ Je peux faire :**\n- Répondre à toutes vos questions sur BoutiKonect\n- Vous guider dans l'utilisation de la plateforme\n- Chercher des informations sur les produits et services\n- Expliquer le code et l'architecture du site\n- Vous aider avec votre compte et vos commandes\n- Vous donner des conseils pour vendre ou acheter\n\n**❌ Je ne peux pas faire :**\n- Passer des commandes à votre place (vous devez le faire depuis l'interface)\n- Voir vos mots de passe (ils sont cryptés)\n- Modifier les informations des autres utilisateurs\n- Effectuer des transactions financières\n- Supprimer des comptes\n- Accéder à des données privées d'autres utilisateurs\n\n**ℹ️ Note importante :**\nJe suis un assistant basé sur l'analyse de patterns et la recherche sémantique. Pour les actions nécessitant des modifications de compte ou des transactions, vous devez utiliser l'interface directement.\n\nDes questions précises sur un sujet ? Je suis tout ouïe ! 👂",
    priority: 7,
    context: ['assistant'],
  },

  // ===================================================================
  // TOPIC: COMPORTEMENT UTILISATEUR & STATISTIQUES
  // ===================================================================
  {
    id: 'user_stats',
    topic: 'account',
    subtopic: 'statistiques',
    keywords: ['mes statistiques', 'mon activité', 'mes achats', 'historique', 'commandes passées',
      'dépenses', 'combien dépensé', 'mes favoris'],
    patterns: [/mes (statistiques|achats|commandes|dépenses|favoris)/i,
      /(mon |mon )?(historique|activité) (d'|de )?(achat|commande)/i,
      /combien (ai-je |j'ai )?(dépensé|acheté|commandé)/i],
    response:
      "**📊 Vos informations sur BoutiKonect :**\n\n**Pour voir votre activité :**\n\n1️⃣ **Mes commandes :**\n   - Connectez-vous > \"Mes commandes\"\n   - Historique complet de vos achats\n   - Statut de chaque commande en temps réel\n\n2️⃣ **Mes favoris :**\n   - Produits et services que vous avez aimés\n   - Accès rapide à vos articles préférés\n\n3️⃣ **Mon profil :**\n   - Informations personnelles\n   - Paramètres du compte\n\n4️⃣ **Pour les vendeurs :**\n   - Tableau de bord avec statistiques complètes\n   - Revenus, commandes reçues, produits vus\n   - Évaluations moyennes\n\n**🔒 Confidentialité :**\n- Vos données sont protégées par RLS (Row Level Security)\n- Seules vos informations publiques sont visibles par les autres\n- Vous contrôlez ce qui est affiché sur votre profil\n\nConnectez-vous pour accéder à toutes vos informations !",
    priority: 3,
    context: ['account', 'stats'],
  },

  // ===================================================================
  // TOPIC: MESSAGERIE & COMMUNICATION
  // ===================================================================
  {
    id: 'messaging',
    topic: 'communication',
    subtopic: 'messages',
    keywords: ['message', 'messagerie', 'envoyer message', 'chat', 'discussion', 'conversation',
      'boîte réception', 'messages reçus', 'communiquer'],
    patterns: [/message(s)? (à |pour |au )?(le |un )?(vendeur|acheteur|prestataire)/i,
      /envoyer (un |le )?message/i,
      /(ma |la )?messagerie/i,
      /contacter (le |un )?(vendeur|acheteur) (par |sur )?(message|chat|site)/i],
    response:
      "**💬 Messagerie sur BoutiKonect :**\n\n**Deux façons de communiquer :**\n\n**1️⃣ WhatsApp Intégré (recommandé) :**\n- Chaque page produit/service a un bouton \"Contacter via WhatsApp\"\n- Un message pré-rempli avec le nom du produit s'ouvre\n- Réponse rapide et directe\n- Disponible 7j/7\n\n**2️⃣ Messagerie intégrée :**\n- Depuis votre tableau de bord, section \"Messages\"\n- Permet de suivre l'historique des échanges\n- Notifications en temps réel\n- Idéal pour les questions avant achat\n\n**Pour les vendeurs :**\n- Activez votre numéro WhatsApp dans votre profil\n- Répondez rapidement pour augmenter vos ventes\n- Les acheteurs apprécient la réactivité (+40% de conversion)\n\n**Conseils de communication :**\n- 🤝 Soyez poli et professionnel\n- ⏱ Répondez dans les 24h maximum\n- ❓ Posez des questions précises sur le produit\n- 📸 Demandez des photos supplémentaires si nécessaire",
    priority: 5,
    context: ['communication', 'messages'],
  },

  // ===================================================================
  // TOPIC: FALLBACK / AIDE GÉNÉRALE
  // ===================================================================
  {
    id: 'help_general',
    topic: 'help',
    subtopic: 'aide',
    keywords: ['aide', 'help', 'que faire', 'commencer', 'débuter', 'première fois',
      'tutoriel', 'guide', 'pas à pas', 'par où commencer'],
    patterns: [/par où (commencer|démarrer)/i, /(je suis |c'est ma )?première fois/i,
      /guide (d'|d)?(utilisation|démarrage|débutant)/i,
      /(aidez|aide)-moi/i, /j'ai besoin d'aide/i],
    response:
      "**👋 Bienvenue sur BoutiKonect ! Voici par où commencer :**\n\n**🛒 Si vous voulez ACHETER :**\n1️⃣ Parcourez les catégories sur la page d'accueil\n2️⃣ Utilisez la barre de recherche pour trouver un produit\n3️⃣ Cliquez sur un article pour voir les détails\n4️⃣ Ajoutez au panier puis commandez\n5️⃣ **Pas besoin de compte pour commander !**\n\n**💼 Si vous voulez VENDRE :**\n1️⃣ Créez un compte\n2️⃣ Activez le mode vendeur\n3️⃣ Publiez vos produits/services\n4️⃣ Commencez à vendre !\n\n**Que voulez-vous faire ?** Dites-moi et je vous guide pas à pas !\n\n**Ou posez-moi une question sur :**\n- 📦 Un produit ou service spécifique\n- 🚚 La livraison\n- 💳 Les paiements\n- 🔧 Une fonctionnalité du site\n- 👤 Votre compte\n\nJe suis là pour vous ! 🎯",
    priority: 1,
    context: ['help', 'general'],
  },
];

// ===================================================================
// INDEX PAR TOPIC POUR NAVIGATION RAPIDE
// ===================================================================

/** Topics disponibles avec leurs labels */
export const topicLabels = {
  general: 'Général',
  buying: 'Achats & Commandes',
  selling: 'Vente & Vendeurs',
  services: 'Services',
  delivery: 'Livraison',
  payment: 'Paiement',
  account: 'Compte & Profil',
  search: 'Recherche & Filtres',
  reviews: 'Avis & Évaluations',
  promotion: 'Promotion & Visibilité',
  support: 'Contact & Support',
  development: 'Code & Développement',
  geolocation: 'Géolocalisation',
  documents: 'Factures & Reçus',
  features: 'Fonctionnalités',
  assistant: 'Assistant ML',
  communication: 'Messagerie',
  help: 'Aide',
};

// ===================================================================
// SUGGESTED QUESTIONS — Questions rapides pour démarrer
// ===================================================================

export const suggestedQuestions = [
  'Comment acheter un produit ?',
  'Comment devenir vendeur ?',
  'Quels sont les moyens de paiement ?',
  'Puis-je commander sans compte ?',
  'Délais de livraison',
  'Contacter le support',
  'Comment publier une annonce ?',
  'C\'est quoi les produits promus ?',
];

// ===================================================================
// CONTEXT MAP — Pour les follow-ups contextuels
// ===================================================================

/** Mapping des follow-ups possibles par contexte */
export const contextFollowUps = {
  buying: ['Voir les catégories', 'Comment suivre ma commande', 'Puis-je annuler ?'],
  selling: ['Commission vendeur', 'Publier une annonce', 'Tableau de bord'],
  delivery: ['Frais de livraison', 'Délais', 'Zones couvertes'],
  payment: ['Moyens de paiement', 'Sécurité', 'Remboursement'],
  account: ['Créer un compte', 'Mot de passe oublié', 'Modifier mon profil'],
  general: ['Fonctionnalités', 'Catégories', 'Contact'],
};

export default knowledgeBase;
