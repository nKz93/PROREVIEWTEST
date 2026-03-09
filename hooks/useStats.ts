"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { calculateRate } from '@/lib/utils'
import type { DashboardStats } from '@/types'

export function useStats(businessId: string | undefined) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!businessId) { setLoading(false); return }

    const fetchStats = async () => {
      const supabase = createClient()
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
      thirtyDaysAgo.setHours(0, 0, 0, 0)

      const [
        { count: sent },
        { count: clicked },
        { count: reviewed },
        { data: business },
        { data: chartData },
        { data: feedbackScores },
      ] = await Promise.all([
        supabase.from('review_requests').select('*', { count: 'exact', head: true })
          .eq('business_id', businessId).not('status', 'eq', 'pending')
          .gte('created_at', startOfMonth.toISOString()),
        supabase.from('review_requests').select('*', { count: 'exact', head: true })
          .eq('business_id', businessId).in('status', ['clicked', 'reviewed', 'feedback'])
          .gte('created_at', startOfMonth.toISOString()),
        supabase.from('review_requests').select('*', { count: 'exact', head: true })
          .eq('business_id', businessId).eq('status', 'reviewed')
          .gte('created_at', startOfMonth.toISOString()),
        supabase.from('businesses').select('monthly_sms_used, monthly_sms_limit')
          .eq('id', businessId).single(),
        // Vraies données du graphique 30 jours
        supabase.from('review_requests').select('status, created_at')
          .eq('business_id', businessId)
          .gte('created_at', thirtyDaysAgo.toISOString())
          .in('status', ['reviewed', 'feedback']),
        // Score moyen réel depuis les feedbacks
        supabase.from('private_feedbacks').select('score')
          .eq('business_id', businessId).limit(100),
      ])

      // Construire le graphique avec de vraies données
      const chart = Array.from({ length: 30 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (29 - i))
        const label = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
        const dayStr = d.toISOString().slice(0, 10)

        const dayAvis = (chartData || []).filter(r =>
          r.status === 'reviewed' && r.created_at.slice(0, 10) === dayStr
        ).length
        const dayFeedbacks = (chartData || []).filter(r =>
          r.status === 'feedback' && r.created_at.slice(0, 10) === dayStr
        ).length

        return { date: label, avis: dayAvis, feedbacks: dayFeedbacks }
      })

      // Score moyen réel (depuis les feedbacks privés)
      const scores = (feedbackScores || []).map(f => f.score).filter(Boolean)
      const averageScore = scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
        : 0

      setStats({
        totalRequestsSent: sent || 0,
        clickRate: calculateRate(clicked || 0, sent || 0),
        googleReviewsObtained: reviewed || 0,
        averageScore,
        smsUsed: business?.monthly_sms_used || 0,
        smsLimit: business?.monthly_sms_limit || 50,
        recentActivity: [],
        chartData: chart,
      })
      setLoading(false)
    }

    fetchStats()
  }, [businessId])

  return { stats, loading }
}
