import { type NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase/middleware'

// Rate limiter in-memory pour les tentatives de login
const loginAttempts = new Map<string, { count: number; resetAt: number }>()

function checkLoginRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = loginAttempts.get(ip)
  if (!entry || entry.resetAt < now) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 })
    return true
  }
  if (entry.count >= 10) return false
  entry.count++
  return true
}

function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || request.headers.get('x-real-ip')
    || 'unknown'
}

export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request)
  const { pathname } = request.nextUrl

  // Rate limiting login/register
  if (pathname === '/auth/login' || pathname === '/auth/register') {
    if (request.method === 'POST') {
      const ip = getClientIP(request)
      if (!checkLoginRateLimit(ip)) {
        return NextResponse.json(
          { error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
          { status: 429 }
        )
      }
    }
  }

  // Bloquer les crons non autorisés au niveau middleware (défense en profondeur)
  if (pathname.startsWith('/api/cron')) {
    const authHeader = request.headers.get('authorization')
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    return response
  }

  // Vérification session — getUser() valide le JWT côté serveur
  // Note: dans le middleware on utilise getSession() car getUser() fait un appel réseau
  // qui ralentit TOUTES les requêtes. La protection forte (getUser) est dans les API routes.
  const { data: { session } } = await supabase.auth.getSession()

  // Protéger /dashboard
  if (pathname.startsWith('/dashboard')) {
    if (!session) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Protéger /admin — session + vérification rôle en DB
  if (pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login?redirect=/admin', request.url))
    }
    // Vérification admin en DB (le middleware peut utiliser supabase anon avec session)
    const { data: adminData } = await supabase
      .from('admins')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    if (!adminData) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Rediriger utilisateurs déjà connectés hors des pages auth
  if (pathname.startsWith('/auth') && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/auth/:path*',
    '/api/cron/:path*',
  ],
}
