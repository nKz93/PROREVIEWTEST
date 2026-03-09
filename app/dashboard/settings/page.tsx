"use client"
import { useState, useEffect } from 'react'
import { Save, Loader2, Bell, MessageSquare, RefreshCw, Zap, Globe, Link2, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/use-toast'
import { markOnboardingStep } from '@/lib/onboarding'
import { Toaster } from '@/components/ui/toaster'
import type { Business } from '@/types'

export default function SettingsPage() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [followupEnabled, setFollowupEnabled] = useState(false)
  const [followupDelay, setFollowupDelay] = useState('48')
  const [followupTemplate, setFollowupTemplate] = useState('Bonjour {name}, nous espérons que votre visite chez {business} s\'est bien passée ! Avez-vous eu le temps de laisser un avis ? {link}')

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: biz } = await supabase.from('businesses').select('*').eq('user_id', user.id).single()
      setBusiness(biz)

      if (biz) {
        const { data: rule } = await supabase.from('followup_rules').select('*').eq('business_id', biz.id).single()
        if (rule) {
          setFollowupEnabled(rule.is_active)
          setFollowupDelay(String(rule.delay_hours))
          if (rule.message_template) setFollowupTemplate(rule.message_template)
        }
      }
    }
    fetch()
  }, [])

  const handleSave = async () => {
    if (!business) return
    setSaving(true)
    try {
      const supabase = createClient()
      await supabase.from('businesses').update({
        name: business.name,
        email: business.email,
        phone: business.phone,
        google_review_url: business.google_review_url,
        sms_template: business.sms_template,
        email_template: business.email_template,
        auto_send_enabled: business.auto_send_enabled,
        auto_send_delay_hours: business.auto_send_delay_hours,
        send_method: business.send_method,
        widget_enabled: business.widget_enabled,
        updated_at: new Date().toISOString(),
      }).eq('id', business.id)

      // Upsert followup rule
      const { data: existing } = await supabase.from('followup_rules').select('id').eq('business_id', business.id).single()
      if (existing) {
        await supabase.from('followup_rules').update({
          is_active: followupEnabled,
          delay_hours: parseInt(followupDelay),
          message_template: followupTemplate,
        }).eq('business_id', business.id)
      } else {
        await supabase.from('followup_rules').insert({
          business_id: business.id,
          is_active: followupEnabled,
          delay_hours: parseInt(followupDelay),
          message_template: followupTemplate,
        })
      }

      toast({ title: 'Paramètres sauvegardés ✅' })
      if (business.google_review_url) await markOnboardingStep(business.id, 'step_google_url')
      await markOnboardingStep(business.id, 'step_profile')
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleCopySlug = () => {
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/w/${business?.widget_slug || business?.id}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!business) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>

  return (
    <div className="space-y-6 max-w-3xl">
      <Toaster />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-gray-500 text-sm">Configurez votre compte et vos automatisations</p>
        </div>
        <Button variant="gradient" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Sauvegarder
        </Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="automation">Automatisation</TabsTrigger>
          <TabsTrigger value="widget">Widget</TabsTrigger>
        </TabsList>

        {/* Général */}
        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle>Informations du commerce</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nom du commerce</Label>
                  <Input value={business.name} onChange={e => setBusiness({...business, name: e.target.value})} className="mt-1" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={business.email} onChange={e => setBusiness({...business, email: e.target.value})} className="mt-1" />
                </div>
              </div>
              <div>
                <Label className="flex items-center gap-1"><Link2 className="w-3 h-3" /> Lien Google Reviews</Label>
                <Input
                  value={business.google_review_url || ''}
                  onChange={e => setBusiness({...business, google_review_url: e.target.value})}
                  placeholder="https://g.page/votre-commerce/review"
                  className="mt-1"
                />
                <p className="text-xs text-gray-400 mt-1">Trouvez ce lien dans Google Business Profile → Partager le profil</p>
              </div>
              <div>
                <Label>Méthode d'envoi par défaut</Label>
                <Select value={business.send_method} onValueChange={v => setBusiness({...business, send_method: v as 'sms'|'email'|'both'})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sms">📱 SMS uniquement</SelectItem>
                    <SelectItem value="email">✉️ Email uniquement</SelectItem>
                    <SelectItem value="both">📱✉️ SMS + Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Template SMS</CardTitle>
              <CardDescription>Variables disponibles : {'{name}'}, {'{business}'}, {'{link}'}</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={business.sms_template}
                onChange={e => setBusiness({...business, sms_template: e.target.value})}
                rows={3}
              />
              <p className="text-xs text-gray-400 mt-2">{business.sms_template.length} caractères · ~{Math.ceil(business.sms_template.length / 160)} SMS</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Template Email</CardTitle>
              <CardDescription>Objet et corps de l'email de demande d'avis</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={business.email_template}
                onChange={e => setBusiness({...business, email_template: e.target.value})}
                rows={4}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automatisation */}
        <TabsContent value="automation" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Zap className="w-4 h-4 text-blue-500" /> Envoi automatique</CardTitle>
              <CardDescription>Envoie automatiquement une demande X heures après l'ajout d'un client</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Activer l'envoi auto</p>
                  <p className="text-xs text-gray-500">Chaque nouveau client reçoit un SMS après sa visite</p>
                </div>
                <Switch
                  checked={business.auto_send_enabled}
                  onCheckedChange={v => setBusiness({...business, auto_send_enabled: v})}
                />
              </div>
              {business.auto_send_enabled && (
                <div>
                  <Label>Délai avant envoi</Label>
                  <Select value={String(business.auto_send_delay_hours)} onValueChange={v => setBusiness({...business, auto_send_delay_hours: parseInt(v)})}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 heure</SelectItem>
                      <SelectItem value="2">2 heures</SelectItem>
                      <SelectItem value="4">4 heures</SelectItem>
                      <SelectItem value="24">24 heures</SelectItem>
                      <SelectItem value="48">48 heures</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><RefreshCw className="w-4 h-4 text-violet-500" /> Relance automatique</CardTitle>
              <CardDescription>Renvoie un message si le client n'a pas répondu après X heures</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Activer les relances</p>
                  <p className="text-xs text-gray-500">1 seule relance par client maximum</p>
                </div>
                <Switch checked={followupEnabled} onCheckedChange={setFollowupEnabled} />
              </div>
              {followupEnabled && (
                <>
                  <div>
                    <Label>Délai de relance</Label>
                    <Select value={followupDelay} onValueChange={setFollowupDelay}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24">24 heures</SelectItem>
                        <SelectItem value="48">48 heures</SelectItem>
                        <SelectItem value="72">72 heures</SelectItem>
                        <SelectItem value="168">1 semaine</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Message de relance</Label>
                    <Textarea
                      value={followupTemplate}
                      onChange={e => setFollowupTemplate(e.target.value)}
                      rows={3}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-400 mt-1">Variables : {'{name}'}, {'{business}'}, {'{link}'}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Widget */}
        <TabsContent value="widget" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Globe className="w-4 h-4 text-green-500" /> Widget de réputation</CardTitle>
              <CardDescription>Affichez vos meilleurs avis sur votre site web</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Activer le widget public</p>
                  <p className="text-xs text-gray-500">Votre page de réputation sera accessible publiquement</p>
                </div>
                <Switch
                  checked={business.widget_enabled || false}
                  onCheckedChange={v => setBusiness({...business, widget_enabled: v})}
                />
              </div>

              {business.widget_enabled && (
                <>
                  <div>
                    <Label>URL de votre widget</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={`${process.env.NEXT_PUBLIC_APP_URL || 'https://app.proreview.fr'}/w/${business.widget_slug || business.id.slice(0, 8)}`}
                        readOnly
                        className="bg-gray-50 text-gray-600 text-sm"
                      />
                      <Button variant="outline" size="icon" onClick={handleCopySlug}>
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>Code d'intégration iFrame</Label>
                    <div className="mt-1 relative">
                      <pre className="bg-gray-900 text-green-400 text-xs p-3 rounded-xl overflow-x-auto">
{`<iframe
  src="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.proreview.fr'}/w/${business.widget_slug || business.id.slice(0, 8)}"
  width="100%" height="200"
  frameborder="0" style="border-radius:12px">
</iframe>`}
                      </pre>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Collez ce code dans le HTML de votre site</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
