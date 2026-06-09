// ============================================================
// BoutiKonect Chatbot Knowledge Base
// ============================================================

import Fuse from 'fuse.js';

/**
 * Each entry has:
 *   - topic:     The broad topic category
 *   - keywords:  Array of trigger words/phrases
 *   - response:  The chatbot reply text
 */

const chatbotData = [
  // -------------------------------------------------------------------
  // TOPIC: GREETINGS
  // -------------------------------------------------------------------
  {
    topic: 'greetings',
    keywords: ['bonjour', 'salut', 'hello', 'bonsoir', 'bonne nuit', 'coucou', 'cc', 'hey', 'hi', 'bon matin'],
    response:
      "Bonjour et bienvenue sur BoutiKonect ! Je suis votre assistant virtuel. Je suis là pour vous aider avec vos achats, vos ventes, la livraison, les paiements et bien plus encore. Comment puis-je vous aider aujourd'hui ?",
  },
  {
    topic: 'contactSeller',
    keywords: ['contacter vendeur', 'contacter le vendeur', 'joindre vendeur', 'parler au vendeur', 'whatsapp vendeur', 'contacter prestataire', 'joindre prestataire', 'message vendeur', 'envoyer message vendeur'],
    response:
      "Vous pouvez contacter un vendeur directement depuis sa page produit ou service ! Voici comment :\n\n**Via WhatsApp :**\n- Ouvrez la page du produit ou du service qui vous interesse\n- Dans la carte du vendeur, cliquez sur le bouton vert **'Contacter via WhatsApp'**\n- Un message pre-rempli s'ouvrira dans WhatsApp avec le nom du produit\n\n**Autres moyens de contact :**\n- Vous pouvez aussi appeler le vendeur directement si son numero est affiche\n- Utilisez la messagerie integree depuis votre tableau de bord (section Messages)\n\n**Pour les vendeurs :**\n- Rendez-vous dans votre profil et renseignez votre numero WhatsApp dans le champ dedie\n- Un bouton WhatsApp apparaitra automatiquement sur toutes vos annonces !",
  },
  {
    topic: 'greetings',
    keywords: ['merci', 'merci beaucoup', 'thanks', 'thank you', 'merci bien'],
    response:
      "De rien ! C'est un plaisir de vous aider. N'hésitez pas à revenir vers moi si vous avez d'autres questions. Bonne journée sur BoutiKonect !",
  },
  {
    topic: 'greetings',
    keywords: ['au revoir', 'bye', 'ciao', 'a bientot', 'a plus tard', 'bonne journée', 'bonne soirée', 'adieu', 'à bientôt', 'à plus'],
    response:
      "Au revoir ! Merci d'avoir visité BoutiKonect. Passez une excellente journée. N'oubliez pas que je suis toujours là si vous avez besoin d'aide. À bientôt !",
  },
  {
    topic: 'greetings',
    keywords: ['comment ça va', 'comment allez-vous', 'ça va', 'comment tu vas'],
    response:
      "Je vais très bien, merci ! Et vous, comment allez-vous ? Je suis là pour vous assister avec tout ce qui concerne BoutiKonect. N'hésitez pas à me poser vos questions.",
  },

  // -------------------------------------------------------------------
  // TOPIC: DELIVERY
  // -------------------------------------------------------------------
  {
    topic: 'delivery',
    keywords: ['livraison', 'livrer', 'transport', 'livre', 'livreur', 'colis', 'expédition', 'envoi', 'livré'],
    response:
      "La livraison est disponible dans les 77 communes du Bénin ! Voici les détails :\n\n- Livraison standard : 2 à 5 jours ouvrés dans tout le pays\n- Livraison express : 24 à 48 heures (disponible dans les grandes villes : Cotonou, Porto-Novo, Parakou, Abomey-Calavi, etc.)\n- Les frais de livraison sont calculés en fonction de la distance et du poids du colis\n- Le suivi de votre commande est disponible depuis votre tableau de bord client\n- Vous pouvez choisir un point de retrait près de chez vous\n\nSouhaitez-vous estimer les frais de livraison pour une commande ?",
  },
  {
    topic: 'delivery',
    keywords: ['frais de livraison', 'tarif livraison', 'combien livraison', 'coût livraison', 'prix livraison'],
    response:
      "Les frais de livraison sur BoutiKonect dépendent de plusieurs facteurs :\n\n- La distance entre le vendeur et votre localité\n- Le poids et les dimensions du colis\n- Le type de livraison (standard ou express)\n\nEn général, les frais varient entre 500 FCFA et 5 000 FCFA pour une livraison standard. Certains vendeurs offrent la livraison gratuite ! Vous pouvez voir le montant exact avant de finaliser votre commande.",
  },
  {
    topic: 'delivery',
    keywords: ['délai de livraison', 'temps livraison', 'combien de temps livraison', 'livraison rapide', 'urgence livraison'],
    response:
      "Les délais de livraison sur BoutiKonect sont généralement :\n\n- Livraison standard : 2 à 5 jours ouvrés selon votre localisation\n- Livraison express : 24 à 48 heures dans les grandes villes\n- Pour les produits numériques : livraison instantanée après paiement\n\nLes délais exacts sont indiqués sur la page de chaque produit et confirmés lors de la commande.",
  },
  {
    topic: 'delivery',
    keywords: ['point de retrait', 'retrait', 'récupérer', 'relais', 'point relais'],
    response:
      "Vous avez plusieurs options pour récupérer vos achats :\n\n- Livraison à domicile : le livreur vous apporte le colis directement chez vous\n- Point de retrait : retirez votre colis dans un point relais proche de chez vous\n- Retrait chez le vendeur : vous pouvez convenir d'un rendez-vous directement avec le vendeur\n\nDiscutez avec le vendeur pour choisir l'option la plus pratique pour vous.",
  },

  // -------------------------------------------------------------------
  // TOPIC: PAYMENT
  // -------------------------------------------------------------------
  {
    topic: 'payment',
    keywords: ['paiement', 'payer', 'payment', 'mobile money', 'mtn', 'moov', 'orange money', 'carte', 'carte bancaire'],
    response:
      "Nous acceptons plusieurs moyens de paiement au Bénin pour votre commodité :\n\n1. Mobile Money :\n   - MTN MoMo (Mobile Money)\n   - Moov Money\n   - Orange Money\n\n2. Paiement à la livraison : vous payez en espèces ou par Mobile Money à la réception de votre colis\n\n3. Virement bancaire\n\nLe paiement Mobile Money et le paiement à la livraison sont les options les plus utilisées sur notre plateforme. Toutes les transactions sont sécurisées.",
  },
  {
    topic: 'payment',
    keywords: ['sécurité paiement', 'paiement sécurisé', 'est-ce que le paiement est sécurisé', 'transaction sécurisée', 'vol', 'arnaque'],
    response:
      "La sécurité de vos transactions est notre priorité absolue ! Voici comment nous protégeons vos paiements :\n\n- Toutes les transactions sont cryptées et sécurisées\n- Le paiement à la livraison vous permet de vérifier le produit avant de payer\n- Nous ne stockons pas vos informations bancaires\n- Chaque transaction est tracée et confirmée par notification\n\nSi vous avez un problème avec une transaction, contactez notre support client immédiatement.",
  },
  {
    topic: 'payment',
    keywords: ['remboursement', 'rembourser', 'être remboursé', 'annulation paiement', 'avoir', 'crédit'],
    response:
      "Notre politique de remboursement :\n\n- Vous disposez de 7 jours après réception pour demander un remboursement\n- Le produit doit être retourné dans son emballage d'origine et en bon état\n- Les frais de retour sont à la charge de l'acheteur, sauf si le produit est défectueux ou non conforme\n- Le remboursement est effectué sous 48 à 72 heures après réception et vérification du retour\n- Le remboursement se fait sur le même moyen de paiement que celui utilisé pour l'achat\n\nContactez le vendeur directement depuis votre tableau de bord pour initier une demande de remboursement.",
  },
  {
    topic: 'payment',
    keywords: ['facture', 'reçu', 'reçu de paiement', 'preuve de paiement', 'justificatif'],
    response:
      "Vous pouvez télécharger votre facture ou reçu de paiement depuis votre tableau de bord client. Rendez-vous dans la section 'Mes commandes', cliquez sur la commande concernée, puis sur 'Télécharger la facture'. Vous recevrez également un email de confirmation après chaque transaction.",
  },

  // -------------------------------------------------------------------
  // TOPIC: SELL
  // -------------------------------------------------------------------
  {
    topic: 'sell',
    keywords: ['vendre', 'vendeur', 'devenir vendeur', 'inscrire vendeur', 's\'inscrire vendeur', 'ajouter produit', 'mettre en vente', 'publier annonce', 'boutique'],
    response:
      "Pour devenir vendeur sur BoutiKonect, c'est simple et rapide !\n\n1. Créez un compte ou connectez-vous sur notre plateforme\n2. Cliquez sur 'Devenir vendeur' depuis votre tableau de bord\n3. Complétez votre profil vendeur avec vos informations et votre photo\n4. Créez votre boutique en ligne en ajoutant une description et un logo\n5. Ajoutez vos produits ou services avec des photos et descriptions détaillées\n6. Fixez vos prix et vos options de livraison\n7. Publiez vos annonces et commencez à vendre !\n\nL'inscription est gratuite et vous pouvez commencer à vendre dès aujourd'hui. Vous voulez qu'on vous guide étape par étape ?",
  },
  {
    topic: 'sell',
    keywords: ['commission', 'frais vente', 'tarif vendeur', 'combien ça coûte de vendre', 'commission vendeur', 'prix vente'],
    response:
      "Voici les informations sur les frais pour les vendeurs sur BoutiKonect :\n\n- L'inscription et la création de votre boutique sont totalement gratuites\n- La publication d'annonces est gratuite (vous pouvez publier jusqu'à 50 produits gratuitement)\n- Une commission de 5% est prélevée sur chaque vente conclue sur la plateforme\n- Les options de mise en avant (promotion) sont payantes mais facultatives\n\nC'est l'une des commissions les plus attractives du marché ! Vous gardez 95% du montant de chaque vente.",
  },
  {
    topic: 'sell',
    keywords: ['promotion produit', 'mettre en avant', 'boost', 'promouvoir', 'publicité', 'annonce sponsorisée', 'produit promu', 'produit en vedette'],
    response:
      "BoutiKonect propose plusieurs options pour promouvoir vos produits et services et augmenter votre visibilité :\n\n1. **Produit en vedette** - Votre produit apparaît en haut des résultats de recherche (5 000 FCFA/semaine)\n2. **Annonce boostée** - Votre annonce est mise en avant dans les catégories concernées (3 000 FCFA/semaine)\n3. **Bannière publicitaire** - Votre bannière s'affiche sur la page d'accueil (15 000 FCFA/semaine)\n4. **Mise en avant homepage** - Votre produit apparaît dans la section 'À la une' de la page d'accueil (10 000 FCFA/semaine)\n\nLes produits promus sont identifiés par un badge 'Promu' et reçoivent en moyenne 3 fois plus de vues.",
  },
  {
    topic: 'sell',
    keywords: ['conseils vente', 'astuces vendeur', 'bien vendre', 'réussir ses ventes', 'optimiser annonce'],
    response:
      "Voici quelques conseils pour bien vendre sur BoutiKonect :\n\n1. **Photos de qualité** : Prenez des photos claires et nettes de vos produits sous différents angles\n2. **Description détaillée** : Décrivez précisément votre produit (dimensions, couleur, matériau, état)\n3. **Prix compétitif** : Consultez les prix des produits similaires sur la plateforme\n4. **Réactivité** : Répondez rapidement aux messages des acheteurs potentiels\n5. **Livraison** : Proposez plusieurs options de livraison\n6. **Promotion** : Utilisez nos options de mise en avant pour plus de visibilité\n7. **Évaluations** : Encouragez vos clients à laisser des avis positifs\n\nAppliquez ces conseils et vos ventes décolleront !",
  },

  // -------------------------------------------------------------------
  // TOPIC: CATEGORIES
  // -------------------------------------------------------------------
  {
    topic: 'categories',
    keywords: ['catégorie', 'categories', 'rayon', 'rubrique', 'type de produit', 'type de service'],
    response:
      "BoutiKonect propose une large gamme de catégories pour vous permettre de trouver ou vendre tout ce dont vous avez besoin :\n\n**Produits :**\n- Vêtements et accessoires de mode\n- Électronique (téléphones, ordinateurs, tablettes)\n- Maison et décoration\n- Beauté et bien-être\n- Alimentation et produits locaux\n- Sports et loisirs\n- Jouets et jeux pour enfants\n- Livres et fournitures scolaires\n- Artisanat et produits faits main\n- Automobile et motos\n- Autres produits\n\n**Services :**\n- Cours et tutorat (éducation)\n- Réparation et entretien à domicile\n- Coiffure et soins esthétiques\n- Support informatique et numérique\n- Photographie et vidéo\n- Services de livraison\n- Consultation et conseil\n- Nettoyage et ménage\n- Organisation d'événements\n- Autres services\n\nExplorez chaque catégorie depuis la page d'accueil ou utilisez la barre de recherche !",
  },
  {
    topic: 'categories',
    keywords: ['vêtements', 'mode', 'habits', 'vêtement', 'chaussures', 'sacs', 'accessoires'],
    response:
      "Dans la catégorie Mode et Vêtements, vous trouverez :\n\n- Vêtements hommes, femmes et enfants\n- Chaussures et sandales\n- Sacs et maroquinerie\n- Bijoux et accessoires\n- Tissus et pagne traditionnel\n- Tenues africaines et modernes\n\nDes vendeurs de tout le Bénin proposent leurs articles. Utilisez les filtres par taille, couleur ou prix pour trouver exactement ce que vous cherchez.",
  },
  {
    topic: 'categories',
    keywords: ['électronique', 'téléphone', 'ordinateur', 'smartphone', 'tablette', 'gadget', 'accessoire téléphone'],
    response:
      "Dans la catégorie Électronique, vous trouverez :\n\n- Téléphones portables (neufs et d'occasion)\n- Ordinateurs portables et de bureau\n- Tablettes et liseuses\n- Écouteurs et casques audio\n- Chargeurs et câbles\n- Montres connectées\n- Enceintes Bluetooth\n- Accessoires divers\n\nComparez les offres des différents vendeurs et vérifiez les avis avant d'acheter.",
  },
  {
    topic: 'categories',
    keywords: ['alimentation', 'nourriture', 'produits locaux', 'épicerie', 'boissons', 'produits du terroir'],
    response:
      "Découvrez les produits alimentaires et locaux du Bénin sur BoutiKonect :\n\n- Produits frais (fruits, légumes)\n- Épices et condiments locaux\n- Huiles (palme, arachide, coco)\n- Céréales et légumineuses\n- Boissons traditionnelles\n- Gâteaux et pâtisseries\n- Produits transformés artisanaux\n\nSoutenez les producteurs locaux en achetant directement auprès d'eux sur notre plateforme !",
  },

  // -------------------------------------------------------------------
  // TOPIC: ACCOUNT
  // -------------------------------------------------------------------
  {
    topic: 'account',
    keywords: ['compte', 'connexion', 'connecter', 'inscription', 's\'inscrire', 'créer un compte', 'se connecter'],
    response:
      "Pour gérer votre compte BoutiKonect :\n\n**Créer un compte :**\n- Cliquez sur 'S'inscrire' depuis la page d'accueil\n- Remplissez le formulaire avec vos informations\n- Validez votre email ou numéro de téléphone\n- Vous pouvez aussi vous inscrire avec Google\n\n**Se connecter :**\n- Utilisez votre email et votre mot de passe\n- Ou connectez-vous avec Google\n\n**Mot de passe oublié ?**\n- Cliquez sur 'Mot de passe oublié' sur la page de connexion\n- Saisissez votre email pour recevoir un lien de réinitialisation\n\nVous avez besoin d'aide pour une étape en particulier ?",
  },
  {
    topic: 'account',
    keywords: ['mot de passe', 'mdp', 'changer mot de passe', 'réinitialiser mot de passe', 'mot de passe oublié', 'modifier mot de passe'],
    response:
      "Pour gérer votre mot de passe :\n\n**Mot de passe oublié :**\n1. Allez sur la page de connexion\n2. Cliquez sur 'Mot de passe oublié'\n3. Saisissez votre adresse email\n4. Vous recevrez un lien de réinitialisation par email\n5. Cliquez sur le lien et créez un nouveau mot de passe\n\n**Changer votre mot de passe :**\n1. Connectez-vous à votre compte\n2. Allez dans les paramètres de votre profil\n3. Section 'Sécurité' > 'Changer le mot de passe'\n4. Saisissez votre ancien et nouveau mot de passe\n\nVotre mot de passe doit contenir au moins 8 caractères avec des lettres et des chiffres.",
  },
  {
    topic: 'account',
    keywords: ['modifier profil', 'modifier compte', 'paramètres', 'informations personnelles', 'éditer profil', 'photo de profil'],
    response:
      "Pour modifier les informations de votre compte :\n\n1. Connectez-vous à votre compte\n2. Cliquez sur votre photo de profil ou votre nom en haut à droite\n3. Sélectionnez 'Mon profil' ou 'Paramètres'\n4. Vous pouvez modifier :\n   - Votre nom et prénom\n   - Votre photo de profil\n   - Votre numéro de téléphone\n   - Votre adresse et localisation\n   - Votre biographie (pour les vendeurs)\n   - Les informations de votre boutique\n\nN'oubliez pas de cliquer sur 'Enregistrer' après vos modifications.",
  },
  {
    topic: 'account',
    keywords: ['supprimer compte', 'désactiver compte', 'fermer compte', 'quitter plateforme'],
    response:
      "Nous sommes désolés de vous voir partir ! Si vous souhaitez supprimer votre compte :\n\n1. Connectez-vous à votre compte\n2. Allez dans les paramètres de votre profil\n3. Section 'Compte' > 'Supprimer mon compte'\n\n**Important :**\n- La suppression est définitive et irréversible\n- Toutes vos données seront supprimées\n- Les annonces en cours seront retirées\n- Les commandes en cours devront être traitées avant la suppression\n- Si vous êtes vendeur, assurez-vous d'avoir traité toutes vos commandes\n\nSi vous avez des problèmes avec votre compte, contactez notre support avant de le supprimer. Nous sommes là pour vous aider !",
  },

  // -------------------------------------------------------------------
  // TOPIC: CONTACT / SUPPORT
  // -------------------------------------------------------------------
  {
    topic: 'contact',
    keywords: ['contact', 'assistance', 'support', 'aide', 'service client', 'contacter', 'joindre', 'problème', 'bug'],
    response:
      "Vous pouvez nous contacter de plusieurs façons :\n\n- **Email :** contact@boutikonect.bj (réponse sous 24h ouvrées)\n- **WhatsApp :** +229 01 XX XX XX XX (réponse immédiate aux heures ouvrables)\n- **Formulaire de contact :** Disponible sur notre site (rubrique 'Contact')\n- **Réseaux sociaux :** Facebook, Instagram, Twitter @BoutiKonect\n\nNotre équipe est disponible du lundi au vendredi de 8h à 18h et le samedi de 9h à 13h. Nous répondons à tous les messages dans les 24 heures.",
  },
  {
    topic: 'contact',
    keywords: ['réclamation', 'plainte', 'litige', 'conflit', 'problème commande', 'produit non reçu', 'produit défectueux'],
    response:
      "Si vous avez un problème avec une commande ou un produit, voici la marche à suivre :\n\n1. **Contactez d'abord le vendeur** : Utilisez la messagerie intégrée depuis votre tableau de bord pour expliquer le problème\n2. **Si pas de solution sous 48h** : Ouvrez un litige depuis la page de votre commande\n3. **Notre équipe intervient** : Nous analysons la situation et trouvons une solution équitable\n\nPour signaler un produit ou un comportement inapproprié, utilisez la fonction 'Signaler' sur la page du produit ou du vendeur. Notre équipe traite chaque signalement dans les plus brefs délais.",
  },
  {
    topic: 'contact',
    keywords: ['signaler', 'signaler abus', 'signaler produit', 'contenu inapproprié', 'arnaque', 'faux produit', 'contrefaçon'],
    response:
      "Pour signaler un contenu ou un comportement inapproprié sur BoutiKonect :\n\n1. Ouvrez la page du produit, du service ou du profil concerné\n2. Cliquez sur le bouton 'Signaler' (généralement identifié par un icône de drapeau)\n3. Choisissez la raison du signalement : spam, contenu inapproprié, faux produit, langage offensant ou autre\n4. Ajoutez une description détaillée du problème\n5. Soumettez le signalement\n\nNotre équipe de modération examine chaque signalement dans les 24 à 48 heures et prend les mesures nécessaires. Votre anonymat est préservé lors du signalement.",
  },

  // -------------------------------------------------------------------
  // TOPIC: PROMOTED (ADS / FEATURED)
  // -------------------------------------------------------------------
  {
    topic: 'promoted',
    keywords: ['promu', 'promoted', 'en vedette', 'produit promu', 'service promu', 'badge promu', 'annonce en tête'],
    response:
      "Les produits et services promus sur BoutiKonect sont des annonces mises en avant par les vendeurs pour augmenter leur visibilité. Ils apparaissent dans des emplacements prioritaires et sont identifiés par un badge 'Promu'.\n\nLes avantages de la promotion :\n- Visibilité accrue dans les résultats de recherche\n- Apparition sur la page d'accueil\n- Jusqu'à 3 fois plus de vues qu'une annonce standard\n- Possibilité de cibler une zone géographique spécifique\n\nLes vendeurs peuvent promouvoir leurs articles depuis leur tableau de bord, dans la section 'Promouvoir mes annonces'.",
  },
  {
    topic: 'promoted',
    keywords: ['badge', 'badge promu', 'étiquette', 'label', 'certification', 'vérifié', 'compte vérifié'],
    response:
      "Sur BoutiKonect, vous trouverez différents badges indiquant la fiabilité des vendeurs et des annonces :\n\n- **Badge 'Promu'** : Annonce mise en avant par le vendeur (payant)\n- **Badge 'Vérifié'** : Vendeur dont l'identité a été vérifiée par notre équipe\n- **Badge 'En vedette'** : Annonce sélectionnée par notre équipe pour sa qualité\n- **Badge 'Nouveau'** : Annonce récemment publiée (moins de 7 jours)\n\nLes vendeurs vérifiés inspirent davantage confiance. Si vous êtes vendeur, nous vous encourageons à vérifier votre profil pour rassurer vos acheteurs.",
  },
  {
    topic: 'promoted',
    keywords: ['combien promouvoir', 'tarif promotion', 'prix promotion', 'budget pub', 'coût promotion'],
    response:
      "Voici les tarifs de promotion sur BoutiKonect :\n\n1. **Produit en vedette** : 5 000 FCFA/semaine - apparaît en haut des résultats\n2. **Annonce boostée** : 3 000 FCFA/semaine - mise en avant dans la catégorie\n3. **Bannière accueil** : 15 000 FCFA/semaine - visible sur toute la page d'accueil\n4. **Pack Premium** : 25 000 FCFA/mois - comprend toutes les options de promotion\n\nPour les nouveaux vendeurs, nous offrons 7 jours de promotion gratuite pour votre première annonce ! Rendez-vous dans votre tableau de bord vendeur pour découvrir les options disponibles.",
  },

  // -------------------------------------------------------------------
  // TOPIC: GEOLOCATION (Search by distance / location)
  // -------------------------------------------------------------------
  {
    topic: 'geolocation',
    keywords: ['proximité', 'près de chez moi', 'à côté', 'géolocalisation', 'localisation', 'autour de moi', 'ville', 'commune', 'quartier'],
    response:
      "BoutiKonect vous permet de trouver des produits et services près de chez vous grâce à la géolocalisation !\n\n- Utilisez le filtre 'À proximité' sur la page de recherche\n- Vous pouvez rechercher des articles dans votre ville, votre département ou dans tout le Bénin\n- Les résultats sont triés par distance (du plus proche au plus éloigné)\n- Vous pouvez définir un rayon de recherche (5 km, 10 km, 25 km, 50 km)\n\nCette fonctionnalité est idéale pour :\n- Trouver des produits disponibles immédiatement près de chez vous\n- Réduire les frais de livraison\n- Acheter auprès de commerçants de votre localité\n- Découvrir des artisans et producteurs locaux\n\nActivez la géolocalisation dans votre navigateur pour une expérience optimale !",
  },
  {
    topic: 'geolocation',
    keywords: ['cotonou', 'porto-novo', 'parakou', 'abomey', 'lokossa', 'natitingou', 'djougou', 'kandi', 'bohicon', 'calavi', 'abomey-calavi', 'allada', 'ouidah'],
    response:
      "Bien sûr ! BoutiKonect est actif dans toutes les 77 communes du Bénin, y compris les grandes villes :\n\n- **Sud :** Cotonou, Porto-Novo, Abomey-Calavi, Ouidah, Lokossa, Grand-Popo, Sèmè-Kpodji\n- **Centre :** Abomey, Bohicon, Dassa-Zoumé, Savalou, Savé\n- **Nord :** Parakou, Djougou, Natitingou, Kandi, Malanville, Tanguiéta\n- **Est :** Kétou, Pobè, Sakété, Adja-Ouèrè\n- **Ouest :** Aplahoué, Lalo, Bantè, Bassila\n\nQue vous soyez dans une grande ville ou une localité plus rurale, vous pouvez acheter et vendre sur BoutiKonect. Utilisez le filtre de recherche par département ou commune pour voir ce qui est disponible près de chez vous !",
  },
  {
    topic: 'geolocation',
    keywords: ['77 communes', 'département', 'bénin', 'tout le bénin', 'livraison nationale', 'benin'],
    response:
      "BoutiKonect couvre l'intégralité du territoire béninois avec les 77 communes réparties dans les 12 départements :\n\n- **Alibori :** Banikoara, Gogounou, Kandi, Karimama, Malanville, Segbana\n- **Atacora :** Boukoumbé, Cobly, Kérou, Kouandé, Matéri, Natitingou, Pehonko, Tanguiéta, Toucountouna\n- **Atlantique :** Abomey-Calavi, Allada, Kpomassè, Ouidah, Sô-Ava, Toffo, Tori-Bossito, Zè\n- **Borgou :** Bembéréké, Kalalé, N'Dali, Nikki, Parakou, Pèrèrè, Sinendé, Tchaourou\n- **Collines :** Bantè, Dassa-Zoumé, Glazoué, Ouèssè, Savalou, Savé\n- **Couffo :** Aplahoué, Djakotomey, Klouékanmè, Lalo, Toviklin\n- **Donga :** Bassila, Copargo, Djougou, Ouaké\n- **Littoral :** Cotonou\n- **Mono :** Athiémè, Bopa, Comè, Grand-Popo, Houéyogbé, Lokossa\n- **Ouémé :** Adjarra, Adjohoun, Aguégués, Akpro-Missérété, Avrankou, Bonou, Dangbo, Porto-Novo, Sèmè-Kpodji\n- **Plateau :** Adja-Ouèrè, Ifangni, Kétou, Pobè, Sakété\n- **Zou :** Abomey, Agbangnizoun, Bohicon, Covè, Djidja, Ouinhi, Za-Kpota, Zagnanado, Zogbodomey\n\nQuelle que soit votre localisation, vous trouverez certainement ce qu'il vous faut près de chez vous !",
  },
  {
    topic: 'geolocation',
    keywords: ['distance', 'combien de km', 'à combien de kilomètres', 'proche', 'loin', 'rayon'],
    response:
      "La fonction de recherche par distance sur BoutiKonect vous permet de :\n\n- Filtrer les résultats dans un rayon de 5, 10, 25 ou 50 km autour de votre position\n- Voir la distance exacte entre vous et chaque vendeur\n- Estimer les frais de livraison en fonction de la distance\n- Trouver les produits disponibles immédiatement dans votre quartier ou votre ville\n\nPour utiliser cette fonction, autorisez la géolocalisation dans votre navigateur ou saisissez manuellement votre ville dans le champ de recherche. Vous verrez alors la distance à côté de chaque annonce.",
  },
];

// -------------------------------------------------------------------
// Fallback response when no keywords match
// -------------------------------------------------------------------
const defaultResponse =
  "Je n'ai pas bien compris votre demande. Pouvez-vous reformuler votre question ? Je peux vous aider avec les sujets suivants :\n\n- **Achats** : Comment acheter un produit ou service\n- **Ventes** : Comment devenir vendeur et publier une annonce\n- **Livraison** : Délais, frais et options de livraison\n- **Paiement** : Moyens de paiement acceptés et sécurité\n- **Compte** : Création, connexion et gestion de votre profil\n- **Catégories** : Les différentes catégories de produits et services\n- **Promotion** : Comment promouvoir vos annonces\n- **Géolocalisation** : Recherche par proximité géographique\n- **Contact** : Comment nous joindre pour toute assistance\n\nDites-moi simplement ce dont vous avez besoin en quelques mots !";

// -------------------------------------------------------------------
// Topic mapping for context-aware responses (if we want to track conversation topics)
// -------------------------------------------------------------------
export const topicMap = {
  greetings: 'Salutations',
  delivery: 'Livraison',
  payment: 'Paiement',
  sell: 'Vente',
  categories: 'Catégories',
  account: 'Compte',
  contact: 'Contact / Support',
  promoted: 'Promotion / Publicité',
  geolocation: 'Géolocalisation / Localisation',
};

// -------------------------------------------------------------------
// findChatbotResponse - Find the best matching response for a message
// -------------------------------------------------------------------

/**
 * Finds the best chatbot response for a given user message by scoring
 * keyword matches. Returns the response with the highest match score.
 *
 * @param {string} message - The user's message text
 * @returns {string} The chatbot response
 */
// -------------------------------------------------------------------
// Fuse.js matching — fuzzy search against keywords + topic + title
// -------------------------------------------------------------------

/**
 * Build a flat search index from the chatbot data.
 * Each keyword/topic becomes a separate document pointing to its parent entry.
 */
function buildSearchIndex() {
  const docs = [];
  for (const entry of chatbotData) {
    // Add each keyword as its own doc
    for (const kw of entry.keywords) {
      docs.push({ text: kw.toLowerCase(), entry, type: 'keyword' });
    }
    // Also add the topic label for broader matching
    docs.push({ text: entry.topic.toLowerCase(), entry, type: 'topic' });
  }

  return new Fuse(docs, {
    keys: ['text'],
    threshold: 0.4,       // 0 = perfect match, 1 = match anything
    distance: 100,        // max edit distance for fuzzy
    includeScore: true,
    minMatchCharLength: 3,
    shouldSort: true,
    findAllMatches: false,
  });
}

/** Singleton fuse instance (lazy initialised) */
let _fuse = null;
function getFuse() {
  if (!_fuse) _fuse = buildSearchIndex();
  return _fuse;
}

// -------------------------------------------------------------------
// Public API
// -------------------------------------------------------------------

/**
 * Find the best chatbot response for a user message using fuzzy search.
 * Falls back to a default response when nothing matches well enough.
 *
 * @param {string} message – raw user input
 * @returns {string} chatbot reply
 */
export function findChatbotResponse(message) {
  if (!message || typeof message !== 'string') {
    return defaultResponse;
  }

  const normalized = message.toLowerCase().trim().replace(/\s+/g, ' ');
  if (normalized.length === 0) return defaultResponse;

  const fuse = getFuse();
  const results = fuse.search(normalized);

  // Score threshold: 0.5 means fuzzy match must be better than 50 % edit distance
  // Also try exact substring fallback for very short queries
  if (results.length > 0 && results[0].score <= 0.5) {
    // Deduplicate: pick the first entry that appears (highest-ranked keyword)
    const seen = new Set();
    for (const r of results) {
      if (r.score > 0.5) break;
      const entry = r.item.entry;
      const key = entry.topic;
      if (!seen.has(key)) {
        seen.add(key);
        return entry.response;
      }
    }
  }

  // Fallback 1: loose substring check (any keyword contained in message)
  for (const entry of chatbotData) {
    for (const kw of entry.keywords) {
      const kwLower = kw.toLowerCase();
      if (kwLower.length >= 3 && normalized.includes(kwLower)) {
        return entry.response;
      }
    }
  }

  // Fallback 2: check if message is not completely off-topic
  // (useful for short messages like "paiement" that might not pass fuse threshold)
  for (const entry of chatbotData) {
    for (const kw of entry.keywords) {
      const kwLower = kw.toLowerCase();
      if (kwLower.length >= 3 && kwLower.includes(normalized)) {
        return entry.response;
      }
    }
  }

  return defaultResponse;
}

/**
 * Get a list of all available topics with their descriptions.
 * Useful for displaying a help menu to the user.
 *
 * @returns {Array<{topic: string, label: string, example: string}>}
 */
export function getAvailableTopics() {
  return [
    { topic: 'greetings', label: 'Salutations', example: 'Bonjour, salut, merci' },
    { topic: 'delivery', label: 'Livraison', example: 'Livraison, delai, frais de livraison' },
    { topic: 'payment', label: 'Paiement', example: 'Paiement, Mobile Money, MTN, Moov' },
    { topic: 'sell', label: 'Vente', example: 'Vendre, devenir vendeur, commission' },
    { topic: 'categories', label: 'Categories', example: 'Vetements, electronique' },
    { topic: 'account', label: 'Compte', example: 'Connexion, mot de passe, profil' },
    { topic: 'contact', label: 'Contact / Support', example: 'Contact, assistance, WhatsApp' },
    { topic: 'promoted', label: 'Promotion', example: 'Promu, en vedette, badge' },
    { topic: 'geolocation', label: 'Geolocalisation', example: 'Proximite, Cotonou, pres de chez moi' },
  ];
}

export default chatbotData;
