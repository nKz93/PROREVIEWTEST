"use client"
import { useState, useEffect } from 'react'
import AdminTopBar from '@/components/admin/AdminTopBar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import type { AdminBroadcast } from '@/types/admin'
import { toast } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { Send, Loader2, Users, MailCheck } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

const ALL_PLANS = ['free', 'starter', 'pro', 'business']

export default function AdminBroadcastPage() {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [targetPlans, setTargetPlans] = useState<string[]>(['free', 'starter', 'pro', 'business'])
  const [sending, setSending] = useState(false)
  const [history, setHistory] = useState<AdminBroadcast[]>([])
  const [previewCount, setPreviewCount] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const [{ data: hist }, { count }] = await Promise.all([
        supabase.from('admin_broadcasts').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('businesses').select('*', { count: 'exact', head: true }).in('plan', targetPlans),
      ])
      setHistory(hist || [])
      setPreviewCount(count || 0)
    }
    fetchData()
  }, [targetPlans])

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast({ title: 'Remplissez le sujet et le message', variant: 'destructive' })
      return
    }
    if (!confirm(`Envoyer cet email à ~${previewCount} commerçants ?`)) return

    setSending(true)
    try {
      const supabase = createClient()
      const { data: broadcast } = await supabase.from('admin_broadcasts').insert({
        subject, body,
        target_plans: targetPlans,
        status: 'sending',
      }).select().single()

      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body, targetPlans, broadcastId: broadcast?.id }),
      })
      const data = await res.json()

      if (data.success) {
        toast({ title: `✅ Broadcast envoyé à ${data.sent} destinataires` })
        setSubject('')
        setBody('')
        // Refresh history
        const { data: hist } = await supabase.from('admin_broadcasts').select('*').order('created_at', { ascending: false }).limit(10)
        setHistory(hist || [])
      }
    } catch {
      toast({ title: 'Erreur lors de l\'envoi', variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <Toaster />
      <AdminTopBar title="Email Broadcast" subtitle="Envoyer un email à tous vos utilisateurs" />
      <div className="p-6 space-y-6">
        <div className="grid lg:grid-cols-2 gap-6">

          {/* Éditeur */}
          <div className="space-y-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-orange-400" />
                  Composer l'email
                </CardTitle>
                <CardDescription className="text-gray-500">Variables disponibles : {'{name}'}, {'{plan}'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-400">Sujet</Label>
                  <Input
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="🎉 Nouvelle fonctionnalité disponible !"
                    className="mt-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-600"
                  />
                </div>
                <div>
                  <Label className="text-gray-400">Corps du message</Label>
                  <Textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    placeholder="Bonjour {name},&#10;&#10;Votre message ici..."
                    className="mt-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 font-mono text-sm"
                    rows={10}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Ciblage */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  Cibler les plans
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  {ALL_PLANS.map(plan => (
                    <button
                      key={plan}
                      onClick={() => setTargetPlans(prev =>
                        prev.includes(plan) ? prev.filter(p => p !== plan) : [...prev, plan]
                      )}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium capitalize transition-all ${
                        targetPlans.includes(plan)
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      {plan}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  ≈ <span className="text-orange-400 font-bold">{previewCount}</span> destinataires
                </p>
              </CardContent>
            </Card>

            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white h-12 text-base font-semibold"
              onClick={handleSend}
              disabled={sending || !subject.trim() || !body.trim()}
            >
              {sending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Send className="w-5 h-5 mr-2" />}
              {sending ? 'Envoi en cours...' : `Envoyer à ${previewCount} commerçants`}
            </Button>
          </div>

          {/* Historique */}
          <div>
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MailCheck className="w-4 h-4 text-green-400" />
                  Historique des broadcasts
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {history.length === 0 ? (
                  <p className="text-center text-gray-600 text-sm py-8">Aucun broadcast envoyé</p>
                ) : (
                  <div className="divide-y divide-gray-800">
                    {history.map(item => (
                      <div key={item.id} className="p-4 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-white truncate pr-4">{item.subject}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                            item.status === 'sent' ? 'bg-green-500/20 text-green-400' :
                            item.status === 'sending' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-gray-700 text-gray-400'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{item.sent_count} envoyés</span>
                          <span>·</span>
                          <span>Plans : {item.target_plans.join(', ')}</span>
                        </div>
                        <p className="text-xs text-gray-600">{formatDateTime(item.created_at)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
