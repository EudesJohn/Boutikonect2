import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Database, Mail, Cookie, Trash2 } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-950 py-16">
      <div className="max-w-3xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-black" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Politique de confidentialite
            </h1>
            <p className="text-gray-400">Derniere mise a jour : Juin 2026</p>
          </div>

          <div className="space-y-8">
            <Section
              icon={Database}
              title="1. Donnees collectees"
            >
              <p>Nous collectons les informations suivantes lors de votre utilisation de BoutiKonect :</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Nom, prenom et adresse email (lors de l&apos;inscription)</li>
                <li>Numero de telephone et adresse (optionnel, pour la livraison)</li>
                <li>Informations de profil (photo, bio, preferences)</li>
                <li>Donnees de navigation et d&apos;utilisation de la plateforme</li>
                <li>Historique des commandes et transactions</li>
              </ul>
            </Section>

            <Section
              icon={Lock}
              title="2. Utilisation des donnees"
            >
              <p>Vos donnees sont utilisees pour :</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Creer et gerer votre compte utilisateur</li>
                <li>Traiter et suivre vos commandes</li>
                <li>Vous envoyer des notifications importantes</li>
                <li>Ameliorer nos services et votre experience</li>
                <li>Assurer la securite de la plateforme</li>
              </ul>
            </Section>

            <Section
              icon={Eye}
              title="3. Partage des donnees"
            >
              <p>
                Nous ne vendons jamais vos donnees personnelles a des tiers. Vos
                informations peuvent etre partagees uniquement avec :
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Les vendeurs (uniquement pour le traitement des commandes)</li>
                <li>Les prestataires de services (livraison, paiement) strictement necessaires</li>
                <li>Les autorites competentes si requis par la loi</li>
              </ul>
            </Section>

            <Section
              icon={Shield}
              title="4. Securite des donnees"
            >
              <p>
                Nous mettons en œuvre des mesures de securite techniques et
                organisationnelles pour proteger vos donnees contre tout acces non
                autorise, alteration, divulgation ou destruction. Nos serveurs sont
                heberges dans des centres de donnees securises.
              </p>
            </Section>

            <Section
              icon={Cookie}
              title="5. Cookies"
            >
              <p>
                Nous utilisons des cookies essentiels au fonctionnement de la
                plateforme. Vous pouvez controler l&apos;utilisation des cookies via
                les parametres de votre navigateur. Le blocage des cookies peut
                affecter certaines fonctionnalites.
              </p>
            </Section>

            <Section
              icon={Trash2}
              title="6. Vos droits"
            >
              <p>Conformement a la reglementation, vous disposez des droits suivants :</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Droit d&apos;acces a vos donnees personnelles</li>
                <li>Droit de rectification des donnees inexactes</li>
                <li>Droit a l&apos;effacement ("droit a l&apos;oubli")</li>
                <li>Droit a la limitation du traitement</li>
                <li>Droit a la portabilite des donnees</li>
                <li>Droit d&apos;opposition au traitement</li>
              </ul>
            </Section>

            <Section
              icon={Mail}
              title="7. Contact"
            >
              <p>
                Pour exercer vos droits ou pour toute question relative a notre
                politique de confidentialite, contactez-nous a :
              </p>
              <p className="mt-2 text-amber-400">privacy@boutikonect.bj</p>
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
