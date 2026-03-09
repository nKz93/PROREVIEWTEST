"use client"
import { useState, useEffect, useCallback } from 'react'
import {
  Search, Upload, Users, UserCheck, Star, MessageSquare,
  Send, Filter, ChevronDown, BarChart2, Tag, Check, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import AddCustomerModal from '@/components/dashboard/AddCustomerModal'
import ImportCSVModal from '@/components/dashboard/ImportCSVModal'
import CustomerDetailDrawer from '@/components/dashboard/CustomerDetailDrawer'
import { createClient } from '@/lib/supabase/client'
import { markOnboardingStep } from '@/lib/onboarding'
import { formatDate, generateUniqueCode } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'
import type { Customer, Business } from '@/types'

type FilterType = 'all' | 'reviewed' | 'not_reviewed' | 'no_contact'
type SortType = 'recent' | 'oldest' | 'name_az' | 'name_za'

const statusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-700',
  opened: 'bg-indigo-100 text-indigo-700',
  clicked: 'bg-violet-100 text-violet-700',
  reviewed: 'bg-green-100 text-green-700',
  feedback: 'bg-orange-100 text-orange-700',
  failed: 'bg-red-100 text-red-600',
}

const statusLabels: Record<string, string> = {
  pending: 'En attente',
  sent: 'SMS envoyé',
  opened: 'Ouvert',
  clicked: 'Cliqué',
  reviewed: '⭐ Avis Google',
  feedback: '💬 Feedback',
  failed: '❌ Échec',
}

interface CustomerWithStatus extends Customer {
  lastRequestStatus?: string
  reviewCount?: number
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerWithStatus[]>([])
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [sort, setSort] = useState<SortType>('recent')
  const [sending, setSending] = useState<string | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkSending, setBulkSending] = useState(false)
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: biz } = await supabase.from('businesses').select('*').eq('user_id', user.id).single()
    setBusiness(biz)

    if (biz) {
      const { data: rawCustomers } = await supabase
        .from('customers')
        .select('*')
        .eq('business_id', biz.id)
        .order('created_at', { ascending: false })

      // Récupérer le statut de la dernière demande pour chaque client
      const { data: requests } = await supabase
        .from('review_requests')
        .select('customer_id, status, created_at')
        .eq('business_id', biz.id)
        .order('created_at', { ascending: false })

      // Mapper les statuts
      const statusMap: Record<string, string> = {}
      const reviewCountMap: Record<string, number> = {}

      requests?.forEach(r => {
        if (!statusMap[r.customer_id]) statusMap[r.customer_id] = r.status
        if (r.status === 'reviewed') {
          reviewCountMap[r.customer_id] = (reviewCountMap[r.customer_id] || 0) + 1
        }
      })

      const enriched = (rawCustomers || []).map(c => ({
        ...c,
        lastRequestStatus: statusMap[c.id],
        reviewCount: reviewCountMap[c.id] || 0,
      }))

      setCustomers(enriched as CustomerWithStatus[])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Stats rapides
  const stats = {
    total: customers.length,
    reviewed: customers.filter(c => c.reviewCount && c.reviewCount > 0).length,
    notSent: customers.filter(c => !c.lastRequestStatus).length,
    withGoogle: customers.filter(c => c.lastRequestStatus === 'reviewed').length,
  }

  // Tous les tags uniques
  const allTags = Array.from(new Set(customers.flatMap(c => c.tags || [])))

  // Filtrer et trier
  const filtered = customers
    .filter(c => {
      if (search) {
        const q = search.toLowerCase()
        return c.name.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.phone?.includes(q)
      }
      return true
    })
    .filter(c => {
      if (filter === 'reviewed') return c.reviewCount && c.reviewCount > 0
      if (filter === 'not_reviewed') return !c.reviewCount || c.reviewCount === 0
      if (filter === 'no_contact') return !c.phone && !c.email
      return true
    })
    .filter(c => {
      if (activeTagFilter) return (c.tags || []).includes(activeTagFilter)
      return true
    })
    .sort((a, b) => {
      if (sort === 'name_az') return a.name.localeCompare(b.name)
      if (sort === 'name_za') return b.name.localeCompare(a.name)
      if (sort === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const selectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(c => c.id)))
    }
  }

  const handleSendRequest = async (customerId: string) => {
    if (!business) return
    setSending(customerId)
    try {
      const customer = customers.find(c => c.id === customerId)
      if (!customer) return
      const supabase = createClient()
      const code = generateUniqueCode(12)
      await supabase.from('review_requests').insert({
        business_id: business.id,
        customer_id: customerId,
        unique_code: code,
        method: customer.phone ? 'sms' : 'email',
        status: 'pending',
      })
      const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/review/${code}`
      if (customer.phone) {
        const message = (business.sms_template || '')
          .replace('{name}', customer.name)
          .replace('{business}', business.name)
          .replace('{link}', reviewUrl)
        await fetch('/api/send-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: customer.phone, message, requestCode: code }),
        })
      }
      if (business) await markOnboardingStep(business.id, 'step_first_send')
      toast({ title: '📱 Demande envoyée', description: `SMS envoyé à ${customer.name}` })
      fetchData()
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    } finally {
      setSending(null)
    }
  }

  const handleBulkSend = async () => {
    if (selectedIds.size === 0) return
    setBulkSending(true)
    let sent = 0
    for (const id of Array.from(selectedIds)) {
      await handleSendRequest(id)
      sent++
    }
    setSelectedIds(new Set())
    setBulkSending(false)
    toast({ title: `✅ ${sent} demandes envoyées` })
  }

  const handleDelete = async (customerId: string) => {
    if (!confirm('Supprimer ce client ?')) return
    const supabase = createClient()
    await supabase.from('customers').delete().eq('id', customerId)
    setCustomers(prev => prev.filter(c => c.id !== customerId))
    toast({ title: 'Client supprimé' })
  }

  const handleUpdate = (updated: Customer) => {
    setCustomers(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c))
    setSelectedCustomer(updated)
  }

  return (
    <div className="space-y-5">
      <Toaster />

      {/* Drawer */}
      {selectedCustomer && (
        <CustomerDetailDrawer
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onSendRequest={handleSendRequest}
          sending={sending === selectedCustomer.id}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500 text-sm">{customers.length} clients au total</p>
        </div>
        <div className="flex gap-2">
          {business && <ImportCSVModal businessId={business.id} onSuccess={fetchData} />}
          {business && <AddCustomerModal businessId={business.id} onSuccess={fetchData} />}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Users, label: 'Total', value: stats.total, color: 'text-blue-500', bg: 'bg-blue-50', onClick: () => setFilter('all') },
          { icon: Star, label: 'Avis Google', value: stats.withGoogle, color: 'text-yellow-500', bg: 'bg-yellow-50', onClick: () => setFilter('reviewed') },
          { icon: Send, label: 'Non contactés', value: stats.notSent, color: 'text-violet-500', bg: 'bg-violet-50', onClick: () => setFilter('not_reviewed') },
          { icon: MessageSquare, label: 'Sans contact', value: stats.total - customers.filter(c => c.phone || c.email).length, color: 'text-gray-400', bg: 'bg-gray-50', onClick: () => setFilter('no_contact') },
        ].map((s, i) => (
          <button
            key={i}
            onClick={s.onClick}
            className="flex items-center gap-3 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all text-left"
          >
            <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Filtres et recherche */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher par nom, email, téléphone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortType)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="recent">Plus récents</option>
            <option value="oldest">Plus anciens</option>
            <option value="name_az">A → Z</option>
            <option value="name_za">Z → A</option>
          </select>
        </div>

        {/* Filtres rapides */}
        <div className="flex gap-2 flex-wrap">
          {(['all', 'reviewed', 'not_reviewed', 'no_contact'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                filter === f
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {f === 'all' ? '🔷 Tous' : f === 'reviewed' ? '⭐ Avis Google' : f === 'not_reviewed' ? '📭 Non contactés' : '⚠️ Sans contact'}
            </button>
          ))}

          {/* Filtres par tag */}
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTagFilter(activeTagFilter === tag ? null : tag)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1 transition-all ${
                activeTagFilter === tag
                  ? 'bg-violet-500 text-white'
                  : 'bg-violet-50 text-violet-600 border border-violet-200 hover:border-violet-300'
              }`}
            >
              <Tag className="w-3 h-3" />
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Barre d'actions bulk */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-2xl p-3 px-4">
          <span className="text-sm font-medium text-blue-700">
            {selectedIds.size} client{selectedIds.size > 1 ? 's' : ''} sélectionné{selectedIds.size > 1 ? 's' : ''}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="text-xs h-7 border-blue-200 text-blue-600" onClick={() => setSelectedIds(new Set())}>
              <X className="w-3 h-3 mr-1" />
              Désélectionner
            </Button>
            <Button size="sm" variant="gradient" className="text-xs h-7" onClick={handleBulkSend} disabled={bulkSending}>
              <Send className="w-3 h-3 mr-1" />
              {bulkSending ? 'Envoi...' : `Envoyer à ${selectedIds.size}`}
            </Button>
          </div>
        </div>
      )}

      {/* Tableau */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Users className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Aucun client trouvé</p>
            <p className="text-sm mt-1">
              {search ? 'Essayez une autre recherche' : 'Ajoutez votre premier client pour commencer'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filtered.length && filtered.length > 0}
                      onChange={selectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Client</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Contact</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Tags</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Visite</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Statut</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(customer => (
                  <tr
                    key={customer.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <td className="px-5 py-3" onClick={e => { e.stopPropagation(); toggleSelect(customer.id) }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(customer.id)}
                        onChange={() => {}}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${
                          customer.reviewCount ? 'bg-gradient-to-br from-green-400 to-emerald-500' : 'gradient-primary'
                        }`}>
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{customer.name}</p>
                          <p className="text-xs text-gray-400 capitalize">{customer.source}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="space-y-0.5">
                        {customer.phone && <p className="text-xs text-gray-600 flex items-center gap-1"><span>📱</span>{customer.phone}</p>}
                        {customer.email && <p className="text-xs text-gray-600 flex items-center gap-1"><span>✉️</span>{customer.email}</p>}
                        {!customer.phone && !customer.email && <p className="text-xs text-gray-400">—</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(customer.tags || []).slice(0, 2).map(tag => (
                          <span key={tag} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">{tag}</span>
                        ))}
                        {(customer.tags || []).length > 2 && (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">+{(customer.tags || []).length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">
                      {formatDate(customer.visit_date)}
                    </td>
                    <td className="px-4 py-3">
                      {customer.lastRequestStatus ? (
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[customer.lastRequestStatus]}`}>
                          {statusLabels[customer.lastRequestStatus]}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Pas encore contacté</span>
                      )}
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="gradient"
                          className="h-7 text-xs"
                          onClick={() => handleSendRequest(customer.id)}
                          disabled={sending === customer.id || !customer.phone}
                          title={!customer.phone ? 'Numéro de téléphone requis' : 'Envoyer une demande SMS'}
                        >
                          <Send className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Footer avec count */}
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                {filtered.length} client{filtered.length > 1 ? 's' : ''}
                {filter !== 'all' || search ? ` (filtré${filtered.length > 1 ? 's' : ''})` : ''}
              </p>
              {selectedIds.size > 0 && (
                <p className="text-xs text-blue-500 font-medium">{selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
