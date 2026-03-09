"use client"
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'

const testimonials = [
  {
    name: 'Marie Dupont',
    role: 'Propriétaire · Restaurant Le Jardin',
    avatar: 'MD',
    rating: 5,
    text: 'En 3 mois, nous sommes passés de 4.1 à 4.8 étoiles sur Google. Les clients laissent des avis naturellement grâce aux SMS. Les quelques retours négatifs sont traités en interne. Une vraie révolution pour notre restaurant !',
  },
  {
    name: 'Thomas Martin',
    role: 'Gérant · Garage Martin & Fils',
    avatar: 'TM',
    rating: 5,
    text: 'Je suis garagiste, pas commercial. ProReview s\'occupe de tout. Mes clients reçoivent un SMS 2h après leur passage et 8 sur 10 laissent un avis. On a eu +45 avis Google ce mois-ci !',
  },
  {
    name: 'Sophie Bernard',
    role: 'Directrice · Institut Beauté Lumière',
    avatar: 'SB',
    rating: 5,
    text: 'Ce que j\'adore : les avis négatifs ne vont pas sur Google mais dans mon dashboard. Je peux répondre en privé et régler le problème avant qu\'il ne nuise à ma réputation. Outil indispensable.',
  },
]

export default function Testimonials() {
  return (
    <section className="py-24 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block bg-yellow-50 text-yellow-600 rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
            Témoignages
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
            Ils nous font confiance
          </h2>
          <p className="text-xl text-gray-600">Des résultats concrets, des commerces satisfaits</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(t.rating)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 text-sm leading-relaxed mb-6 italic">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
