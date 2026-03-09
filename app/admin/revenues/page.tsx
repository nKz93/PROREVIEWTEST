"use client"
import { useState, useEffect } from 'react'
import AdminTopBar from '@/components/admin/AdminTopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import type { AdminInvoice } from '@/types/admin'
import { formatDate, formatCurrency, formatDateTime } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, Receipt } from 'lucide-react'

export default function AdminRevenuesPage() {
  const [invoices, setInvoices] = useState<AdminInvoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('invoices')
        .select('*, business:businesses(name, email)')
        .order('created_at', { ascending: false })
        .limit(100)
      setInvoices(data || [])
      setLoading(false)
    }
    fetch()
  }, [])

  const paid = invoices.filter(inv => inv.status === 'paid')
  const totalRevenue = paid.reduce((acc, inv) => acc + (inv.amount_cents), 0)

  // Revenus par mois
  const byMonth: Record<string, number> = {}
  for (let i = 11; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const key = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
    byMonth[key] = 0
  }
  paid.forEach(inv => {
    const d = new Date(inv.created_at)
    const key = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
    if (key in byMonth) byMonth[key] += (inv.amount_cents) / 100
  })
  const chartData = Object.entries(byMonth).map(([month, revenue]) => ({ month, revenue }))

  return (
    <div>
      <AdminTopBar title="Revenus" subtitle="Historique des paiements et facturation" />
      <div className="p-6 space-y-6">

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-5">
              <p className="text-3xl font-bold text-white">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-gray-500 mt-1">Revenus totaux</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-5">
              <p className="text-3xl font-bold text-white">{paid.length}</p>
              <p className="text-xs text-gray-500 mt-1">Factures payées</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-5">
              <p className="text-3xl font-bold text-white">
                {paid.length > 0 ? formatCurrency(totalRevenue / paid.length) : '0€'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Panier moyen</p>
            </CardContent>
          </Card>
        </div>

        {/* Graphique 12 mois */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-400" />
              Revenus sur 12 mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => `${v}€`} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
                  formatter={(v: number) => [`${v.toFixed(2)}€`, 'Revenus']}
                />
                <Bar dataKey="revenue" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Table factures */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-orange-400" />
              Historique des factures
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Chargement...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      {['Commerce', 'Montant', 'Statut', 'Stripe Invoice', 'Date'].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {invoices.map((inv) => {
                      const biz = inv.business
                      return (
                        <tr key={inv.id} className="hover:bg-gray-800/40">
                          <td className="px-5 py-3">
                            <p className="text-sm font-medium text-white">{biz?.name || '—'}</p>
                            <p className="text-xs text-gray-500">{biz?.email || ''}</p>
                          </td>
                          <td className="px-5 py-3">
                            <span className="text-sm font-bold text-white">
                              {formatCurrency(inv.amount_cents)}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              inv.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {inv.status === 'paid' ? '✓ Payée' : 'En attente'}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            {inv.stripe_invoice_id ? (
                              <span className="text-xs text-gray-500 font-mono">
                                {(inv.stripe_invoice_id || "").slice(0, 14)}...
                              </span>
                            ) : <span className="text-xs text-gray-600">—</span>}
                          </td>
                          <td className="px-5 py-3">
                            <span className="text-xs text-gray-500">{formatDateTime(inv.created_at)}</span>
                          </td>
                        </tr>
                      )
                    })}
                    {invoices.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-gray-500 text-sm">Aucune facture</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
