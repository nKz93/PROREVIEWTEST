import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Whitelist des paths autorisés après callback OAuth
const ALLOWED_PATHS = ['/dashboard', '/admin', '/dashboard/billing', '/dashboard/settings']

function isSafePath(path: string): boolean {
  if (!path.startsWith('/')) return false
  // Interdire les chemins avec protocoles ou doubles slashes (open redirect)
  if (/^\/\//i.test(path) || /^[a-z]+:/i.test(path)) return false
  return ALLOWED_PATHS.some(allowed => path === allowed || path.startsWith(allowed + '/'))
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const nextParam = searchParams.get('next') ?? '/dashboard'
  const next = isSafePath(nextParam) ? nextParam : '/dashboard'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=callback`)
}
