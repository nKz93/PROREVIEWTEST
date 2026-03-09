"use client"
import { Menu, Bell, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface TopBarProps {
  onMenuClick: () => void
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const [businessName, setBusinessName] = useState('')
  const [plan, setPlan] = useState('')
  const router = useRouter()

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: biz } = await supabase.from('businesses').select('name, plan').eq('user_id', user.id).single()
      if (biz) { setBusinessName(biz.name); setPlan(biz.plan) }
    }
    fetch()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const planColors: Record<string, string> = {
    free: 'bg-gray-100 text-gray-500',
    starter: 'bg-blue-100 text-blue-600',
    pro: 'bg-violet-100 text-violet-600',
    business: 'bg-orange-100 text-orange-600',
  }

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-6 sticky top-0 z-20">
      <button
        className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
        onClick={onMenuClick}
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-3">
        {plan && (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${planColors[plan] || planColors.free}`}>
            {plan}
          </span>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 h-9 px-3 hover:bg-gray-100 rounded-xl">
              <div className="w-7 h-7 gradient-primary rounded-lg flex items-center justify-center text-white text-xs font-bold">
                {businessName.charAt(0).toUpperCase() || 'P'}
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-28 truncate">{businessName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs text-gray-500">{businessName}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">Paramètres</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/billing">Abonnement</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-600 focus:bg-red-50">
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
