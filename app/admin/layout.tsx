import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/admin/AdminSidebar'
import { Toaster } from '@/components/ui/toaster'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) redirect('/auth/login')

  // Vérifier le rôle admin via service_role (contourne RLS)
  const adminSupabase = createAdminClient()
  const { data: adminData } = await adminSupabase
    .from('admins')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!adminData) redirect('/dashboard')

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  )
}
