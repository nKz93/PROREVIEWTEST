"use client"
import { useState, useEffect } from 'react'
import { CreditCard, ExternalLink, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { Business, Invoice } from '@/types'

const planDetails = {
  free: { name: 'Gratuit', price: 0, color: 'secondary' },
  starter: { name: 'Starter', price: 29, color: 'default' },
  pro: { name: 'Pro', price: 59, color: 'gradient' },
  business: { name: 'Business', price: 99, color: 'default' },
}

export default function BillingPage() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingPortal, setLoadingPortal] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: biz } = await supabase.from('businesses').select('*').eq('user_id', user.id).single()
      setBusiness(biz)
      if (biz) {
        const { data: inv } = await supabase.from('invoices').select('*').eq('business_id', biz.id).order('created_at', { ascending: false })
        setInvoices(inv || [])
      }
      setLoading(false)
    }
    fetch()
  }, [])

  const handleManageSubscription = async () => {
    setLoadingPortal(true)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch {
      console.error('Erreur portail Stripe')
    } finally {
      setLoadingPortal(false)
    }
  }

  const handleUpgrade = async (plan: string) => {
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const { url } = await res.json()
    if (url) window.location.href = url
  }

  if (loading || !business) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
  }

  const currentPlan = planDetails[business.plan]

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Facturation</h1>
        <p className="text-gray-500 text-sm">Gérez votre abonnement et vos factures</p>
      </div>

      {/* Plan actuel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Plan actuel</CardTitle>
              <CardDescription>Votre abonnement ProReview</CardDescription>
            </div>
            <Badge className={business.plan === 'pro' ? 'gradient-primary text-white' : ''} variant={business.plan === 'pro' ? undefined : 'secondary'}>
              Plan {currentPlan.name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold gradient-text">{currentPlan.price}€<span className="text-sm font-normal text-gray-500">/mois</span></p>
              <p className="text-sm text-gray-500 mt-1">
                {business.monthly_sms_used}/{business.monthly_sms_limit} SMS utilisés ce mois
              </p>
            </div>
            {business.stripe_customer_id && (
              <Button variant="outline" onClick={handleManageSubscription} disabled={loadingPortal}>
                {loadingPortal ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ExternalLink className="w-4 h-4 mr-2" />}
                Gérer mon abonnement
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upgrade */}
      {business.plan !== 'business' && (
        <div className="grid md:grid-cols-3 gap-4">
          {(['starter', 'pro', 'business'] as const)
            .filter(p => p !== business.plan)
            .map((plan) => {
              const details = planDetails[plan]
              return (
                <Card key={plan} className={plan === 'pro' ? 'border-blue-200 bg-blue-50/30' : ''}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-bold text-gray-900">{details.name}</p>
                        <p className="text-2xl font-bold gradient-text">{details.price}€<span className="text-xs text-gray-500">/mois</span></p>
                      </div>
                      {plan === 'pro' && <Badge className="gradient-primary text-white text-xs">Populaire</Badge>}
                    </div>
                    <Button
                      variant={plan === 'pro' ? 'gradient' : 'outline'}
                      className="w-full"
                      size="sm"
                      onClick={() => handleUpgrade(plan)}
                    >
                      Passer au {details.name}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
        </div>
      )}

      {/* Factures */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des factures</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Aucune facture pour l'instant</p>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(invoice.amount_cents)}</p>
                    <p className="text-xs text-gray-500">{formatDate(invoice.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={invoice.status === 'paid' ? 'success' : 'secondary'}>
                      {invoice.status === 'paid' ? 'Payée' : 'En attente'}
                    </Badge>
                    {invoice.pdf_url && (
                      <a href={invoice.pdf_url} target="_blank" className="text-blue-600 hover:underline text-xs">
                        PDF
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
