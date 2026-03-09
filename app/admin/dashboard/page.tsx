import { createAdminClient } from '@/lib/supabase/server'
import AdminTopBar from '@/components/admin/AdminTopBar'
import AdminStatsCards from '@/components/admin/AdminStatsCards'
import AdminRevenueChart from '@/components/admin/AdminRevenueChart'
import AdminPlanBreakdown from '@/components/admin/AdminPlanBreakdown'
import AdminRecentBusinesses from '@/components/admin/AdminRecentBusinesses'

export default async function AdminDashboardPage() {
  const supabase = createAdminClient()

  const [
    { count: totalBusinesses },
    { count: totalCustomers },
    { count: totalReviews },
    { data: businesses },
    { data: invoices },
  ] = await Promise.all([
    supabase.from('businesses').select('*', { count: 'exact', head: true }),
    supabase.from('customers').select('*', { count: 'exact', head: true }),
    supabase.from('review_requests').select('*', { count: 'exact', head: true }).eq('status', 'reviewed'),
    supabase.from('businesses').select('plan, created_at').order('created_at', { ascending: false }),
    supabase.from('invoices').select('amount_cents, created_at, status'),
  ])

  const planPrices: Record<string, number> = { starter: 2900, pro: 5900, business: 9900 }
  const mrr = (businesses || []).reduce((acc, b) => acc + (planPrices[b.plan] || 0), 0)

  const planCounts = (businesses || []).reduce((acc: Record<string, number>, b) => {
    acc[b.plan] = (acc[b.plan] || 0) + 1
    return acc
  }, {})
  const planBreakdown = Object.entries(planCounts).map(([plan, count]) => ({ plan, count }))

  const revenueByMonth: Record<string, number> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const key = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
    revenueByMonth[key] = 0
  }
  ;(invoices || []).filter(i => i.status === 'paid').forEach((inv) => {
    const d = new Date(inv.created_at)
    const key = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
    if (key in revenueByMonth) revenueByMonth[key] += inv.amount_cents
  })
  const revenueChartData = Object.entries(revenueByMonth).map(([month, revenue]) => ({ month, revenue: revenue / 100 }))

  const { data: recentBusinesses } = await supabase
    .from('businesses')
    .select('id, name, email, plan, business_type, created_at, monthly_sms_used, monthly_sms_limit')
    .order('created_at', { ascending: false })
    .limit(10)

  const totalRevenue = (invoices || []).filter(i => i.status === 'paid').reduce((acc, inv) => acc + inv.amount_cents, 0)

  return (
    <div>
      <AdminTopBar title="Vue globale" subtitle="Statistiques en temps réel de la plateforme" />
      <div className="p-6 space-y-6">
        <AdminStatsCards
          totalBusinesses={totalBusinesses || 0}
          totalCustomers={totalCustomers || 0}
          totalReviews={totalReviews || 0}
          mrr={mrr}
          totalRevenue={totalRevenue}
        />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AdminRevenueChart data={revenueChartData} />
          </div>
          <AdminPlanBreakdown data={planBreakdown} total={totalBusinesses || 0} />
        </div>
        <AdminRecentBusinesses businesses={recentBusinesses || []} />
      </div>
    </div>
  )
}
