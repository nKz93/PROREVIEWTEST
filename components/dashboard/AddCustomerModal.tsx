"use client"
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, UserPlus, Phone, Mail, Calendar, Tag, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/use-toast'
import { markOnboardingStep } from '@/lib/onboarding'

interface AddCustomerModalProps {
  businessId: string
  onSuccess: () => void
}

export default function AddCustomerModal({ businessId, onSuccess }: AddCustomerModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    visit_date: new Date().toISOString().slice(0, 10),
    notes: '',
    tags: [] as string[],
  })

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !form.tags.includes(t)) {
      setForm(prev => ({ ...prev, tags: [...prev.tags, t] }))
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Champ requis', description: 'Le nom est obligatoire', variant: 'destructive' })
      return
    }
    if (!form.phone && !form.email) {
      toast({ title: 'Contact requis', description: 'Ajoutez un téléphone ou un email', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('customers').insert({
        business_id: businessId,
        name: form.name.trim(),
        phone: form.phone || null,
        email: form.email || null,
        visit_date: new Date(form.visit_date).toISOString(),
        tags: form.tags,
        source: 'manual',
      })
      if (error) throw error
      await markOnboardingStep(businessId, 'step_first_customer')
      toast({ title: `${form.name} ajouté ✅`, description: 'Client ajouté avec succès' })
      setForm({ name: '', phone: '', email: '', visit_date: new Date().toISOString().slice(0, 10), notes: '', tags: [] })
      setOpen(false)
      onSuccess()
    } catch (err) {
      toast({ title: 'Erreur', description: 'Impossible d\'ajouter le client', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button variant="gradient" onClick={() => setOpen(true)}>
        <UserPlus className="w-4 h-4 mr-2" />
        Ajouter un client
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 gradient-primary rounded-xl flex items-center justify-center">
                <UserPlus className="w-4 h-4 text-white" />
              </div>
              Nouveau client
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Nom */}
            <div>
              <Label>Nom complet <span className="text-red-500">*</span></Label>
              <Input
                placeholder="Marie Dupont"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="mt-1"
                autoFocus
              />
            </div>

            {/* Téléphone + Email */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Téléphone
                </Label>
                <Input
                  type="tel"
                  placeholder="+33 6 12 34 56 78"
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Email
                </Label>
                <Input
                  type="email"
                  placeholder="marie@exemple.fr"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Date de visite */}
            <div>
              <Label className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Date de visite
              </Label>
              <Input
                type="date"
                value={form.visit_date}
                onChange={e => setForm(p => ({ ...p, visit_date: e.target.value }))}
                className="mt-1"
              />
            </div>

            {/* Tags */}
            <div>
              <Label className="flex items-center gap-1">
                <Tag className="w-3 h-3" /> Tags (optionnel)
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  placeholder="Ex: VIP, Habitué..."
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                />
                <Button type="button" variant="outline" size="sm" onClick={addTag}>+</Button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Boutons */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button variant="gradient" className="flex-1" onClick={handleSubmit} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
                Ajouter le client
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
