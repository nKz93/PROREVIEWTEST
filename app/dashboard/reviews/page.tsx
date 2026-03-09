import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDateTime } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star } from 'lucide-react'

export default async function ReviewsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!business) redirect('/dashboard')

  const { data: requests } = await supabase
    .from('review_requests')
    .select('*, customer:customers(name, phone, email)')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })
    .limit(100)

  const statusColors: Record<string, string> = {
    pending: 'secondary', sent: 'default', delivered: 'default',
    opened: 'default', clicked: 'default', reviewed: 'default',
    feedback: 'destructive', failed: 'destructive',
  }

  const statusLabels: Record<string, string> = {
    pending: 'En attente', sent: 'Envoyé', delivered: 'Livré',
    opened: 'Ouvert', clicked: 'Cliqué',
    reviewed: '⭐ Avis Google', feedback: '💬 Feedback privé', failed: '❌ Échec',
  }

  const stats = [
    { label: 'Envoyés', count: requests?.filter(r => r.status !== 'pending').length || 0, color: 'blue' },
    { label: 'Cliqués', count: requests?.filter(r => ['clicked','reviewed','feedback'].includes(r.status)).length || 0, color: 'violet' },
    { label: 'Avis Google', count: requests?.filter(r => r.status === 'reviewed').length || 0, color: 'green' },
    { label: 'Feedbacks privés', count: requests?.filter(r => r.status === 'feedback').length || 0, color: 'red' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Avis & Demandes</h1>
        <p className="text-gray-500 text-sm">Historique de toutes vos demandes d'avis</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold gradient-text">{stat.count}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Historique des demandes</CardTitle></CardHeader>
        <CardContent className="p-0">
          {!requests || requests.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>Aucune demande envoyée pour l'instant</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">Client</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3 hidden md:table-cell">Méthode</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">Statut</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3 hidden lg:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3">
                        <span className="font-medium text-sm text-gray-900">
                          {((req.customer as unknown) as { name: string } | null)?.name || 'Client inconnu'}
                        </span>
                      </td>
                      <td className="px-6 py-3 hidden md:table-cell">
                        <Badge variant="outline" className="text-xs">
                          {req.method === 'sms' ? '📱 SMS' : '✉️ Email'}
                        </Badge>
                      </td>
                      <td className="px-6 py-3">
                        <Badge variant={statusColors[req.status] as never} className="text-xs">
                          {statusLabels[req.status] || req.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-xs text-gray-500 hidden lg:table-cell">
                        {formatDateTime(req.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
