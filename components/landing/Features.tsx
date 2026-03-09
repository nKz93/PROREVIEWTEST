"use client"
import { motion } from 'framer-motion'
import { MessageSquare, Shield, QrCode, BarChart3, Upload, Building2 } from 'lucide-react'

const features = [
  {
    icon: MessageSquare,
    title: 'SMS & Email automatique',
    description: 'Envoyez des demandes d\'avis automatiquement après chaque visite. Configurez le délai, le message, et laissez faire.',
    color: 'blue',
  },
  {
    icon: Shield,
    title: 'Filtre intelligent',
    description: 'Les clients satisfaits (4-5⭐) sont redirigés vers Google. Les mécontents remplissent un formulaire privé. Seulement du positif sur Google.',
    color: 'violet',
  },
  {
    icon: QrCode,
    title: 'QR Codes',
    description: 'Générez des QR codes à imprimer en caisse, dans la salle, sur les tickets. Scannez et laissez un avis en 10 secondes.',
    color: 'green',
  },
  {
    icon: BarChart3,
    title: 'Dashboard analytics',
    description: 'Suivez vos taux de conversion, vos avis obtenus, l\'évolution de votre note et toutes vos statistiques en temps réel.',
    color: 'yellow',
  },
  {
    icon: Upload,
    title: 'Import CSV',
    description: 'Importez votre base clients existante en un clic. Compatible avec tous les formats. Mapping automatique des colonnes.',
    color: 'pink',
  },
  {
    icon: Building2,
    title: 'Multi-établissement',
    description: 'Gérez plusieurs commerces depuis un seul compte. Statistiques consolidées ou par établissement selon vos besoins.',
    color: 'orange',
  },
]

const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600',
  violet: 'bg-violet-50 text-violet-600',
  green: 'bg-green-50 text-green-600',
  yellow: 'bg-yellow-50 text-yellow-600',
  pink: 'bg-pink-50 text-pink-600',
  orange: 'bg-orange-50 text-orange-600',
}

export default function Features() {
  return (
    <section id="features" className="py-24 px-4 bg-gray-50/50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block bg-blue-50 text-blue-600 rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
            Fonctionnalités
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
            Tout ce dont vous avez besoin
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Un outil complet pour booster votre réputation en ligne, sans effort.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100"
            >
              <div className={`w-12 h-12 rounded-xl ${colorMap[feature.color]} flex items-center justify-center mb-4`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
