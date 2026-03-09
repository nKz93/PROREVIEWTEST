"use client"
import { motion } from 'framer-motion'
import { Send, Star, MessageSquare, Zap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface StatsCardsProps {
  sent: number
  reviewed: number
  feedbacks: number
  smsUsed: number
  smsLimit: number
  loading?: boolean
}

export default function StatsCards({ sent, reviewed, feedbacks, smsUsed, smsLimit, loading }: StatsCardsProps) {
  const smsPercent = smsLimit > 0 ? Math.round((smsUsed / smsLimit) * 100) : 0
  const convRate = sent > 0 ? Math.round((reviewed / sent) * 100) : 0

  const cards = [
    {
      label: 'Demandes envoyées',
      value: sent.toString(),
      sub: 'ce mois',
      icon: Send,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
    },
    {
      label: 'Avis Google obtenus',
      value: reviewed.toString(),
      sub: `${convRate}% de conversion`,
      icon: Star,
      color: 'text-yellow-500',
      bg: 'bg-yellow-50',
    },
    {
      label: 'Feedbacks non lus',
      value: feedbacks.toString(),
      sub: feedbacks > 0 ? '⚠️ À traiter' : '✅ Tout lu',
      icon: MessageSquare,
      color: feedbacks > 0 ? 'text-red-500' : 'text-green-500',
      bg: feedbacks > 0 ? 'bg-red-50' : 'bg-green-50',
    },
    {
      label: 'Quota SMS',
      value: `${smsUsed}/${smsLimit}`,
      sub: `${smsPercent}% utilisé`,
      icon: Zap,
      color: smsPercent >= 90 ? 'text-red-500' : smsPercent >= 70 ? 'text-orange-500' : 'text-violet-500',
      bg: smsPercent >= 90 ? 'bg-red-50' : smsPercent >= 70 ? 'bg-orange-50' : 'bg-violet-50',
      progress: smsPercent,
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          whileHover={{ y: -2 }}
        >
          <Card className="shadow-sm hover:shadow-md transition-shadow border border-gray-100">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
              <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
              {'progress' in card && (
                <div className="mt-2 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      card.progress >= 90 ? 'bg-red-500' : card.progress >= 70 ? 'bg-orange-500' : 'bg-violet-500'
                    }`}
                    style={{ width: `${card.progress}%` }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
