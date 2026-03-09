"use client"
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink, Send, Star, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SATISFACTION_EMOJIS, FEEDBACK_CATEGORIES } from '@/lib/constants'

interface ReviewFlowProps {
  requestId: string
  businessId: string
  customerId: string
  businessName: string
  googleReviewUrl: string | null
  logoUrl: string | null
  customerName: string
  uniqueCode: string
}

type Step = 'satisfaction' | 'google' | 'feedback' | 'done'

export default function ReviewFlow({
  requestId,
  businessId,
  customerId,
  businessName,
  googleReviewUrl,
  customerName,
  logoUrl,
}: ReviewFlowProps) {
  const [step, setStep] = useState<Step>('satisfaction')
  const [selectedScore, setSelectedScore] = useState<number | null>(null)
  const [hoveredScore, setHoveredScore] = useState<number | null>(null)
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [feedbackCategory, setFeedbackCategory] = useState('general')
  const [submitting, setSubmitting] = useState(false)
  const [confettiItems] = useState(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'][Math.floor(Math.random() * 5)],
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 2,
      xOffset: (Math.random() - 0.5) * 200,
    }))
  )
  const [showConfetti, setShowConfetti] = useState(false)

  const handleScoreSelect = async (score: number) => {
    setSelectedScore(score)

    try {
      await fetch('/api/review/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          score,
          action: score >= 4 ? 'redirect_google' : 'private_feedback',
        }),
      })
    } catch {
      // Non-blocking: let user continue even if tracking fails
    }

    if (score >= 4) {
      if (score === 5) setShowConfetti(true)
      setStep('google')
    } else {
      setStep('feedback')
    }
  }

  const handleGoogleRedirect = () => {
    if (googleReviewUrl) window.open(googleReviewUrl, '_blank')
    setStep('done')
  }

  const handleFeedbackSubmit = async () => {
    if (!feedbackMessage.trim()) return
    setSubmitting(true)
    try {
      await fetch('/api/review/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          score: selectedScore,
          action: 'private_feedback',
          feedback: feedbackMessage,
          category: feedbackCategory,
        }),
      })
    } catch {
      // Non-blocking: show done regardless
    } finally {
      setSubmitting(false)
      setStep('done')
    }
  }

  const displayScore = hoveredScore ?? selectedScore

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-violet-50 flex items-center justify-center p-4">
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {confettiItems.map((item) => (
            <motion.div
              key={item.id}
              className="absolute w-2 h-2 rounded-full"
              style={{ left: `${item.left}%`, top: '-10px', backgroundColor: item.color }}
              animate={{ y: 800, x: item.xOffset, rotate: 360 }}
              transition={{ duration: item.duration, delay: item.delay, ease: 'easeIn' }}
            />
          ))}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-sm"
      >
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="gradient-primary p-6 text-center">
            {logoUrl ? (
              <img src={logoUrl} alt={businessName} className="h-12 mx-auto rounded-xl mb-2 object-contain" />
            ) : (
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <Star className="w-7 h-7 text-white fill-white" />
              </div>
            )}
            <h1 className="text-white font-bold text-lg">{businessName}</h1>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">

              {step === 'satisfaction' && (
                <motion.div key="satisfaction" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Comment s'est passée votre visite ?</h2>
                  <p className="text-gray-500 text-sm mb-8">Bonjour {customerName}, votre avis nous est précieux 🙏</p>

                  {/* Emojis */}
                  <div className="flex justify-center gap-3 mb-6">
                    {SATISFACTION_EMOJIS.map((emoji, i) => {
                      const score = i + 1
                      const isActive = displayScore !== null && score <= displayScore
                      return (
                        <motion.button
                          key={i}
                          whileHover={{ scale: 1.3 }}
                          whileTap={{ scale: 0.9 }}
                          onHoverStart={() => setHoveredScore(score)}
                          onHoverEnd={() => setHoveredScore(null)}
                          onClick={() => handleScoreSelect(score)}
                          className={`text-4xl transition-all duration-150 ${isActive ? 'scale-110' : 'opacity-40'}`}
                        >
                          {emoji}
                        </motion.button>
                      )
                    })}
                  </div>

                  {/* Stars */}
                  <div className="flex justify-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <motion.button
                        key={score}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onHoverStart={() => setHoveredScore(score)}
                        onHoverEnd={() => setHoveredScore(null)}
                        onClick={() => handleScoreSelect(score)}
                        className="focus:outline-none"
                      >
                        <Star className={`w-9 h-9 transition-colors duration-150 ${displayScore !== null && score <= displayScore ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`} />
                      </motion.button>
                    ))}
                  </div>
                  {displayScore && (
                    <p className="text-sm text-gray-500 font-medium">
                      {['', 'Très mauvais 😡', 'Mauvais 😕', 'Moyen 😐', 'Bien 😊', 'Excellent ! 🤩'][displayScore]}
                    </p>
                  )}
                </motion.div>
              )}

              {step === 'google' && (
                <motion.div key="google" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center">
                  <div className="text-5xl mb-4">🎉</div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Merci beaucoup !</h2>
                  <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                    Nous sommes ravis que votre expérience ait été positive. Pourriez-vous partager votre avis sur Google ?
                  </p>
                  <Button variant="gradient" size="lg" className="w-full mb-3" onClick={handleGoogleRedirect}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Laisser mon avis Google ⭐
                  </Button>
                  <button onClick={() => setStep('done')} className="text-sm text-gray-400 hover:text-gray-600">
                    Non merci, peut-être une autre fois
                  </button>
                </motion.div>
              )}

              {step === 'feedback' && (
                <motion.div key="feedback" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">😔</div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Nous sommes désolés</h2>
                    <p className="text-gray-500 text-sm">Dites-nous ce que nous pouvons améliorer. Votre retour restera privé.</p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">Catégorie</label>
                      <Select value={feedbackCategory} onValueChange={setFeedbackCategory}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {FEEDBACK_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700 block mb-1">Votre message</label>
                      <Textarea
                        placeholder="Décrivez votre expérience..."
                        value={feedbackMessage}
                        onChange={(e) => setFeedbackMessage(e.target.value)}
                        rows={4}
                      />
                    </div>
                    <Button variant="gradient" className="w-full" onClick={handleFeedbackSubmit} disabled={!feedbackMessage.trim() || submitting}>
                      {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                      Envoyer mon retour
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 'done' && (
                <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }} className="text-6xl mb-4">✅</motion.div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Merci pour votre retour !</h2>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Votre avis a bien été pris en compte. À très bientôt chez {businessName} 👋
                  </p>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Propulsé par <span className="gradient-text font-semibold">ProReview</span>
        </p>
      </motion.div>
    </div>
  )
}
