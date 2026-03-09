"use client"
import { motion } from 'framer-motion'
import { UserPlus, MessageCircle, Star } from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: UserPlus,
    title: 'Ajoutez vos clients',
    description: 'Importez votre base CSV, ajoutez manuellement ou via QR code. Chaque client est enregistré avec sa date de visite.',
    color: 'from-blue-500 to-blue-600',
  },
  {
    number: '02',
    icon: MessageCircle,
    title: 'SMS/Email envoyé automatiquement',
    description: 'X heures après la visite, ProReview envoie un message personnalisé avec un lien unique pour laisser un avis.',
    color: 'from-violet-500 to-violet-600',
  },
  {
    number: '03',
    icon: Star,
    title: 'Avis Google collecté',
    description: 'Les clients satisfaits laissent leur avis sur Google. Les mécontents vous écrivent en privé. Votre note monte !',
    color: 'from-green-500 to-green-600',
  },
]

export default function HowItWorks() {
  return (
    <section className="py-24 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block bg-violet-50 text-violet-600 rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
            Comment ça marche
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
            Simple comme bonjour
          </h2>
          <p className="text-xl text-gray-600">3 étapes, 5 minutes de configuration, des résultats en 48h</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Ligne de connexion */}
          <div className="hidden md:block absolute top-16 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-blue-300 to-violet-300" />

          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className="relative text-center"
            >
              {/* Numéro flottant */}
              <div className="relative inline-block mb-6">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg mx-auto`}>
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                <span className="absolute -top-3 -right-3 w-7 h-7 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                  {i + 1}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
              <p className="text-gray-600 leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
