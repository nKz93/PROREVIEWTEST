"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Circle, ChevronRight, X, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Step {
  key: string
  label: string
  description: string
  href: string
  emoji: string
}

const STEPS: Step[] = [
  { key: 'step_profile', label: 'Compléter votre profil', description: 'Nom, logo, type de commerce', href: '/dashboard/settings', emoji: '🏪' },
  { key: 'step_google_url', label: 'Ajouter votre lien Google', description: 'URL de votre fiche Google Business', href: '/dashboard/settings', emoji: '🔗' },
  { key: 'step_first_customer', label: 'Ajouter votre 1er client', description: 'Manuellement ou via CSV', href: '/dashboard/customers', emoji: '👤' },
  { key: 'step_first_send', label: 'Envoyer votre 1re demande', description: 'Testez le flow complet', href: '/dashboard/customers', emoji: '📱' },
  { key: 'step_qr_code', label: 'Générer un QR code', description: 'À afficher en caisse', href: '/dashboard/qr-codes', emoji: '🔲' },
]

interface OnboardingBannerProps {
  businessId: string
}

export default function OnboardingBanner({ businessId }: OnboardingBannerProps) {
  const [steps, setSteps] = useState<Record<string, boolean>>({})
  const [completed, setCompleted] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchSteps = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('onboarding_steps')
        .select('*')
        .eq('business_id', businessId)
        .single()

      if (!data) {
        // Créer la ligne d'onboarding
        await supabase.from('onboarding_steps').insert({ business_id: businessId })
        setSteps({})
      } else {
        setSteps(data)
        setCompleted(data.completed || false)
      }
      setLoading(false)
    }
    fetchSteps()
  }, [businessId])

  const doneCount = STEPS.filter(s => steps[s.key]).length
  const progress = Math.round((doneCount / STEPS.length) * 100)

  if (loading || completed || dismissed) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        className="bg-gradient-to-r from-blue-600 to-violet-600 rounded-2xl p-5 text-white relative overflow-hidden"
      >
        {/* Décoration */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-20 w-20 h-20 bg-white/5 rounded-full translate-y-1/2" />

        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 text-white/60 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-yellow-300" />
          <h3 className="font-bold text-lg">Bienvenue sur ProReview !</h3>
          <span className="ml-auto text-sm text-white/70 font-medium">{doneCount}/{STEPS.length} étapes</span>
        </div>

        {/* Barre de progression */}
        <div className="w-full h-1.5 bg-white/20 rounded-full mb-4 overflow-hidden">
          <motion.div
            className="h-full bg-yellow-300 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {STEPS.map((step, i) => {
            const done = !!steps[step.key]
            return (
              <button
                key={step.key}
                onClick={() => !done && router.push(step.href)}
                className={`flex flex-col items-start gap-1 p-3 rounded-xl text-left transition-all text-sm ${
                  done
                    ? 'bg-white/10 opacity-60 cursor-default'
                    : 'bg-white/10 hover:bg-white/20 cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-lg">{step.emoji}</span>
                  {done
                    ? <CheckCircle2 className="w-4 h-4 text-yellow-300" />
                    : <Circle className="w-4 h-4 text-white/40" />
                  }
                </div>
                <p className={`font-medium text-xs leading-tight ${done ? 'line-through text-white/50' : ''}`}>{step.label}</p>
              </button>
            )
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
