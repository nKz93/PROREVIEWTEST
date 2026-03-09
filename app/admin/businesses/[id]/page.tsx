"use client"
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save, Trash2, Send, RefreshCw, Loader2, ExternalLink, CreditCard } from 'lucide-react'
import Link from 'next/link'
import AdminTopBar from '@/components/admin/AdminTopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import type { AdminBusiness, AdminReviewRequest } from '@/types/admin'
import { formatDate, formatDateTime } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'

const PLAN_OPTIONS = ['free', 'starter', 'pro', 'business']
const PLAN_SMS: Record<string, number> = { free: 50, starter: 100, pro: 500, business: 2000 }

export default function AdminBusinessDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [business, setBusiness] = useState<AdminBusiness | null>(null)
  const [stats, setStats] = useState({ customers: 0, requests: 0, reviews: 0, feedbacks: 0 })
  const [recentRequests, setRecentRequests] = useState<AdminReviewRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchAll = async () => {
      const supabase = createClient()

      const [
        { data: biz },
        { count: customers },
        { count: requests },
        { count: reviews },
        { count: feedbacks },
        { data: recent },
      ] = await Promise.all([
        supabase.from('businesses').select('*').eq('id', id).single(),
        supabase.from('customers').select('*', { count: 'exact', head: true }).eq('business_id', id),
        supabase.from('review_requests').select('*', { count: 'exact', head: true }).eq('business_id', id),
        supabase.from('review_requests').select('*', { count: 'exact', head: true }).eq('business_id', id).eq('status', 'reviewed'),
        supabase.from('private_feedbacks').select('*', { count: 'exact', head: true }).eq('business_id', id),
        supabase.from('review_requests')
          .select('*, customer:customers(name)')
          .eq('business_id', id)
          .order('created_at', { ascending: false })
          .limit(10),
      ])

      setBusiness(biz)
      setStats({ customers: customers || 0, requests: requests || 0, reviews: reviews || 0, feedbacks: feedbacks || 0 })
      setRecentRequests(recent || [])
      setLoading(false)
    }
    fetchAll()
  }, [id])

  const handleSave = async () => {
    if (!business) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('businesses')
      .update({
        name: business.name,
        email: business.email,
        plan: business.plan,
        monthly_sms_limit: PLAN_SMS[business.plan] || 50,
        monthly_sms_used: business.monthly_sms_used,
        google_review_url: business.google_review_url,
      })
      .eq('id', id)

    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Sauvegardé ✅', description: 'Les modifications ont été enregistrées' })
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirm(`Supprimer définitivement le commerce "${business?.name}" ? Cette action est irréversible.`)) return
    const supabase = createClient()
    await supabase.from('businesses').delete().eq('id', id)
    toast({ title: 'Commerce supprimé' })
    router.push('/admin/businesses')
  }

  const handleResetSMS = async () => {
    const supabase = createClient()
    await supabase.from('businesses').update({ monthly_sms_used: 0 }).eq('id', id)
    setBusiness((prev) => prev ? { ...prev, monthly_sms_used: 0 } : prev)
    toast({ title: 'Compteur SMS réinitialisé ✅' })
  }

  if (loading || !business) {
    return (
      <div>
        <AdminTopBar title="Chargement..." />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
        </div>
      </div>
    )
  }

  const smsPercent = Math.min(100, Math.round(((business.monthly_sms_used) / (business.monthly_sms_limit)) * 100))

  return (
    <div>
      <Toaster />
      <AdminTopBar title={business.name} subtitle={business.email} />
      <div className="p-6 space-y-6">
        {/* Retour + actions */}
        <div className="flex items-center justify-between">
          <Link href="/admin/businesses" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm">
            <ArrowLeft className="w-4 h-4" />
            Retour aux commerces
          </Link>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-red-800 text-red-400 hover:bg-red-950"
              onClick={handleDelete}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Supprimer
            </Button>
            <Button
              size="sm"
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
              Sauvegarder
            </Button>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Clients', value: stats.customers },
            { label: 'Demandes envoyées', value: stats.requests },
            { label: 'Avis Google', value: stats.reviews },
            { label: 'Feedbacks privés', value: stats.feedbacks },
          ].map((s, i) => (
            <Card key={i} className="bg-gray-900 border-gray-800">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Informations du commerce */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-gray-400">Nom du commerce</Label>
                <Input
                  value={business.name}
                  onChange={(e) => setBusiness({ ...business, name: e.target.value })}
                  className="mt-1 bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-400">Email</Label>
                <Input
                  value={business.email}
                  onChange={(e) => setBusiness({ ...business, email: e.target.value })}
                  className="mt-1 bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-400">URL Google Reviews</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={(business.google_review_url || "") || ''}
                    onChange={(e) => setBusiness({ ...business, google_review_url: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="https://g.page/..."
                  />
                  {!!(business.google_review_url || "") && (
                    <a href={business.google_review_url || ""} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="icon" className="border-gray-700 text-gray-400 hover:text-white">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </a>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-gray-400">Inscrit le</Label>
                <p className="text-sm text-gray-300 mt-1">{formatDateTime(business.created_at)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Abonnement & SMS */}
          <div className="space-y-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-orange-400" />
                  Abonnement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-400">Plan actuel</Label>
                  <Select
                    value={business.plan}
                    onValueChange={(v) => setBusiness({ ...business, plan: v as AdminBusiness['plan'], monthly_sms_limit: PLAN_SMS[v] })}
                  >
                    <SelectTrigger className="mt-1 bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      {PLAN_OPTIONS.map((p) => (
                        <SelectItem key={p} value={p} className="text-white">
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {!!(business.stripe_customer_id || "") && (
                  <div>
                    <Label className="text-gray-400">Stripe Customer ID</Label>
                    <p className="text-xs text-gray-500 mt-1 font-mono">{business.stripe_customer_id || ""}</p>
                  </div>
                )}
                {!!(business.stripe_subscription_id || "") && (
                  <div>
                    <Label className="text-gray-400">Stripe Subscription ID</Label>
                    <p className="text-xs text-gray-500 mt-1 font-mono">{business.stripe_subscription_id || ""}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-blue-400" />
                  Quota SMS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Utilisés ce mois</span>
                  <span className="text-white font-bold">
                    {business.monthly_sms_used} / {business.monthly_sms_limit}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${smsPercent >= 90 ? 'bg-red-500' : smsPercent >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${smsPercent}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-gray-400 text-xs">Modifier le quota</Label>
                    <Input
                      type="number"
                      value={business.monthly_sms_limit}
                      onChange={(e) => setBusiness({ ...business, monthly_sms_limit: parseInt(e.target.value) })}
                      className="mt-1 bg-gray-800 border-gray-700 text-white h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-400 text-xs">SMS utilisés</Label>
                    <Input
                      type="number"
                      value={business.monthly_sms_used}
                      onChange={(e) => setBusiness({ ...business, monthly_sms_used: parseInt(e.target.value) })}
                      className="mt-1 bg-gray-800 border-gray-700 text-white h-8 text-sm"
                    />
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-gray-700 text-gray-400 hover:text-white hover:border-gray-600"
                  onClick={handleResetSMS}
                >
                  <RefreshCw className="w-3 h-3 mr-2" />
                  Réinitialiser le compteur SMS
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Dernières demandes d'avis */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Dernières demandes d'avis</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    {['Client', 'Méthode', 'Statut', 'Date'].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {recentRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-800/40">
                      <td className="px-5 py-2.5 text-sm text-gray-300">
                        {req.customer?.name || 'Client inconnu'}
                      </td>
                      <td className="px-5 py-2.5 text-xs text-gray-500 uppercase">{req.method}</td>
                      <td className="px-5 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          req.status === 'reviewed' ? 'bg-green-500/20 text-green-400' :
                          req.status === 'feedback' ? 'bg-red-500/20 text-red-400' :
                          req.status === 'sent' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-gray-700 text-gray-400'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-xs text-gray-500">
                        {formatDateTime(req.created_at)}
                      </td>
                    </tr>
                  ))}
                  {recentRequests.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-gray-500 text-sm">Aucune demande envoyée</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
