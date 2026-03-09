"use client"
import { useState, useEffect } from 'react'
import { Plus, Send, Loader2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { formatDateTime } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'
import type { Campaign, Business } from '@/types'

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [business, setBusiness] = useState<Business | null>(null)
  const [customerCount, setCustomerCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<{ name: string; method: 'sms' | 'email' | 'both' }>({ name: '', method: 'sms' })

  const fetchData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: biz } = await supabase.from('businesses').select('*').eq('user_id', user.id).single()
    setBusiness(biz)
    if (biz) {
      const { data: camp } = await supabase.from('campaigns').select('*').eq('business_id', biz.id).order('created_at', { ascending: false })
      setCampaigns((camp || []) as Campaign[])
      const { count } = await supabase.from('customers').select('*', { count: 'exact', head: true }).eq('business_id', biz.id)
      setCustomerCount(count || 0)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleCreate = async () => {
    if (!business || !form.name.trim()) return
    setCreating(true)
    try {
      const supabase = createClient()
      await supabase.from('campaigns').insert({
        business_id: business.id,
        name: form.name,
        method: form.method,
        status: 'draft',
        total_recipients: customerCount,
      })
      toast({ title: 'Campagne créée ✅' })
      setOpen(false)
      setForm({ name: '', method: 'sms' })
      fetchData()
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de créer la campagne', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const handleSendCampaign = async (campaignId: string) => {
    try {
      const res = await fetch('/api/send-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId }),
      })
      if (res.ok) {
        toast({ title: 'Campagne lancée 🚀', description: 'Les messages sont en cours d\'envoi' })
        fetchData()
      }
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de lancer la campagne', variant: 'destructive' })
    }
  }

  const statusBadge: Record<string, string> = {
    draft: 'secondary',
    scheduled: 'warning',
    sending: 'default',
    completed: 'success',
  }

  const statusLabel: Record<string, string> = {
    draft: 'Brouillon',
    scheduled: 'Planifiée',
    sending: '⏳ En cours',
    completed: '✅ Terminée',
  }

  return (
    <div className="space-y-6">
      <Toaster />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campagnes</h1>
          <p className="text-gray-500 text-sm">Envoyez des demandes d'avis en masse</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="gradient">
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle campagne
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une campagne</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>Nom de la campagne</Label>
                <Input
                  placeholder="Ex: Relance clients décembre"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Méthode d'envoi</Label>
                <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v as 'sms' | 'email' | 'both' })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sms">📱 SMS</SelectItem>
                    <SelectItem value="email">✉️ Email</SelectItem>
                    <SelectItem value="both">📱✉️ SMS + Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-blue-700 text-sm font-medium mb-1">
                  <Users className="w-4 h-4" />
                  {customerCount} destinataires
                </div>
                <p className="text-xs text-blue-600">Tous vos clients seront inclus dans cette campagne</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Annuler</Button>
                <Button variant="gradient" className="flex-1" onClick={handleCreate} disabled={creating}>
                  {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Créer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {campaigns.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Send className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>Aucune campagne créée</p>
            <p className="text-sm mt-1">Créez votre première campagne pour envoyer des demandes en masse</p>
          </div>
        ) : (
          campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                      <Badge variant={statusBadge[campaign.status] as never}>{statusLabel[campaign.status]}</Badge>
                      <Badge variant="outline">{campaign.method === 'sms' ? '📱 SMS' : campaign.method === 'email' ? '✉️ Email' : '📱✉️ Les deux'}</Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      {campaign.sent_count}/{campaign.total_recipients} envoyés · Créée le {formatDateTime(campaign.created_at)}
                    </p>
                  </div>
                  {campaign.status === 'draft' && (
                    <Button variant="gradient" size="sm" onClick={() => handleSendCampaign(campaign.id)}>
                      <Send className="w-3 h-3 mr-2" />
                      Lancer
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
