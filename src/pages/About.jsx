import { motion } from 'framer-motion';
import {
  Store,
  Shield,
  Award,
  HeartHandshake,
  Target,
} from 'lucide-react';

const values = [
  {
    icon: Shield,
    title: 'Confiance',
    desc: 'Nous verifions chaque vendeur pour garantir des transactions securisees.',
  },
  {
    icon: HeartHandshake,
    title: 'Communauté',
    desc: 'Nous favorisons les echanges locaux et le tissu economique beninois.',
  },
  {
    icon: Award,
    title: 'Qualité',
    desc: 'Chaque produit et service est selectionne avec soin pour vous.',
  },
  {
    icon: Target,
    title: 'Innovation',
    desc: 'Nous utilisons les technologies modernes pour simplifier vos achats.',
  },
];

export default function About() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-6"
          >
            <Store className="w-10 h-10 text-black" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            A propos de <span className="text-amber-400">BoutiKonect</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            La plateforme beninoise qui connecte acheteurs et vendeurs locaux pour
            faciliter le commerce de proximite.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-2xl bg-gray-900/70 backdrop-blur-xl border border-gray-800"
          >
            <h2 className="text-2xl font-bold text-white mb-4">Notre histoire</h2>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>
                BoutiKonect est ne d&apos;un constat simple : au Benin, il existe une multitude
                de talents, d&apos;artisans, de commerçants et de prestataires de services qui
                manquent d&apos;une plateforme centralisee pour se faire connaitre.
              </p>
              <p>
                Notre mission est de creer un pont numerique entre les vendeurs locaux et
                les acheteurs, en offrant une experience simple, securisee et agreable.
                Que vous cherchiez un produit artisanal, un service professionnel ou un
                article du quotidien, BoutiKonect vous met en relation avec les meilleurs
                vendeurs de votre region.
              </p>
              <p>
                Nous croyons en un commerce plus humain, plus local et plus transparent.
                Chaque achat sur BoutiKonect est un geste pour soutenir l&apos;economie beninoise.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-gray-900/30">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-white text-center mb-10">Nos valeurs</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-gray-900/70 border border-gray-800 text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                  <v.icon className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{v.title}</h3>
                <p className="text-sm text-gray-400">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold text-white mb-4">
              Pret a rejoindre l&apos;aventure ?
            </h2>
            <p className="text-gray-400 mb-6">
              Que vous soyez acheteur ou vendeur, BoutiKonect est la plateforme qu&apos;il vous faut.
            </p>
            <div className="flex items-center justify-center gap-4">
              <a
                href="/register"
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl transition-colors"
              >
                Creer un compte
              </a>
              <a
                href="/contact"
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors"
              >
                Nous contacter
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
