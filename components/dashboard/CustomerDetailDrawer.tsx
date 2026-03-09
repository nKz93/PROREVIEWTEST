"use client"
import { useState, useEffect } from 'react'
import { X, Phone, Mail, Calendar, Tag, Star, Send, MessageSquare, Loader2, Clock, CheckCircle2, Edit2, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { formatDate, formatDateTime } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'
import type { Customer, ReviewRequest } from '@/types'

interface CustomerDetailDrawerProps {
  customer: Customer | null
  onClose: () => void
  onSendRequest: (customerId: string) => void
  sending: boolean
  onDelete: (customerId: string) => void
  onUpdate: (customer: Customer) => void
}

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: 'En attente', color: 'bg-gray-100 text-gray-600', icon: '⏳' },
  sent: { label: 'SMS envoyé', color: 'bg-blue-100 text-blue-700', icon: '📱' },
  opened: { label: 'Ouvert', color: 'bg-indigo-100 text-indigo-700', icon: '👁️' },
  clicked: { label: 'Cliqué', color: 'bg-violet-100 text-violet-700', icon: '🖱️' },
  reviewed: { label: 'Avis Google ✅', color: 'bg-green-100 text-green-700', icon: '⭐' },
  feedback: { label: 'Feedback privé', color: 'bg-red-100 text-red-700', icon: '💬' },
  failed: { label: 'Échec', color: 'bg-red-100 text-red-600', icon: '❌' },
}

export default function CustomerDetailDrawer({ customer, onClose, onSendRequest, sending, onDelete, onUpdate }: CustomerDetailDrawerProps) {
  const [requests, setRequests] = useState<ReviewRequest[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Customer>>({})
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!customer) return
    setEditForm({ name: customer.name, phone: customer.phone, email: customer.email, tags: [...(customer.tags || [])] })
    setEditing(false)
    fetchHistory()
  }, [customer])

  const fetchHistory = async () => {
    if (!customer) return
    setLoadingHistory(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('review_requests')
      .select('*')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false })
      .limit(20)
    setRequests((data || []) as ReviewRequest[])
    setLoadingHistory(false)
  }

  const handleSave = async () => {
    if (!customer) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('customers')
      .update({
        name: editForm.name,
        phone: editForm.phone || null,
        email: editForm.email || null,
        tags: editForm.tags || [],
      })
      .eq('id', customer.id)

    if (!error) {
      const updated = { ...customer, ...editForm } as Customer
      onUpdate(updated)
      toast({ title: 'Client mis à jour ✅' })
      setEditing(false)
    } else {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    }
    setSaving(false)
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !(editForm.tags || []).includes(t)) {
      setEditForm(p => ({ ...p, tags: [...(p.tags || []), t] }))
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setEditForm(p => ({ ...p, tags: (p.tags || []).filter(t => t !== tag) }))
  }

  if (!customer) return null

  const hasReview = requests.some(r => r.status === 'reviewed')
  const lastRequest = requests[0]

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="gradient-primary p-5 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-xl font-bold">
                {customer.name.charAt(0).toUpperCase()}
              </div>
              <div>
                {editing ? (
                  <Input
                    value={editForm.name || ''}
                    onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/60 h-7 text-sm font-bold"
                  />
                ) : (
                  <h2 className="font-bold text-lg">{customer.name}</h2>
                )}
                <p className="text-white/70 text-xs mt-0.5">
                  Client depuis le {formatDate(customer.created_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {editing ? (
                <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0 h-8" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                </Button>
              ) : (
                <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0 h-8" onClick={() => setEditing(true)}>
                  <Edit2 className="w-3 h-3" />
                </Button>
              )}
              <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0 h-8" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Badge statut */}
          <div className="mt-3 flex gap-2">
            {hasReview && (
              <span className="text-xs bg-white/20 px-2 py-1 rounded-full flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-300 text-yellow-300" /> Avis Google laissé
              </span>
            )}
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
              {requests.length} demande{requests.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Coordonnées */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Coordonnées</h3>

            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                {editing ? (
                  <Input
                    type="tel"
                    value={editForm.phone || ''}
                    onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+33 6 12 34 56 78"
                    className="h-7 text-sm border-0 bg-transparent p-0 focus-visible:ring-0"
                  />
                ) : (
                  <span className="text-sm text-gray-700">{customer.phone || <span className="text-gray-400">Non renseigné</span>}</span>
                )}
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                {editing ? (
                  <Input
                    type="email"
                    value={editForm.email || ''}
                    onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="email@exemple.fr"
                    className="h-7 text-sm border-0 bg-transparent p-0 focus-visible:ring-0"
                  />
                ) : (
                  <span className="text-sm text-gray-700">{customer.email || <span className="text-gray-400">Non renseigné</span>}</span>
                )}
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700">Visite le {formatDate(customer.visit_date)}</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tags</h3>
            <div className="flex flex-wrap gap-1.5">
              {(editing ? editForm.tags : customer.tags || []).map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                  <Tag className="w-2.5 h-2.5" />
                  {tag}
                  {editing && (
                    <button onClick={() => removeTag(tag)} className="hover:text-red-500 ml-1">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </span>
              ))}
              {(editing ? editForm.tags : customer.tags || []).length === 0 && !editing && (
                <span className="text-xs text-gray-400">Aucun tag</span>
              )}
            </div>
            {editing && (
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                  placeholder="Nouveau tag..."
                  className="h-7 text-xs"
                />
                <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={addTag}>+</Button>
              </div>
            )}
          </div>

          {/* Historique demandes */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Historique des demandes</h3>
            {loadingHistory ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-4 text-gray-400 text-sm">
                <Clock className="w-6 h-6 mx-auto mb-1 opacity-40" />
                Aucune demande envoyée
              </div>
            ) : (
              <div className="space-y-2">
                {requests.map((req) => {
                  const config = statusConfig[req.status] || statusConfig.pending
                  return (
                    <div key={req.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{config.icon}</span>
                        <div>
                          <p className="text-xs font-medium text-gray-700">{config.label}</p>
                          <p className="text-xs text-gray-400">{formatDateTime(req.created_at)}</p>
                        </div>
                      </div>
                      <span className="text-xs uppercase text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{req.method}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-gray-100 space-y-2">
          <Button
            variant="gradient"
            className="w-full"
            onClick={() => onSendRequest(customer.id)}
            disabled={sending}
          >
            {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Envoyer une demande d'avis
          </Button>
          <Button
            variant="outline"
            className="w-full text-red-500 hover:text-red-700 hover:bg-red-50 border-red-100"
            onClick={() => { onClose(); onDelete(customer.id) }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer ce client
          </Button>
        </div>
      </div>
    </>
  )
}
