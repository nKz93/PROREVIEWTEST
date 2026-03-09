"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Building2, Users, CreditCard,
  TrendingUp, Settings, LogOut, Shield, Star, Bell
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Vue globale' },
  { href: '/admin/businesses', icon: Building2, label: 'Commerces' },
  { href: '/admin/users', icon: Users, label: 'Utilisateurs' },
  { href: '/admin/subscriptions', icon: CreditCard, label: 'Abonnements' },
  { href: '/admin/revenues', icon: TrendingUp, label: 'Revenus' },
  { href: '/admin/broadcast', icon: Bell, label: 'Broadcast email' },
  { href: '/admin/settings', icon: Settings, label: 'Paramètres' },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <aside className="w-64 min-h-screen bg-gray-950 text-gray-300 flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">ProReview Admin</p>
            <p className="text-xs text-gray-500">Super Admin Panel</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-800 space-y-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-all"
        >
          <Star className="w-4 h-4" />
          Dashboard commerçant
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Déconnexion
        </button>
      </div>
    </aside>
  )
}
