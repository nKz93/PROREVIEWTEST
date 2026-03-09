"use client"
import { Shield, Bell } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface AdminTopBarProps {
  title: string
  subtitle?: string
}

export default function AdminTopBar({ title, subtitle }: AdminTopBarProps) {
  return (
    <header className="h-16 bg-gray-950 border-b border-gray-800 flex items-center justify-between px-6">
      <div>
        <h1 className="text-white font-semibold">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs">
          <Shield className="w-3 h-3 mr-1" />
          Super Admin
        </Badge>
      </div>
    </header>
  )
}
