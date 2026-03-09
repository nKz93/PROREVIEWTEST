"use client"
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CTA() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="gradient-primary rounded-3xl p-12 text-center text-white relative overflow-hidden"
        >
          {/* Étoiles décoratives */}
          {[...Array(6)].map((_, i) => (
            <Star
              key={i}
              className="absolute text-white/10 fill-white/10"
              style={{
                width: `${20 + i * 10}px`,
                height: `${20 + i * 10}px`,
                top: `${Math.random() * 80 + 10}%`,
                left: `${Math.random() * 80 + 10}%`,
                transform: `rotate(${i * 30}deg)`,
              }}
            />
          ))}

          <div className="relative z-10">
            <div className="flex justify-center mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
              Prêt à booster vos avis Google ?
            </h2>
            <p className="text-blue-100 text-xl mb-8 max-w-2xl mx-auto">
              Rejoignez +500 commerçants qui collectent des avis 5 étoiles automatiquement.
              14 jours gratuits, sans carte bancaire.
            </p>
            <Button
              size="xl"
              className="bg-white text-blue-600 hover:bg-blue-50 font-bold shadow-xl"
              asChild
            >
              <Link href="/auth/register">
                Créer mon compte gratuit
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
