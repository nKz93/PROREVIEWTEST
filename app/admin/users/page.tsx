"use client"
import { useState, useEffect } from 'react'
import AdminTopBar from '@/components/admin/AdminTopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import type { AdminUser, AdminEntry } from '@/types/admin'
import { formatDateTime } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { Search, Shield, Trash2, UserCheck, Users } from 'lucide-react'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [admins, setAdmins] = useState<AdminEntry[]>([])
  const [search, setSearch] = useState('')
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchAll = async () => {
    const supabase = createClient()
    const [{ data: bizData }, { data: adminData }] = await Promise.all([
      supabase.from('businesses').select('id, name, email, plan, created_at').order('created_at', { ascending: false }),
      supabase.from('admins').select('*').order('created_at', { ascending: false }),
    ])
    setUsers(bizData || [])
    setAdmins(adminData || [])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) return
    const supabase = createClient()
    // Trouver le user_id depuis l'email
    const { data: biz } = await supabase
      .from('businesses')
      .select('id, email')
      .ilike('email', newAdminEmail.trim())
      .single()

    if (!biz) {
      toast({ title: 'Utilisateur introuvable', description: 'Aucun compte avec cet email', variant: 'destructive' })
      return
    }

    const { error } = await supabase.from('admins').insert({
      email: newAdminEmail.trim(),
      role: 'admin',
    })

    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Admin ajouté ✅' })
      setNewAdminEmail('')
      fetchAll()
    }
  }

  const handleRemoveAdmin = async (adminId: string) => {
    if (!confirm('Retirer les droits admin à cet utilisateur ?')) return
    const supabase = createClient()
    await supabase.from('admins').delete().eq('id', adminId)
    toast({ title: 'Droits admin retirés' })
    fetchAll()
  }

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <Toaster />
      <AdminTopBar title="Utilisateurs" subtitle={`${users.length} comptes inscrits`} />
      <div className="p-6 space-y-6">

        {/* Admins */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-orange-400" />
              Administrateurs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Ajouter admin */}
            <div className="flex gap-2">
              <Input
                placeholder="Email de l'utilisateur à promouvoir admin..."
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
              <Button onClick={handleAddAdmin} className="bg-orange-500 hover:bg-orange-600 text-white shrink-0">
                <UserCheck className="w-4 h-4 mr-2" />
                Ajouter admin
              </Button>
            </div>
            {/* Liste admins */}
            <div className="divide-y divide-gray-800 rounded-xl border border-gray-800 overflow-hidden">
              {admins.length === 0 ? (
                <p className="text-center text-gray-500 text-sm py-6">Aucun admin configuré</p>
              ) : admins.map((admin) => (
                <div key={admin.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm text-white">{admin.email}</p>
                    <p className="text-xs text-gray-500">
                      {admin.role} · Ajouté le {formatDateTime(admin.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      admin.role === 'superadmin' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {admin.role}
                    </span>
                    {admin.role !== 'superadmin' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAdmin(admin.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-950/30 h-7 w-7 p-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tous les utilisateurs */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              Tous les comptes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Chargement...</div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-800">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      {['Commerce', 'Plan', 'Inscrit le', 'Actions'].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {filtered.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-800/40">
                        <td className="px-5 py-3">
                          <p className="text-sm font-medium text-white">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            user.plan === 'pro' ? 'bg-violet-500/20 text-violet-400' :
                            user.plan === 'business' ? 'bg-orange-500/20 text-orange-400' :
                            user.plan === 'starter' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-gray-700 text-gray-400'
                          }`}>
                            {user.plan}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-500">
                          {formatDateTime(user.created_at)}
                        </td>
                        <td className="px-5 py-3">
                          <a href={`/admin/businesses/${user.id}`}
                            className="text-xs text-orange-400 hover:text-orange-300">
                            Voir →
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
