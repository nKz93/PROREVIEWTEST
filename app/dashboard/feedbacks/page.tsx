"use client"
import { useState, useEffect, useCallback } from 'react'
import { MessageSquare, Check, CheckCheck, Reply, Send, Loader2, Star, X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { formatRelativeDate } from '@/lib/utils'
import type { PrivateFeedback, Business } from '@/types'

interface FeedbackCustomer {
  name: string
  email: string | null
}

interface FeedbackWithReply extends Omit<PrivateFeedback, 'customer'> {
  reply?: string
  customer?: FeedbackCustomer
}

const CATEGORY_LABELS: Record<string, string> = {
  service: '🙋 Service',
  qualite: '⭐ Qualité',
  attente: '⏱️ Attente',
  proprete: '🧹 Propreté',
  prix: '💰 Prix',
  general: '💬 Général',
  autre: '📌 Autre',
}

export default function FeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackWithReply[]>([])
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'unresolved' | 'replied'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const [sendingReply, setSendingReply] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: biz } = await supabase.from('businesses').select('*').eq('user_id', user.id).single()
    setBusiness(biz)
    if (biz) {
      const { data } = await supabase
        .from('private_feedbacks')
        .select('*, customer:customers(name, email), reply:feedback_replies(message)')
        .eq('business_id', biz.id)
        .order('created_at', { ascending: false })

      const enriched = (data || []).map((f: Record<string, unknown>) => ({
        ...f,
        reply: (f.reply as unknown as Record<string, string>[])?.[0]?.message || null,
        customer: f.customer,
      }))
      setFeedbacks(enriched as FeedbackWithReply[])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleMarkRead = async (id: string) => {
    const supabase = createClient()
    await supabase.from('private_feedbacks').update({ is_read: true }).eq('id', id)
    setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, is_read: true } : f))
  }

  const handleMarkResolved = async (id: string) => {
    const supabase = createClient()
    await supabase.from('private_feedbacks').update({ is_resolved: true, resolved_at: new Date().toISOString() }).eq('id', id)
    setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, is_resolved: true } : f))
    toast({ title: 'Marqué comme résolu ✅' })
  }

  const handleSendReply = async (feedbackId: string) => {
    const message = replyText[feedbackId]?.trim()
    if (!message || !business) return

    const feedback = feedbacks.find(f => f.id === feedbackId)
    if (!feedback?.customer?.email) {
      toast({ title: 'Pas d\'email', description: 'Ce client n\'a pas d\'adresse email', variant: 'destructive' })
      return
    }

    setSendingReply(feedbackId)
    try {
      const supabase = createClient()
      // Enregistrer la réponse
      await supabase.from('feedback_replies').insert({
        feedback_id: feedbackId,
        business_id: business.id,
        message,
      })
      // Envoyer par email
      await fetch('/api/feedback/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: feedback.customer.email,
          customerName: feedback.customer.name,
          businessName: business.name,
          replyMessage: message,
          originalMessage: feedback.message,
        }),
      })
      // Marquer comme lu et résolu
      await supabase.from('private_feedbacks').update({ is_read: true, is_resolved: true, resolved_at: new Date().toISOString() }).eq('id', feedbackId)
      setFeedbacks(prev => prev.map(f => f.id === feedbackId ? { ...f, reply: message, is_read: true, is_resolved: true } : f))
      setReplyText(prev => ({ ...prev, [feedbackId]: '' }))
      setExpandedId(null)
      toast({ title: 'Réponse envoyée ✅', description: `Email envoyé à ${feedback.customer.name}` })
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    } finally {
      setSendingReply(null)
    }
  }

  const filtered = feedbacks.filter(f => {
    if (filter === 'unread') return !f.is_read
    if (filter === 'unresolved') return !f.is_resolved
    if (filter === 'replied') return !!f.reply
    return true
  })

  const unreadCount = feedbacks.filter(f => !f.is_read).length

  return (
    <div className="space-y-5">
      <Toaster />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feedbacks privés</h1>
          <p className="text-gray-500 text-sm">Avis négatifs interceptés — visibles uniquement par vous</p>
        </div>
        {unreadCount > 0 && (
          <span className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
            {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {([['all', 'Tous'], ['unread', '🔴 Non lus'], ['unresolved', '⚠️ Non résolus'], ['replied', '✅ Répondus']] as const).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${filter === val ? 'bg-blue-500 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse border border-gray-100" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="font-medium">Aucun feedback</p>
          <p className="text-sm mt-1">C'est plutôt bon signe ! 🎉</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(feedback => (
            <Card key={feedback.id} className={`shadow-sm transition-all hover:shadow-md ${!feedback.is_read ? 'border-l-4 border-l-red-400' : ''}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      {/* Score étoiles */}
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < feedback.score ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`} />
                        ))}
                      </div>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        {CATEGORY_LABELS[feedback.category] || feedback.category}
                      </span>
                      {!feedback.is_read && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-medium">Nouveau</span>}
                      {feedback.is_resolved && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✅ Résolu</span>}
                      {feedback.reply && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">💬 Répondu</span>}
                    </div>

                    {/* Message */}
                    <p className="text-sm text-gray-700 leading-relaxed">{feedback.message}</p>

                    {/* Réponse existante */}
                    {feedback.reply && (
                      <div className="mt-3 ml-4 pl-3 border-l-2 border-blue-200">
                        <p className="text-xs text-blue-500 font-medium mb-1">Votre réponse :</p>
                        <p className="text-xs text-gray-600">{feedback.reply}</p>
                      </div>
                    )}

                    {/* Formulaire de réponse */}
                    {expandedId === feedback.id && !feedback.reply && (
                      <div className="mt-3 space-y-2">
                        <Textarea
                          placeholder={`Répondre à ${feedback.customer?.name || 'ce client'}...`}
                          value={replyText[feedback.id] || ''}
                          onChange={e => setReplyText(prev => ({ ...prev, [feedback.id]: e.target.value }))}
                          rows={3}
                          className="text-sm"
                        />
                        {!feedback.customer?.email && (
                          <p className="text-xs text-orange-500">⚠️ Ce client n'a pas d'email — la réponse ne pourra pas être envoyée</p>
                        )}
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setExpandedId(null)}>
                            <X className="w-3 h-3 mr-1" /> Annuler
                          </Button>
                          <Button size="sm" variant="gradient" className="h-7 text-xs" onClick={() => handleSendReply(feedback.id)} disabled={!replyText[feedback.id]?.trim() || sendingReply === feedback.id}>
                            {sendingReply === feedback.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Send className="w-3 h-3 mr-1" />}
                            Envoyer par email
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span className="font-medium text-gray-600">{feedback.customer?.name || 'Client'}</span>
                      <span>·</span>
                      <span>{formatRelativeDate(feedback.created_at)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    {!feedback.reply && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={() => setExpandedId(expandedId === feedback.id ? null : feedback.id)}
                      >
                        <Reply className="w-3 h-3 mr-1" />
                        Répondre
                      </Button>
                    )}
                    {!feedback.is_read && (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleMarkRead(feedback.id)}>
                        <Check className="w-3 h-3 mr-1" /> Lu
                      </Button>
                    )}
                    {!feedback.is_resolved && (
                      <Button size="sm" variant="outline" className="h-7 text-xs text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleMarkResolved(feedback.id)}>
                        <CheckCheck className="w-3 h-3 mr-1" /> Résolu
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
