"use client"
import { useState, useEffect, useRef } from 'react'
import { Plus, Download, Trash2, Loader2, QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { formatDate } from '@/lib/utils'
import type { Business, QRCode } from '@/types'

interface QRCodeGeneratorProps {
  business: Business
}

export function QRCodeGenerator({ business }: QRCodeGeneratorProps) {
  const [qrCodes, setQrCodes] = useState<QRCode[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#3B82F6')
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({})

  useEffect(() => {
    fetchQRCodes()
  }, [])

  const fetchQRCodes = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false })
    setQrCodes((data || []) as QRCode[])
    setLoading(false)
  }

  const generateQR = async () => {
    if (!newName.trim()) {
      toast({ title: 'Nom requis', variant: 'destructive' })
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/qr/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), color: newColor }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: 'QR Code créé ✅' })
      setNewName('')
      fetchQRCodes()
    } catch (e: unknown) {
      toast({ title: 'Erreur', description: e instanceof Error ? e.message : 'Erreur inconnue', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const getQRUrl = (qr: QRCode) => {
    const base = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    return `${base}/review/${qr.short_code}`
  }

  const downloadQR = async (qr: QRCode) => {
    try {
      const QRCode = await import('qrcode')
      const url = getQRUrl(qr)
      const dataUrl = await QRCode.toDataURL(url, {
        width: 400,
        margin: 2,
        color: {
          dark: qr.design_config?.color || '#3B82F6',
          light: '#FFFFFF',
        },
      })
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `qr-${qr.name.toLowerCase().replace(/\s+/g, '-')}.png`
      link.click()
    } catch {
      toast({ title: 'Erreur téléchargement', variant: 'destructive' })
    }
  }

  const deleteQR = async (id: string) => {
    if (!confirm('Supprimer ce QR Code ?')) return
    const supabase = createClient()
    await supabase.from('qr_codes').delete().eq('id', id).eq('business_id', business.id)
    setQrCodes(prev => prev.filter(q => q.id !== id))
    toast({ title: 'QR Code supprimé' })
  }

  return (
    <div className="space-y-6">
      <Toaster />

      {/* Créer un nouveau QR */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Créer un QR Code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1">
              <Label htmlFor="qr-name">Nom du QR Code</Label>
              <Input
                id="qr-name"
                placeholder="Ex: Caisse principale, Table 1..."
                value={newName}
                onChange={e => setNewName(e.target.value)}
                maxLength={100}
                onKeyDown={e => e.key === 'Enter' && generateQR()}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="qr-color">Couleur</Label>
              <div className="flex gap-2">
                <input
                  id="qr-color"
                  type="color"
                  value={newColor}
                  onChange={e => setNewColor(e.target.value)}
                  className="h-10 w-12 rounded-lg border border-gray-200 cursor-pointer"
                />
                <Input value={newColor} onChange={e => setNewColor(e.target.value)} className="font-mono text-sm" maxLength={7} />
              </div>
            </div>
          </div>
          <Button variant="gradient" onClick={generateQR} disabled={creating || !newName.trim()}>
            {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            Générer le QR Code
          </Button>
        </CardContent>
      </Card>

      {/* Liste des QR codes */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : qrCodes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <QrCode className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Aucun QR Code créé</p>
          <p className="text-sm mt-1">Créez votre premier QR code à afficher en caisse</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {qrCodes.map(qr => (
            <Card key={qr.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{qr.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{qr.scan_count || 0} scans</p>
                  </div>
                  <button
                    onClick={() => deleteQR(qr.id)}
                    className="text-red-400 hover:text-red-600 transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* QR Code preview */}
                <div className="bg-white border border-gray-100 rounded-xl p-3 flex items-center justify-center mb-3">
                  <QRPreview url={getQRUrl(qr)} color={qr.design_config?.color || '#3B82F6'} />
                </div>

                <p className="text-xs text-gray-400 mb-3">Créé le {formatDate(qr.created_at)}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => downloadQR(qr)}
                >
                  <Download className="w-3 h-3 mr-2" />
                  Télécharger PNG
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// Sous-composant pour afficher le QR dans le navigateur
function QRPreview({ url, color }: { url: string; color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const draw = async () => {
      if (!canvasRef.current) return
      try {
        const QRCode = await import('qrcode')
        await QRCode.toCanvas(canvasRef.current, url, {
          width: 120,
          margin: 1,
          color: { dark: color, light: '#FFFFFF' },
        })
      } catch { /* ignore preview errors */ }
    }
    draw()
  }, [url, color])

  return <canvas ref={canvasRef} style={{ width: 120, height: 120 }} />
}
