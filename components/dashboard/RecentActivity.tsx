"use client"
import { Star, Send, MessageSquare, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatRelativeDate } from '@/lib/utils'

interface ActivityItem {
  id: string
  status: string
  method: string
  created_at: string
  customer?: { name: string } | null
}

interface RecentActivityProps {
  activities: ActivityItem[]
  loading?: boolean
}

const statusConfig: Record<string, { icon: typeof Star; color: string; label: string }> = {
  reviewed: { icon: Star, color: 'text-yellow-500 bg-yellow-50', label: 'Avis Google reçu' },
  sent: { icon: Send, color: 'text-blue-500 bg-blue-50', label: 'Demande envoyée' },
  feedback: { icon: MessageSquare, color: 'text-red-500 bg-red-50', label: 'Feedback privé' },
  clicked: { icon: Clock, color: 'text-violet-500 bg-violet-50', label: 'Lien cliqué' },
  pending: { icon: Clock, color: 'text-gray-400 bg-gray-50', label: 'En attente' },
}

export default function RecentActivity({ activities, loading }: RecentActivityProps) {
  if (loading) {
    return (
      <Card className="shadow-sm border border-gray-100 h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-gray-900">Activité récente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm border border-gray-100 h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-gray-900">Activité récente</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Send className="w-6 h-6 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucune activité pour l'instant</p>
            <p className="text-xs mt-1">Envoyez votre première demande d'avis !</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activities.map(item => {
              const config = statusConfig[item.status] || statusConfig.pending
              const Icon = config.icon
              const customerName = item.customer?.name || 'Client inconnu'
              return (
                <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${config.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{config.label}</p>
                    <p className="text-xs text-gray-400 truncate">{customerName} · {item.method === 'sms' ? '📱' : '✉️'}</p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{formatRelativeDate(item.created_at)}</span>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
