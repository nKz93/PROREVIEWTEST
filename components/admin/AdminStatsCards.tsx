"use client"
import { motion } from 'framer-motion'
import { Building2, Users, Star, TrendingUp, DollarSign } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

interface AdminStatsCardsProps {
  totalBusinesses: number
  totalCustomers: number
  totalReviews: number
  mrr: number
  totalRevenue: number
}

export default function AdminStatsCards({ totalBusinesses, totalCustomers, totalReviews, mrr, totalRevenue }: AdminStatsCardsProps) {
  const cards = [
    {
      label: 'Commerces actifs',
      value: totalBusinesses.toLocaleString('fr-FR'),
      icon: Building2,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Clients total',
      value: totalCustomers.toLocaleString('fr-FR'),
      icon: Users,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
    },
    {
      label: 'Avis Google collectés',
      value: totalReviews.toLocaleString('fr-FR'),
      icon: Star,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
    },
    {
      label: 'MRR (revenus mensuels)',
      value: formatCurrency(mrr),
      icon: TrendingUp,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
    },
    {
      label: 'Revenus total cumulés',
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
        >
          <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
            <CardContent className="p-5">
              <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <p className="text-2xl font-bold text-white">{card.value}</p>
              <p className="text-xs text-gray-500 mt-1">{card.label}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
