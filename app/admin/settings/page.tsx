"use client"
import { useState } from 'react'
import AdminTopBar from '@/components/admin/AdminTopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { Settings, Bell, Globe, Lock, Zap, Save } from 'lucide-react'

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    siteName: 'ProReview',
    supportEmail: 'support@proreview.fr',
    maintenanceMode: false,
    newRegistrations: true,
    smtpFrom: 'noreply@proreview.fr',
    defaultSMSLimit: 50,
    trialDays: 14,
    announcementBanner: '',
    showBanner: false,
  })

  const handleSave = () => {
    toast({ title: 'Paramètres sauvegardés ✅', description: 'Les modifications sont appliquées' })
  }

  return (
    <div>
      <Toaster />
      <AdminTopBar title="Paramètres plateforme" subtitle="Configuration globale de ProReview" />
      <div className="p-6 space-y-6">

        {/* Général */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-orange-400" />
              Général
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-400">Nom de la plateforme</Label>
                <Input
                  value={settings.siteName}
                  onChange={e => setSettings({ ...settings, siteName: e.target.value })}
                  className="mt-1 bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-400">Email support</Label>
                <Input
                  value={settings.supportEmail}
                  onChange={e => setSettings({ ...settings, supportEmail: e.target.value })}
                  className="mt-1 bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-400">SMS gratuits par défaut (plan Free)</Label>
                <Input
                  type="number"
                  value={settings.defaultSMSLimit}
                  onChange={e => setSettings({ ...settings, defaultSMSLimit: parseInt(e.target.value) })}
                  className="mt-1 bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-400">Jours d'essai gratuit</Label>
                <Input
                  type="number"
                  value={settings.trialDays}
                  onChange={e => setSettings({ ...settings, trialDays: parseInt(e.target.value) })}
                  className="mt-1 bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accès & sécurité */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-orange-400" />
              Accès & Sécurité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-white">Mode maintenance</p>
                <p className="text-xs text-gray-500">Affiche une page de maintenance pour tous les utilisateurs</p>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={v => setSettings({ ...settings, maintenanceMode: v })}
              />
            </div>
            <div className="border-t border-gray-800" />
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-white">Nouvelles inscriptions</p>
                <p className="text-xs text-gray-500">Autoriser les nouveaux comptes à s'inscrire</p>
              </div>
              <Switch
                checked={settings.newRegistrations}
                onCheckedChange={v => setSettings({ ...settings, newRegistrations: v })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Bannière d'annonce */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-orange-400" />
              Bannière d'annonce
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Afficher la bannière</p>
                <p className="text-xs text-gray-500">Visible sur le dashboard de tous les utilisateurs</p>
              </div>
              <Switch
                checked={settings.showBanner}
                onCheckedChange={v => setSettings({ ...settings, showBanner: v })}
              />
            </div>
            <div>
              <Label className="text-gray-400">Message de la bannière</Label>
              <Textarea
                value={settings.announcementBanner}
                onChange={e => setSettings({ ...settings, announcementBanner: e.target.value })}
                placeholder="Ex: 🎉 Nouvelle fonctionnalité disponible : les QR codes personnalisés !"
                className="mt-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-600"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Email config */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-400" />
              Configuration emails
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label className="text-gray-400">Email expéditeur (noreply)</Label>
              <Input
                value={settings.smtpFrom}
                onChange={e => setSettings({ ...settings, smtpFrom: e.target.value })}
                className="mt-1 bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600 text-white px-8">
            <Save className="w-4 h-4 mr-2" />
            Sauvegarder les paramètres
          </Button>
        </div>
      </div>
    </div>
  )
}
