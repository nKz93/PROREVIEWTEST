"use client"
import { motion } from 'framer-motion';

const businessTypes = [
  { emoji: '🍕', name: 'Restaurant' },
  { emoji: '✂️', name: 'Coiffeur' },
  { emoji: '🔧', name: 'Garage' },
  { emoji: '🦷', name: 'Dentiste' },
  { emoji: '💆', name: 'Spa & Beauté' },
  { emoji: '🏥', name: 'Médecin' },
  { emoji: '🏨', name: 'Hôtel' },
  { emoji: '🛍️', name: 'Boutique' },
];

export default function LogoCloud() {
  return (
    <section className="py-16 px-4 bg-gray-50 border-y border-gray-100">
      <div className="container max-w-6xl mx-auto">
        <p className="text-center text-sm text-gray-400 mb-8 uppercase tracking-wider font-medium">
          Idéal pour tous les commerces de proximité
        </p>
        <div className="flex flex-wrap justify-center gap-6">
          {businessTypes.map((type, index) => (
            <motion.div
              key={type.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="flex flex-col items-center gap-2 px-6 py-4 bg-white rounded-2xl shadow-sm border border-gray-100"
            >
              <span className="text-3xl">{type.emoji}</span>
              <span className="text-xs font-medium text-gray-500">{type.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
