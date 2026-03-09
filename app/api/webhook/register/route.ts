import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-guard'
import { checkRateLimit } from '@/lib/rate-limit'
import { randomBytes } from 'crypto'

// Blocs d'IPs privées/réservées pour prévenir les attaques SSRF
const PRIVATE_IP_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^0\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,   // link-local
  /^::1$/,          // IPv6 loopback
  /^fc00:/i,        // IPv6 private
  /^fe80:/i,        // IPv6 link-local
  /^0\.0\.0\.0$/,
  /^metadata\.google\.internal$/i,  // GCP metadata
]

function isSafeWebhookUrl(urlString: string): { safe: boolean; reason?: string } {
  let parsed: URL
  try {
    parsed = new URL(urlString)
  } catch {
    return { safe: false, reason: 'URL invalide' }
  }

  if (parsed.protocol !== 'https:') {
    return { safe: false, reason: 'HTTPS obligatoire pour les webhooks' }
  }

  const hostname = parsed.hostname.toLowerCase()

  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      return { safe: false, reason: 'Les URLs pointant vers des adresses internes ne sont pas autorisées' }
    }
  }

  // Bloquer les ports non-standards (autoriser seulement 443 et absence de port = 443 par défaut)
  if (parsed.port && parsed.port !== '443') {
    return { safe: false, reason: 'Seul le port 443 (HTTPS standard) est autorisé' }
  }

  return { safe: true }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth.error) return auth.error

  if (auth.business.plan !== 'business') {
    return NextResponse.json({ error: 'Plan Business requis' }, { status: 403 })
  }

  // Rate limit : 10 créations de webhook par heure par business
  const rl = checkRateLimit({ windowMs: 3_600_000, max: 10, identifier: `webhook:${auth.business.id}` })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Trop de webhooks créés. Réessayez dans une heure.' }, { status: 429 })
  }

  const body = await request.json()
  const { url } = body

  if (!url || typeof url !== 'string' || url.length > 500) {
    return NextResponse.json({ error: 'URL invalide' }, { status: 400 })
  }

  // Validation SSRF : HTTPS uniquement, pas d'IPs privées
  const urlCheck = isSafeWebhookUrl(url)
  if (!urlCheck.safe) {
    return NextResponse.json({ error: urlCheck.reason }, { status: 400 })
  }

  // Max 5 webhooks par business
  const supabase = createAdminClient()
  const { count } = await supabase
    .from('webhooks')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', auth.business.id)

  if ((count || 0) >= 5) {
    return NextResponse.json({ error: 'Maximum 5 webhooks par compte' }, { status: 409 })
  }

  // Générer un secret HMAC sécurisé
  const secret = 'whsec_' + randomBytes(32).toString('hex')

  const { data: webhook, error } = await supabase.from('webhooks').insert({
    business_id: auth.business.id,
    url,
    secret,
    events: ['review.received', 'feedback.received', 'request.sent'],
  }).select().single()

  if (error) return NextResponse.json({ error: 'Erreur création webhook' }, { status: 500 })

  return NextResponse.json({ webhook }, { status: 201 })
}
