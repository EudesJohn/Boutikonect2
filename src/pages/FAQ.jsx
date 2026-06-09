import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, Search } from 'lucide-react';

const faqs = [
  {
    category: 'Compte & Inscription',
    items: [
      {
        q: 'Comment creer un compte sur BoutiKonect ?',
        a: 'Cliquez sur "S\'inscrire" en haut de la page, remplissez le formulaire avec votre nom, email et mot de passe. Vous pouvez aussi vous inscrire avec Google en un clic.',
      },
      {
        q: 'Comment devenir vendeur ?',
        a: 'Apres avoir cree un compte, allez dans votre profil et activez le mode vendeur. Vous pourrez ensuite publier vos produits et services.',
      },
      {
        q: 'J\'ai oublie mon mot de passe, que faire ?',
        a: 'Sur la page de connexion, cliquez sur "Mot de passe oublie" et entrez votre email. Vous recevrez un lien pour reinitialiser votre mot de passe.',
      },
    ],
  },
  {
    category: 'Achats & Commandes',
    items: [
      {
        q: 'Comment passer une commande ?',
        a: 'Ajoutez les articles souhaites a votre panier, puis rendez-vous dans le panier pour finaliser votre commande en fournissant vos coordonnees de livraison.',
      },
      {
        q: 'Puis-je annuler une commande ?',
        a: 'Tant que le vendeur n\'a pas confirme la commande, vous pouvez l\'annuler depuis votre tableau de bord. Une fois confirmee, contactez le vendeur directement.',
      },
      {
        q: 'Comment suivre ma commande ?',
        a: 'Rendez-vous dans "Mes commandes" depuis votre tableau de bord. Vous verrez le statut en temps reel de chaque commande.',
      },
    ],
  },
  {
    category: 'Paiements & Livraison',
    items: [
      {
        q: 'Quels moyens de paiement sont acceptes ?',
        a: 'Nous acceptons les paiements en especes a la livraison, Mobile Money (MTN, Moov), et le virement bancaire pour les montants importants.',
      },
      {
        q: 'Quels sont les delais de livraison ?',
        a: 'Les delais varient selon le vendeur et votre localisation. En general, comptez 24 a 72h pour les livraisons a Cotonou et ses environs.',
      },
      {
        q: 'Y a-t-il des frais de livraison ?',
        a: 'Les frais de livraison sont calcules en fonction de la distance et du poids du colis. Ils sont affiches avant la confirmation de la commande.',
      },
    ],
  },
  {
    category: 'Ventes & Publication',
    items: [
      {
        q: 'Comment publier un produit ?',
        a: 'Depuis votre espace vendeur, cliquez sur "Publier". Ajoutez des photos, un titre, une description et un prix pour votre produit ou service.',
      },
      {
        q: 'Y a-t-il des frais pour vendre ?',
        a: 'La publication d\'annonces est gratuite. Nous prelevons une commission uniquement sur les ventes reussies.',
      },
      {
        q: 'Comment modifier ou supprimer une annonce ?',
        a: 'Allez dans "Mes annonces" depuis votre espace vendeur. Vous pouvez modifier ou archiver chaque annonce individuellement.',
      },
    ],
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFaqs = faqs
    .map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.a.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((cat) => cat.items.length > 0);

  return (
    <div className="min-h-screen bg-gray-950 py-16">
      <div className="max-w-3xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-8 h-8 text-black" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Questions frequentes
            </h1>
            <p className="text-gray-400 max-w-xl mx-auto">
              Trouvez les reponses a vos questions les plus courantes
            </p>
          </div>

          {/* Search */}
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher dans la FAQ..."
              className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* FAQ accordion */}
          <div className="space-y-8">
            {filteredFaqs.map((category, catIdx) => (
              <div key={category.category}>
                <h2 className="text-lg font-semibold text-amber-400 mb-3">
                  {category.category}
                </h2>
                <div className="space-y-2">
                  {category.items.map((faq, itemIdx) => {
                    const idx = `${catIdx}-${itemIdx}`;
                    const isOpen = openIndex === idx;
                    return (
                      <div
                        key={idx}
                        className="rounded-xl bg-gray-900/70 border border-gray-800 overflow-hidden"
                      >
                        <button
                          onClick={() => setOpenIndex(isOpen ? null : idx)}
                          className="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-gray-800/50 cursor-pointer"                        >
                          <span className="text-white font-medium pr-4">{faq.q}</span>
                          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${
                            isOpen ? 'rotate-180' : ''
                          }`} />
                        </button>
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 text-gray-400 text-sm leading-relaxed">
                                {faq.a}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {filteredFaqs.length === 0 && (
            <div className="text-center py-10 text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-2 text-gray-700" />
              <p>Aucun resultat pour "{searchQuery}"</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
