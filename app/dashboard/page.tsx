"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import StatsCards from '@/components/dashboard/StatsCards'
import ReviewChart from '@/components/dashboard/ReviewChart'
import RecentActivity from '@/components/dashboard/RecentActivity'
import OnboardingBanner from '@/components/onboarding/OnboardingBanner'
import type { Business } from '@/types'

interface RecentActivityItem {
  id: string
  status: string
  method: string
  created_at: string
  customer?: { name: string } | null
}

export default function DashboardPage() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [stats, setStats] = useState({ sent: 0, reviewed: 0, feedbacks: 0, smsUsed: 0, smsLimit: 50 })
  const [chartData, setChartData] = useState<{ date: string; avis: number; feedbacks: number }[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: biz } = await supabase.from('businesses').select('*').eq('user_id', user.id).single()
      setBusiness(biz)

      if (biz) {
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)

        // Récupérer les 7 derniers jours pour le graphique
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
        sevenDaysAgo.setHours(0, 0, 0, 0)

        const [
          { count: sent },
          { count: reviewed },
          { count: feedbacks },
          { data: recent },
          { data: chartRequests },
        ] = await Promise.all([
          supabase.from('review_requests').select('*', { count: 'exact', head: true })
            .eq('business_id', biz.id).not('status', 'eq', 'pending')
            .gte('created_at', startOfMonth.toISOString()),
          supabase.from('review_requests').select('*', { count: 'exact', head: true })
            .eq('business_id', biz.id).eq('status', 'reviewed')
            .gte('created_at', startOfMonth.toISOString()),
          supabase.from('private_feedbacks').select('*', { count: 'exact', head: true })
            .eq('business_id', biz.id).eq('is_read', false),
          supabase.from('review_requests')
            .select('*, customer:customers(name)')
            .eq('business_id', biz.id)
            .order('created_at', { ascending: false }).limit(8),
          // Récupérer les vraies données pour le graphique
          supabase.from('review_requests')
            .select('status, created_at')
            .eq('business_id', biz.id)
            .gte('created_at', sevenDaysAgo.toISOString())
            .in('status', ['reviewed', 'feedback']),
        ])

        setStats({
          sent: sent || 0,
          reviewed: reviewed || 0,
          feedbacks: feedbacks || 0,
          smsUsed: biz.monthly_sms_used || 0,
          smsLimit: biz.monthly_sms_limit || 50,
        })
        setRecentActivity((recent || []) as unknown as RecentActivityItem[])

        // Construire le graphique avec de vraies données
        const chart = Array.from({ length: 7 }, (_, i) => {
          const d = new Date()
          d.setDate(d.getDate() - (6 - i))
          const label = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
          const dayStr = d.toISOString().slice(0, 10)

          const dayAvis = (chartRequests || []).filter(r =>
            r.status === 'reviewed' && r.created_at.slice(0, 10) === dayStr
          ).length
          const dayFeedbacks = (chartRequests || []).filter(r =>
            r.status === 'feedback' && r.created_at.slice(0, 10) === dayStr
          ).length

          return { date: label, avis: dayAvis, feedbacks: dayFeedbacks }
        })
        setChartData(chart)
      }
      setLoading(false)
    }
    fetchAll()
  }, [])

  return (
    <div className="space-y-6">
      {business && <OnboardingBanner businessId={business.id} />}

      <StatsCards
        sent={stats.sent}
        reviewed={stats.reviewed}
        feedbacks={stats.feedbacks}
        smsUsed={stats.smsUsed}
        smsLimit={stats.smsLimit}
        loading={loading}
      />

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <ReviewChart data={chartData} />
        </div>
        <div className="lg:col-span-2">
          <RecentActivity activities={recentActivity} loading={loading} />
        </div>
      </div>
    </div>
  )
}
