"use client"
import { useState, useEffect } from 'react'
import AdminTopBar from '@/components/admin/AdminTopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import type { AdminBusiness } from '@/types/admin'
import { formatDate, formatCurrency } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { CreditCard, TrendingUp, Loader2 } from 'lucide-react'

const PLAN_PRICES: Record<string, number> = { free: 0, starter: 2900, pro: 5900, business: 9900 }

export default function AdminSubscriptionsPage() {
  const [businesses, setBusinesses] = useState<AdminBusiness[]>([])
  const [loading, setLoading] = useState(true)
  const [changingPlan, setChangingPlan] = useState<string | null>(null)

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('businesses')
        .select('id, name, email, plan, stripe_customer_id, stripe_subscription_id, created_at, monthly_sms_used, monthly_sms_limit')
        .order('plan', { ascending: false })
      setBusinesses(data || [])
      setLoading(false)
    }
    fetch()
  }, [])

  const handleChangePlan = async (businessId: string, newPlan: AdminBusiness['plan']) => {
    setChangingPlan(businessId)
    const supabase = createClient()
    const planSMS: Record<string, number> = { free: 50, starter: 100, pro: 500, business: 2000 }
    const { error } = await supabase
      .from('businesses')
      .update({ plan: newPlan, monthly_sms_limit: planSMS[newPlan] || 50 })
      .eq('id', businessId)

    if (!error) {
      setBusinesses(prev => prev.map(b =>
        b.id === businessId ? { ...b, plan: newPlan, monthly_sms_limit: planSMS[newPlan] } : b
      ))
      toast({ title: 'Plan modifié ✅', description: `Plan mis à jour vers ${newPlan}` })
    } else {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    }
    setChangingPlan(null)
  }

  const mrr = businesses.reduce((acc, b) => acc + (PLAN_PRICES[b.plan] || 0), 0)
  const paying = businesses.filter(b => b.plan !== 'free').length

  const planBreakdown = ['free', 'starter', 'pro', 'business'].map(plan => ({
    plan,
    count: businesses.filter(b => b.plan === plan).length,
    revenue: businesses.filter(b => b.plan === plan).reduce((acc, _) => acc + (PLAN_PRICES[plan] || 0), 0),
  }))

  return (
    <div>
      <Toaster />
      <AdminTopBar title="Abonnements" subtitle="Gérer les plans de tous les commerces" />
      <div className="p-6 space-y-6">

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-white">{formatCurrency(mrr)}</p>
              <p className="text-xs text-gray-500 mt-1">MRR total</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-white">{paying}</p>
              <p className="text-xs text-gray-500 mt-1">Clients payants</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-white">{businesses.length - paying}</p>
              <p className="text-xs text-gray-500 mt-1">Plan gratuit</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-white">
                {businesses.length > 0 ? Math.round((paying / businesses.length) * 100) : 0}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Taux de conversion</p>
            </CardContent>
          </Card>
        </div>

        {/* Breakdown par plan */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {planBreakdown.map((item) => (
            <Card key={item.plan} className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400 capitalize font-medium">{item.plan}</span>
                  <span className="text-lg font-bold text-white">{item.count}</span>
                </div>
                <p className="text-xs text-gray-500">{formatCurrency(item.revenue)}/mois</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table abonnements */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-orange-400" />
              Tous les abonnements
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
                      {['Commerce', 'Plan actuel', 'Changer le plan', 'Stripe', 'SMS', 'Depuis'].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {businesses.map((biz) => (
                      <tr key={biz.id} className="hover:bg-gray-800/40">
                        <td className="px-5 py-3">
                          <p className="text-sm font-medium text-white">{biz.name}</p>
                          <p className="text-xs text-gray-500">{biz.email}</p>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            biz.plan === 'pro' ? 'bg-violet-500/20 text-violet-400' :
                            biz.plan === 'business' ? 'bg-orange-500/20 text-orange-400' :
                            biz.plan === 'starter' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-gray-700 text-gray-400'
                          }`}>
                            {biz.plan}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <Select
                              defaultValue={biz.plan}
                              onValueChange={(v) => handleChangePlan(biz.id, v)}
                              disabled={changingPlan === biz.id}
                            >
                              <SelectTrigger className="w-32 h-7 text-xs bg-gray-800 border-gray-700 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-900 border-gray-700">
                                {['free', 'starter', 'pro', 'business'].map(p => (
                                  <SelectItem key={p} value={p} className="text-white text-xs">{p}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {changingPlan === biz.id && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          {biz.stripe_customer_id ? (
                            <span className="text-xs text-green-400 font-mono truncate max-w-20 block">
                              ✓ {(biz.stripe_customer_id || "").slice(0, 12)}...
                            </span>
                          ) : (
                            <span className="text-xs text-gray-600">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs text-gray-400">
                            {biz.monthly_sms_used}/{biz.monthly_sms_limit}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs text-gray-500">{formatDate(biz.created_at)}</span>
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
    </div>
  )
}
