import { motion } from 'framer-motion';
import { FileText, Scale, Shield, AlertTriangle } from 'lucide-react';

export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-950 py-16">
      <div className="max-w-3xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-black" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Conditions generales d&apos;utilisation
            </h1>
            <p className="text-gray-400">Derniere mise a jour : Juin 2026</p>
          </div>

          <div className="space-y-8">
            <Section
              icon={FileText}
              title="1. Acceptance des conditions"
            >
              <p>
                En accedant et en utilisant la plateforme BoutiKonect, vous acceptez
                d&apos;etre lie par les presentes conditions generales d&apos;utilisation.
                Si vous n&apos;acceptez pas ces conditions, veuillez ne pas utiliser nos services.
              </p>
            </Section>

            <Section
              icon={Scale}
              title="2. Definition des services"
            >
              <p>
                BoutiKonect est une plateforme de mise en relation entre acheteurs et
                vendeurs. Nous facilitons les transactions mais ne sommes pas partie
                prenante dans les contrats entre utilisateurs.
              </p>
            </Section>

            <Section
              icon={Shield}
              title="3. Responsabilites des utilisateurs"
            >
              <ul className="list-disc pl-5 space-y-2">
                <li>Fournir des informations exactes et a jour lors de l&apos;inscription</li>
                <li>Respecter les lois et reglementations en vigueur au Benin</li>
                <li>Ne pas publier de contenu frauduleux, illegale ou inapproprie</li>
                <li>Garantir que les produits et services proposes sont conformes a leur description</li>
                <li>Assurer la livraison des produits dans les delais convenus</li>
              </ul>
            </Section>

            <Section
              icon={AlertTriangle}
              title="4. Limitations de responsabilite"
            >
              <p>
                BoutiKonect agit comme une simple plateforme d&apos;intermediation.
                Nous ne pouvons etre tenus responsables des litiges entre acheteurs
                et vendeurs. En cas de probleme, nous encourageons les parties a
                trouver une solution a l&apos;amiable.
              </p>
            </Section>

            <Section
              icon={FileText}
              title="5. Propriete intellectuelle"
            >
              <p>
                Les contenus publies sur la plateforme (textes, images, logos) restent
                la propriete de leurs auteurs respectifs. Il est interdit de les
                reproduire sans autorisation.
              </p>
            </Section>

            <Section
              icon={Shield}
              title="6. Protection des donnees"
            >
              <p>
                Nous nous engageons a proteger vos donnees personnelles conformement
                a notre politique de confidentialite. Vos informations ne sont jamais
                partagees avec des tiers sans votre consentement explicite.
              </p>
            </Section>

            <Section
              icon={Scale}
              title="7. Modification des conditions"
            >
              <p>
                Nous nous reservons le droit de modifier ces conditions a tout moment.
                Les utilisateurs seront informes de tout changement majeur par email
                ou via la plateforme.
              </p>
            </Section>

            <Section
              icon={FileText}
              title="8. Contact"
            >
              <p>
                Pour toute question relative a ces conditions, contactez-nous a
                contact@boutikonect.bj.
              </p>
            </Section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="p-6 rounded-2xl bg-gray-900/70 backdrop-blur-xl border border-gray-800"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-amber-400" />
        </div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      <div className="text-gray-300 text-sm leading-relaxed space-y-2">
        {children}
      </div>
    </motion.div>
  );
}
