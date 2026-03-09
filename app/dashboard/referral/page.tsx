"use client"
import { useState, useEffect } from 'react'
import type { Business } from '@/types'
import { Gift, Copy, Check, Users, Star, Loader2, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { formatDate } from '@/lib/utils'

export default function ReferralPage() {
  const [referralCode, setReferralCode] = useState('')
  const [referrals, setReferrals] = useState<Record<string, unknown>[]>([])
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: biz } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', user.id)
        .single()
      setBusiness(biz)

      if (biz) {
        const { data: refs } = await supabase
          .from('referrals')
          .select('*, referred:businesses!referred_business_id(name)')
          .eq('referrer_business_id', biz.id)
          .order('created_at', { ascending: false })
        setReferrals(refs || [])

        // Chercher un code existant
        const existing = (refs || []).find((r: Record<string, unknown>) => r.referral_code)
        if (existing) {
          setReferralCode(existing.referral_code as string)
        }
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const generateAndSaveCode = async () => {
    if (!business || referralCode) return
    setGenerating(true)
    try {
      const supabase = createClient()

      // Générer un code unique basé sur le nom + timestamp
      const prefix = String(business.name)
        .slice(0, 4).toUpperCase()
        .replace(/[^A-Z0-9]/g, 'X')
        .padEnd(4, 'X')
      const suffix = Date.now().toString(36).toUpperCase().slice(-4)
      const code = prefix + suffix

      // Vérifier l'unicité
      const { data: existing } = await supabase
        .from('referrals')
        .select('id')
        .eq('referral_code', code)
        .maybeSingle()

      if (existing) {
        toast({ title: 'Erreur', description: 'Code en doublon, réessayez', variant: 'destructive' })
        return
      }

      const { error } = await supabase.from('referrals').insert({
        referrer_business_id: business.id,
        referral_code: code,
        status: 'pending',
      })

      if (error) throw error

      setReferralCode(code)
      toast({ title: 'Code de parrainage créé ✅' })
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de créer le code', variant: 'destructive' })
    } finally {
      setGenerating(false)
    }
  }

  const referralLink = referralCode
    ? `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/register?ref=${referralCode}`
    : ''

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({ title: 'Copié !' })
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'ProReview — Collectez des avis Google automatiquement',
        text: `Inscris-toi sur ProReview avec mon code et bénéficie d'un mois offert !`,
        url: referralLink,
      })
    } else {
      handleCopy(referralLink)
    }
  }

  const converted = referrals.filter(r => r.status === 'converted').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Toaster />
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Programme de parrainage 🎁</h1>
        <p className="text-gray-500 text-sm">Invitez des commerçants et gagnez des avantages</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Invitations', value: referrals.length, icon: '📨' },
          { label: 'Convertis', value: converted, icon: '✅' },
          { label: 'SMS bonus', value: converted * 50, icon: '🎁' },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl mb-1">{stat.icon}</p>
              <p className="text-2xl font-bold gradient-text">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Code de parrainage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-violet-500" />
            Votre code de parrainage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!referralCode ? (
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm mb-4">
                Générez votre code unique pour commencer à parrainer des commerçants.
              </p>
              <Button variant="gradient" onClick={generateAndSaveCode} disabled={generating}>
                {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Gift className="w-4 h-4 mr-2" />}
                Générer mon code
              </Button>
            </div>
          ) : (
            <>
              <div>
                <p className="text-xs text-gray-500 mb-1 font-medium">Code</p>
                <div className="flex gap-2">
                  <Input value={referralCode} readOnly className="font-mono font-bold text-lg tracking-widest text-center" />
                  <Button variant="outline" size="icon" onClick={() => handleCopy(referralCode)}>
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1 font-medium">Lien d'invitation</p>
                <div className="flex gap-2">
                  <Input value={referralLink} readOnly className="text-xs text-gray-600" />
                  <Button variant="outline" size="icon" onClick={() => handleCopy(referralLink)}>
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <Button variant="gradient" className="w-full" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Partager mon lien
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Avantages */}
      <Card>
        <CardHeader><CardTitle className="text-base">Comment ça marche ?</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[
            { step: '1', text: 'Partagez votre lien unique avec d\'autres commerçants', icon: '🔗' },
            { step: '2', text: 'Ils s\'inscrivent et souscrivent un abonnement payant', icon: '✅' },
            { step: '3', text: 'Vous gagnez +50 SMS gratuits pour chaque filleul', icon: '🎁' },
          ].map(item => (
            <div key={item.step} className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              <p className="text-sm text-gray-600">{item.text}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Historique */}
      {referrals.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Vos filleuls</CardTitle></CardHeader>
          <CardContent className="divide-y divide-gray-50">
            {referrals.map(ref => (
              <div key={ref.id as string} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {String((ref.referred as Record<string, unknown> | null)?.name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {String((ref.referred as Record<string, unknown> | null)?.name || 'En attente...')}
                    </p>
                    <p className="text-xs text-gray-400">{formatDate(ref.created_at as string)}</p>
                  </div>
                </div>
                <Badge className={`text-xs ${ref.status === 'converted' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {ref.status === 'converted' ? '✅ Converti' : '⏳ En attente'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
