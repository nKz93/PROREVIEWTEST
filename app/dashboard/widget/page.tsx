"use client"
import { useState, useEffect } from 'react'
import { Key, Plus, Trash2, Copy, Check, Loader2, Code, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { formatDateTime } from '@/lib/utils'
import type { Business } from '@/types'

interface ApiKey {
  id: string
  name: string
  key_prefix: string
  last_used_at: string | null
  is_active: boolean
  created_at: string
}

interface Webhook {
  id: string
  url: string
  events: string[]
  is_active: boolean
  last_triggered_at: string | null
  created_at: string
}

export default function APIWebhooksPage() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(true)
  const [newKeyName, setNewKeyName] = useState('')
  const [newWebhookUrl, setNewWebhookUrl] = useState('')
  const [generatedKey, setGeneratedKey] = useState('')
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: biz } = await supabase.from('businesses').select('*').eq('user_id', user.id).single()
      setBusiness(biz)
      if (biz && biz.plan === 'business') {
        const [{ data: keys }, { data: hooks }] = await Promise.all([
          supabase.from('api_keys').select('id, name, key_prefix, last_used_at, is_active, created_at').eq('business_id', biz.id).order('created_at', { ascending: false }),
          supabase.from('webhooks').select('id, url, events, is_active, last_triggered_at, created_at').eq('business_id', biz.id),
        ])
        setApiKeys((keys || []) as unknown as ApiKey[])
        setWebhooks((hooks || []) as unknown as Webhook[])
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const createAPIKey = async () => {
    if (!newKeyName.trim() || !business) return
    setCreating(true)
    try {
      const res = await fetch('/api/v1/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setApiKeys(prev => [data.key as ApiKey, ...prev])
      setGeneratedKey(data.rawKey)
      setNewKeyName('')
      toast({ title: 'Clé API créée ✅', description: 'Copiez-la maintenant, elle ne sera plus visible' })
    } catch (e: unknown) {
      toast({ title: 'Erreur', description: e instanceof Error ? e.message : 'Erreur inconnue', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const deleteKey = async (keyId: string) => {
    if (!confirm('Supprimer cette clé API ? Les intégrations qui l\'utilisent ne fonctionneront plus.')) return
    const res = await fetch(`/api/v1/keys?id=${keyId}`, { method: 'DELETE' })
    if (res.ok) {
      setApiKeys(prev => prev.filter(k => k.id !== keyId))
      toast({ title: 'Clé supprimée' })
    }
  }

  const addWebhook = async () => {
    if (!newWebhookUrl.trim() || !business) return
    try {
      new URL(newWebhookUrl) // Valider l'URL
    } catch {
      toast({ title: 'URL invalide', variant: 'destructive' })
      return
    }
    const supabase = createClient()
    // Le secret est généré côté serveur
    const res = await fetch('/api/webhook/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: newWebhookUrl }),
    })
    const data = await res.json()
    if (res.ok) {
      setWebhooks(prev => [...prev, data.webhook as Webhook])
      setNewWebhookUrl('')
      toast({ title: 'Webhook ajouté ✅' })
    }
  }

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(''), 2000)
    toast({ title: 'Copié !' })
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>

  if (business?.plan !== 'business') {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Key className="w-8 h-8 text-orange-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">API & Webhooks</h2>
        <p className="text-gray-500 mb-6">Disponible sur le plan <strong>Business</strong>. Connectez ProReview à votre CRM via API REST et Webhooks.</p>
        <Button variant="gradient" onClick={() => window.location.href = '/dashboard/billing'}>
          Passer au plan Business →
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Toaster />
      <div>
        <h1 className="text-2xl font-bold text-gray-900">API & Webhooks</h1>
        <p className="text-gray-500 text-sm">Intégrez ProReview dans vos outils</p>
      </div>

      <Tabs defaultValue="api">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="api">Clés API</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="docs">Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="api" className="space-y-4 mt-4">
          {generatedKey && (
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-4">
              <p className="text-sm font-bold text-yellow-800 mb-2">⚠️ Copiez cette clé maintenant — elle ne sera plus affichée !</p>
              <div className="flex gap-2">
                <Input value={generatedKey} readOnly className="font-mono text-xs bg-white" />
                <Button size="sm" variant="outline" onClick={() => copyText(generatedKey, 'genkey')}>
                  {copied === 'genkey' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}
          <Card>
            <CardHeader><CardTitle className="text-base">Nouvelle clé API</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input placeholder="Nom (ex: Mon CRM)" value={newKeyName} onChange={e => setNewKeyName(e.target.value)} maxLength={100} />
                <Button variant="gradient" onClick={createAPIKey} disabled={creating || !newKeyName.trim()}>
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
          <div className="space-y-2">
            {apiKeys.map(key => (
              <div key={key.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
                <div>
                  <p className="font-medium text-sm text-gray-900">{key.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{key.key_prefix}••••••••••••••••••••••</p>
                  {key.last_used_at && <p className="text-xs text-gray-400">Utilisée le {formatDateTime(key.last_used_at)}</p>}
                </div>
                <div className="flex gap-2 items-center">
                  <Badge className={`text-xs ${key.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {key.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Button size="sm" variant="ghost" onClick={() => deleteKey(key.id)} className="text-red-400 hover:text-red-600 h-7 w-7 p-0">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
            {apiKeys.length === 0 && <p className="text-center text-gray-400 text-sm py-6">Aucune clé API</p>}
          </div>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ajouter un endpoint</CardTitle>
              <CardDescription>Recevez des événements en temps réel sur votre serveur</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input placeholder="https://votre-serveur.com/webhook" value={newWebhookUrl} onChange={e => setNewWebhookUrl(e.target.value)} type="url" />
                <Button variant="gradient" onClick={addWebhook} disabled={!newWebhookUrl.trim()}><Plus className="w-4 h-4" /></Button>
              </div>
              <p className="text-xs text-gray-400 mt-2">Événements : review.received, feedback.received, request.sent</p>
            </CardContent>
          </Card>
          {webhooks.map(wh => (
            <Card key={wh.id}>
              <CardContent className="p-4">
                <p className="text-sm font-mono text-gray-900 mb-1">{wh.url}</p>
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs ${wh.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{wh.is_active ? 'Actif' : 'Inactif'}</Badge>
                  <span className="text-xs text-gray-400">Secret généré côté serveur — non visible</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="docs" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Code className="w-4 h-4" />API REST</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">Base URL : <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{process.env.NEXT_PUBLIC_APP_URL}/api/v1</code></p>
              {[
                { method: 'GET', path: '/customers', desc: 'Lister vos clients (max 100/requête)' },
                { method: 'POST', path: '/customers', desc: 'Ajouter un client' },
                { method: 'GET', path: '/reviews', desc: 'Lister les avis reçus' },
              ].map(e => (
                <div key={e.path} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${e.method === 'GET' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{e.method}</span>
                  <code className="text-xs text-gray-700 font-mono">{e.path}</code>
                  <span className="text-xs text-gray-500 ml-auto">{e.desc}</span>
                </div>
              ))}
              <p className="text-xs text-gray-400">Header requis : <code className="bg-gray-100 px-1 rounded">Authorization: Bearer prv_xxx</code></p>
              <p className="text-xs text-gray-400">Rate limit : 1000 requêtes / heure par clé</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
