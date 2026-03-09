"use client"
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Play, Shield, Zap, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Hero() {
  return (
    <section className="pt-32 pb-20 px-4 bg-gradient-to-b from-blue-50/50 to-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-2 text-sm text-blue-700 font-medium mb-8"
          >
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Utilisé par +500 commerces en France
          </motion.div>

          {/* Titre principal */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-7xl font-extrabold text-gray-900 leading-tight mb-6"
          >
            Transformez vos clients{' '}
            <span className="gradient-text">satisfaits</span>
            {' '}en avis{' '}
            <span className="gradient-text">Google 5⭐</span>
          </motion.h1>

          {/* Sous-titre */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            ProReview envoie automatiquement des SMS et emails à vos clients après chaque visite.
            Les satisfaits laissent un avis Google, les mécontents vous écrivent en privé.
            <strong> Résultat : que des 5 étoiles.</strong>
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <Button variant="gradient" size="xl" asChild>
              <Link href="/auth/register">
                Commencer gratuitement
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" size="xl">
              <Play className="w-5 h-5 mr-2 fill-current" />
              Voir la démo
            </Button>
          </motion.div>

          {/* Garanties */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap justify-center gap-6 text-sm text-gray-500"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-500" />
              Aucune carte bancaire requise
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              Mise en place en 5 minutes
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Résultats visibles en 48h
            </div>
          </motion.div>
        </div>

        {/* Dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-20 relative"
        >
          <div className="absolute inset-0 gradient-primary rounded-3xl blur-3xl opacity-10 scale-105" />
          <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 bg-red-400 rounded-full" />
                <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                <div className="w-3 h-3 bg-green-400 rounded-full" />
              </div>
              <div className="flex-1 bg-gray-200 rounded-lg h-6 max-w-xs mx-auto" />
            </div>
            <div className="p-8">
              <div className="grid grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Avis envoyés', value: '248', color: 'blue' },
                  { label: 'Taux de clic', value: '73%', color: 'violet' },
                  { label: 'Avis Google', value: '156', color: 'green' },
                  { label: 'Note moyenne', value: '4.9⭐', color: 'yellow' },
                ].map((stat, i) => (
                  <div key={i} className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold gradient-text">{stat.value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-gray-50 rounded-2xl h-40 flex items-center justify-center">
                <div className="flex items-end gap-2 h-24">
                  {[40, 65, 45, 80, 55, 90, 70, 85, 95, 75, 88, 92].map((h, i) => (
                    <div
                      key={i}
                      className="w-6 rounded-t-lg gradient-primary opacity-70"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
