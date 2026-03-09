"use client"
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { ExternalLink } from 'lucide-react'

interface Business {
  id: string
  name: string
  email: string
  plan: string
  business_type: string
  created_at: string
  monthly_sms_used: number
  monthly_sms_limit: number
}

interface AdminRecentBusinessesProps {
  businesses: Business[]
}

const planColors: Record<string, string> = {
  free: 'secondary',
  starter: 'default',
  pro: 'gradient',
  business: 'warning',
}

const planLabels: Record<string, string> = {
  free: 'Gratuit',
  starter: 'Starter',
  pro: 'Pro',
  business: 'Business',
}

export default function AdminRecentBusinesses({ businesses }: AdminRecentBusinessesProps) {
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white text-lg">Derniers commerces inscrits</CardTitle>
        <Link href="/admin/businesses" className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1">
          Voir tous <ExternalLink className="w-3 h-3" />
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">Commerce</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3 hidden md:table-cell">Type</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">Plan</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3 hidden lg:table-cell">SMS</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3 hidden md:table-cell">Inscrit le</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {businesses.map((biz) => (
                <tr key={biz.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-3">
                    <p className="text-sm font-medium text-white">{biz.name}</p>
                    <p className="text-xs text-gray-500">{biz.email}</p>
                  </td>
                  <td className="px-6 py-3 hidden md:table-cell">
                    <span className="text-xs text-gray-400 capitalize">{biz.business_type}</span>
                  </td>
                  <td className="px-6 py-3">
                    <Badge
                      className={biz.plan === 'pro' ? 'bg-violet-500/20 text-violet-400 border-violet-500/30' :
                        biz.plan === 'business' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                        biz.plan === 'starter' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                        'bg-gray-700 text-gray-400'}
                      variant="outline"
                    >
                      {planLabels[biz.plan]}
                    </Badge>
                  </td>
                  <td className="px-6 py-3 hidden lg:table-cell">
                    <div className="flex items-center gap-1">
                      <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-500 rounded-full"
                          style={{ width: `${Math.min(100, (biz.monthly_sms_used / biz.monthly_sms_limit) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{biz.monthly_sms_used}/{biz.monthly_sms_limit}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 hidden md:table-cell">
                    <span className="text-xs text-gray-500">{formatDate(biz.created_at)}</span>
                  </td>
                  <td className="px-6 py-3">
                    <Link
                      href={`/admin/businesses/${biz.id}`}
                      className="text-xs text-orange-400 hover:text-orange-300 font-medium"
                    >
                      Gérer →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
