import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { hashApiKey } from '@/lib/api-key'
import { checkRateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer prv_')) {
    return NextResponse.json({ error: 'Clé API invalide' }, { status: 401 })
  }

  const keyHash = hashApiKey(authHeader.slice(7))
  const supabase = createAdminClient()

  const { data: keyRecord } = await supabase
    .from('api_keys')
    .select('business_id')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .single()

  if (!keyRecord) return NextResponse.json({ error: 'Clé API invalide ou expirée' }, { status: 401 })

  const rl = checkRateLimit({ windowMs: 3_600_000, max: 1000, identifier: `v1:${keyRecord.business_id}` })
  if (!rl.allowed) return NextResponse.json({ error: 'Rate limit atteint' }, { status: 429 })

  const { data } = await supabase
    .from('review_requests')
    .select('id, status, method, created_at, sent_at, reviewed_at, customer:customers(name)')
    .eq('business_id', keyRecord.business_id)
    .eq('status', 'reviewed')
    .order('reviewed_at', { ascending: false })
    .limit(50)

  return NextResponse.json({ data })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    },
  })
}
