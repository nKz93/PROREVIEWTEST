import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-guard'
import { checkRateLimit } from '@/lib/rate-limit'
import { generateApiKey } from '@/lib/api-key'
import { sanitizeString, isUUID } from '@/lib/sanitize'

// POST — créer une clé API
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth.error) return auth.error

  if (auth.business.plan !== 'business') {
    return NextResponse.json({ error: 'Plan Business requis' }, { status: 403 })
  }

  // Max 10 clés au total
  const supabase = createAdminClient()
  const { count } = await supabase
    .from('api_keys')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', auth.business.id)
    .eq('is_active', true)

  if ((count || 0) >= 10) {
    return NextResponse.json({ error: 'Maximum 10 clés API actives' }, { status: 409 })
  }

  const rl = checkRateLimit({ windowMs: 3_600_000, max: 10, identifier: `keys:${auth.business.id}` })
  if (!rl.allowed) return NextResponse.json({ error: 'Trop de clés créées' }, { status: 429 })

  const body = await request.json()
  const name = sanitizeString(body.name, 100)
  if (!name) return NextResponse.json({ error: 'Nom requis' }, { status: 400 })

  const { rawKey, hash, prefix } = generateApiKey()

  const { data: key, error } = await supabase.from('api_keys').insert({
    business_id: auth.business.id,
    name,
    key_hash: hash,   // ← Seul le hash est stocké
    key_prefix: prefix,
  }).select('id, name, key_prefix, is_active, created_at').single()

  if (error) return NextResponse.json({ error: 'Erreur création' }, { status: 500 })

  return NextResponse.json({ key, rawKey }, { status: 201 }) // rawKey affiché une seule fois
}

// DELETE — révoquer une clé
export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth.error) return auth.error

  const url = new URL(request.url)
  const keyId = url.searchParams.get('id')
  if (!isUUID(keyId)) return NextResponse.json({ error: 'ID invalide' }, { status: 400 })

  const supabase = createAdminClient()

  // Ownership check
  const { data: key } = await supabase
    .from('api_keys')
    .select('business_id')
    .eq('id', keyId)
    .single()

  if (!key || key.business_id !== auth.business.id) {
    return NextResponse.json({ error: 'Clé introuvable' }, { status: 404 })
  }

  await supabase.from('api_keys').delete().eq('id', keyId)
  return NextResponse.json({ success: true })
}
