"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Star, MessageSquare, QrCode,
  Megaphone, Settings, CreditCard, LogOut, Zap, Gift,
  Globe, Key
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord', exact: true },
  { href: '/dashboard/customers', icon: Users, label: 'Clients' },
  { href: '/dashboard/reviews', icon: Star, label: 'Avis Google' },
  { href: '/dashboard/feedbacks', icon: MessageSquare, label: 'Feedbacks', badge: 'feedbacks' },
  { href: '/dashboard/qr-codes', icon: QrCode, label: 'QR Codes' },
  { href: '/dashboard/campaigns', icon: Megaphone, label: 'Campagnes' },
]

const bottomNavItems = [
  { href: '/dashboard/referral', icon: Gift, label: 'Parrainage 🎁' },
  { href: '/dashboard/widget', icon: Key, label: 'API & Webhooks', planRequired: 'business' },
  { href: '/dashboard/billing', icon: CreditCard, label: 'Abonnement' },
  { href: '/dashboard/settings', icon: Settings, label: 'Paramètres' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-100 flex flex-col shadow-sm">
      {/* Logo */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 gradient-primary rounded-xl flex items-center justify-center">
            <Star className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="font-bold text-gray-900 text-lg">ProReview</span>
        </div>
      </div>

      {/* Nav principale */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
              isActive(item.href, item.exact)
                ? 'gradient-primary text-white shadow-sm'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Nav bas */}
      <div className="p-3 border-t border-gray-100 space-y-0.5">
        {bottomNavItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
              isActive(item.href)
                ? 'gradient-primary text-white shadow-sm'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {item.label}
          </Link>
        ))}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Déconnexion
        </button>
      </div>
    </aside>
  )
}
