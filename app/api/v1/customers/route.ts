import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { hashApiKey } from '@/lib/api-key'
import { checkRateLimit } from '@/lib/rate-limit'
import { sanitizeString, sanitizePhone, sanitizeEmail, sanitizeTags } from '@/lib/sanitize'

async function getBusinessFromApiKey(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const rawKey = authHeader.slice(7)
  if (!rawKey.startsWith('prv_') || rawKey.length < 20) return null

  // Comparer par hash — la clé en clair n'est jamais stockée
  const keyHash = hashApiKey(rawKey)
  const supabase = createAdminClient()

  const { data: keyRecord } = await supabase
    .from('api_keys')
    .select('id, business_id, business:businesses(*)')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .single()

  if (!keyRecord) return null

  await supabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', keyRecord.id)
  return (keyRecord.business as unknown) as Record<string, unknown>
}

export async function GET(request: NextRequest) {
  const business = await getBusinessFromApiKey(request)
  if (!business) return NextResponse.json({ error: 'Clé API invalide ou expirée' }, { status: 401 })

  // Rate limit par clé : 1000/heure
  const rl = checkRateLimit({ windowMs: 3_600_000, max: 1000, identifier: `v1:${business.id}` })
  if (!rl.allowed) return NextResponse.json({ error: 'Rate limit atteint' }, { status: 429 })

  const url = new URL(request.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)
  const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0)

  const supabase = createAdminClient()
  const { data, count } = await supabase
    .from('customers')
    .select('id, name, phone, email, tags, source, visit_date, created_at', { count: 'exact' })
    .eq('business_id', business.id as string)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  return NextResponse.json({ data, meta: { total: count, limit, offset } })
}

export async function POST(request: NextRequest) {
  const business = await getBusinessFromApiKey(request)
  if (!business) return NextResponse.json({ error: 'Clé API invalide ou expirée' }, { status: 401 })

  const rl = checkRateLimit({ windowMs: 3_600_000, max: 1000, identifier: `v1:${business.id}` })
  if (!rl.allowed) return NextResponse.json({ error: 'Rate limit atteint' }, { status: 429 })

  const body = await request.json()
  const name = sanitizeString(body.name, 200)
  const phone = sanitizePhone(body.phone)
  const email = sanitizeEmail(body.email)
  const tags = sanitizeTags(body.tags)

  if (!name) return NextResponse.json({ error: 'name requis' }, { status: 400 })
  if (!phone && !email) return NextResponse.json({ error: 'phone ou email requis' }, { status: 400 })

  const supabase = createAdminClient()
  const { data, error } = await supabase.from('customers').insert({
    business_id: business.id,
    name, phone, email, tags,
    source: 'api',
    visit_date: new Date().toISOString(),
  }).select('id, name, phone, email, tags, created_at').single()

  if (error) return NextResponse.json({ error: 'Erreur création client' }, { status: 400 })
  return NextResponse.json({ data }, { status: 201 })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    },
  })
}
