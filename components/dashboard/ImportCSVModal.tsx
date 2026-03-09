"use client"
import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, FileText, CheckCircle2, XCircle, Loader2, Download, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/use-toast'

interface ImportCSVModalProps {
  businessId: string
  onSuccess: () => void
}

interface ParsedRow {
  name: string
  phone: string
  email: string
  valid: boolean
  error?: string
}

export default function ImportCSVModal({ businessId, onSuccess }: ImportCSVModalProps) {
  const [open, setOpen] = useState(false)
  const [parsed, setParsed] = useState<ParsedRow[]>([])
  const [importing, setImporting] = useState(false)
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload')
  const [importedCount, setImportedCount] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  const parseCSV = (text: string): ParsedRow[] => {
    const lines = text.trim().split('\n')
    if (lines.length < 2) return []

    // Détecter le séparateur (virgule ou point-virgule)
    const sep = lines[0].includes(';') ? ';' : ','
    const headers = lines[0].toLowerCase().split(sep).map(h => h.trim().replace(/"/g, ''))

    const nameIdx = headers.findIndex(h => ['nom', 'name', 'prénom', 'prenom', 'client'].some(k => h.includes(k)))
    const phoneIdx = headers.findIndex(h => ['tel', 'phone', 'mobile', 'portable', 'gsm'].some(k => h.includes(k)))
    const emailIdx = headers.findIndex(h => ['email', 'mail', 'courriel'].some(k => h.includes(k)))

    return lines.slice(1).map((line, i) => {
      const cols = line.split(sep).map(c => c.trim().replace(/"/g, ''))
      const name = nameIdx >= 0 ? cols[nameIdx] || '' : cols[0] || ''
      const phone = phoneIdx >= 0 ? cols[phoneIdx] || '' : cols[1] || ''
      const email = emailIdx >= 0 ? cols[emailIdx] || '' : cols[2] || ''

      let valid = true
      let error = ''

      if (!name) { valid = false; error = 'Nom manquant' }
      else if (!phone && !email) { valid = false; error = 'Téléphone ou email requis' }

      return { name, phone, email, valid, error }
    }).filter(r => r.name || r.phone || r.email)
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const rows = parseCSV(text)
      setParsed(rows)
      setStep('preview')
    }
    reader.readAsText(file, 'UTF-8')
  }

  const handleImport = async () => {
    setImporting(true)
    try {
      const supabase = createClient()
      const valid = parsed.filter(r => r.valid)
      const toInsert = valid.map(row => ({
        business_id: businessId,
        name: row.name,
        phone: row.phone || null,
        email: row.email || null,
        source: 'csv' as const,
        visit_date: new Date().toISOString(),
        tags: [],
      }))

      // Insérer par batch de 50
      for (let i = 0; i < toInsert.length; i += 50) {
        await supabase.from('customers').insert(toInsert.slice(i, i + 50))
      }

      setImportedCount(valid.length)
      setStep('done')
      onSuccess()
    } catch {
      toast({ title: 'Erreur', description: 'Erreur lors de l\'import', variant: 'destructive' })
    } finally {
      setImporting(false)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setTimeout(() => { setStep('upload'); setParsed([]); setImportedCount(0) }, 300)
  }

  const downloadTemplate = () => {
    const csv = 'nom,telephone,email\nMarie Dupont,+33612345678,marie@exemple.fr\nJean Martin,+33698765432,'
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'template_clients.csv'; a.click()
  }

  const validCount = parsed.filter(r => r.valid).length
  const errorCount = parsed.filter(r => !r.valid).length

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Upload className="w-4 h-4 mr-2" />
        Importer CSV
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Import CSV
            </DialogTitle>
          </DialogHeader>

          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group"
              >
                <Upload className="w-10 h-10 text-gray-300 group-hover:text-blue-400 mx-auto mb-3 transition-colors" />
                <p className="font-medium text-gray-700">Glissez votre fichier CSV ici</p>
                <p className="text-sm text-gray-400 mt-1">ou cliquez pour sélectionner</p>
                <p className="text-xs text-gray-300 mt-3">Formats acceptés : .csv · Séparateur virgule ou point-virgule</p>
              </div>
              <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="text-sm text-gray-600">
                  <p className="font-medium">Format attendu</p>
                  <p className="text-xs text-gray-400 mt-0.5">Colonnes : nom, telephone, email (dans n'importe quel ordre)</p>
                </div>
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="w-3 h-3 mr-2" />
                  Modèle CSV
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-blue-700">{parsed.length}</p>
                  <p className="text-xs text-blue-500">Lignes détectées</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-green-700">{validCount}</p>
                  <p className="text-xs text-green-500">Valides</p>
                </div>
                <div className="bg-red-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-red-700">{errorCount}</p>
                  <p className="text-xs text-red-500">Erreurs</p>
                </div>
              </div>

              {/* Preview table */}
              <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50">
                    <tr>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Statut</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Nom</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Téléphone</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parsed.slice(0, 50).map((row, i) => (
                      <tr key={i} className={row.valid ? '' : 'bg-red-50'}>
                        <td className="px-3 py-2">
                          {row.valid
                            ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                            : <XCircle className="w-4 h-4 text-red-500" />}
                        </td>
                        <td className="px-3 py-2 font-medium">{row.name || <span className="text-gray-300">—</span>}</td>
                        <td className="px-3 py-2 text-gray-500">{row.phone || '—'}</td>
                        <td className="px-3 py-2 text-gray-500">{row.email || <span className={row.error ? 'text-red-400 text-xs' : ''}>{row.error || '—'}</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsed.length > 50 && (
                  <p className="text-center text-xs text-gray-400 py-2">… et {parsed.length - 50} autres lignes</p>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setStep('upload'); setParsed([]) }}>
                  ← Recommencer
                </Button>
                <Button
                  variant="gradient"
                  className="flex-1"
                  onClick={handleImport}
                  disabled={validCount === 0 || importing}
                >
                  {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  Importer {validCount} client{validCount > 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Done */}
          {step === 'done' && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Import terminé !</h3>
              <p className="text-gray-500">{importedCount} client{importedCount > 1 ? 's' : ''} importé{importedCount > 1 ? 's' : ''} avec succès</p>
              <Button variant="gradient" className="mt-6" onClick={handleClose}>
                Voir mes clients
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
