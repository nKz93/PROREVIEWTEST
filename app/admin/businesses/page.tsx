"use client"
import { useState, useEffect } from 'react'
import { Search, Filter, Building2, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import AdminTopBar from '@/components/admin/AdminTopBar'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import type { AdminBusiness } from '@/types/admin'
import { formatDate } from '@/lib/utils'

const planColors: Record<string, string> = {
  free: 'bg-gray-700 text-gray-300',
  starter: 'bg-blue-500/20 text-blue-400',
  pro: 'bg-violet-500/20 text-violet-400',
  business: 'bg-orange-500/20 text-orange-400',
}

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<AdminBusiness[]>([])
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false })
      setBusinesses(data || [])
      setLoading(false)
    }
    fetch()
  }, [])

  const filtered = businesses.filter((b) => {
    const matchSearch =
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.email.toLowerCase().includes(search.toLowerCase())
    const matchPlan = planFilter === 'all' || b.plan === planFilter
    return matchSearch && matchPlan
  })

  return (
    <div>
      <AdminTopBar title="Commerces" subtitle={`${businesses.length} commerces inscrits`} />
      <div className="p-6 space-y-4">
        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Rechercher par nom ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="w-40 bg-gray-900 border-gray-700 text-white">
              <SelectValue placeholder="Tous les plans" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700">
              <SelectItem value="all">Tous les plans</SelectItem>
              <SelectItem value="free">Gratuit</SelectItem>
              <SelectItem value="starter">Starter</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="business">Business</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Chargement...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      {['Commerce', 'Type', 'Plan', 'SMS', 'Clients', 'Inscrit le', 'Actions'].map((h) => (
                        <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {filtered.map((biz) => (
                      <tr key={biz.id} className="hover:bg-gray-800/40 transition-colors group">
                        <td className="px-5 py-3">
                          <p className="text-sm font-medium text-white">{biz.name}</p>
                          <p className="text-xs text-gray-500">{biz.email}</p>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs text-gray-400 capitalize">{biz.business_type || ""}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${planColors[biz.plan]}`}>
                            {biz.plan}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs text-gray-400">
                            {biz.monthly_sms_used}/{biz.monthly_sms_limit}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs text-gray-400">—</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs text-gray-500">{formatDate(biz.created_at)}</span>
                        </td>
                        <td className="px-5 py-3">
                          <Link
                            href={`/admin/businesses/${biz.id}`}
                            className="text-xs text-orange-400 hover:text-orange-300 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Gérer →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>Aucun commerce trouvé</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
