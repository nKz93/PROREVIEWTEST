import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-guard'
import { checkRateLimit, getIP } from '@/lib/rate-limit'
import { sanitizeString } from '@/lib/sanitize'
import { generateUniqueCode } from '@/lib/utils'

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth.error) return auth.error

  // Max 20 QR codes générés par heure
  const rl = checkRateLimit({ windowMs: 3_600_000, max: 20, identifier: `qr:${auth.business.id}` })
  if (!rl.allowed) return NextResponse.json({ error: 'Trop de QR codes générés' }, { status: 429 })

  try {
    const body = await request.json()
    const name = sanitizeString(body.name || 'QR Code', 100)
    // Valider la couleur hex
    const color = /^#[0-9A-Fa-f]{6}$/.test(body.color) ? body.color : '#3B82F6'

    const supabase = createAdminClient()

    let shortCode = generateUniqueCode(8)
    let isUnique = false
    let attempts = 0
    while (!isUnique && attempts < 10) {
      const { data } = await supabase.from('qr_codes').select('id').eq('short_code', shortCode).maybeSingle()
      if (!data) isUnique = true
      else { shortCode = generateUniqueCode(8); attempts++ }
    }

    const { data, error } = await supabase.from('qr_codes').insert({
      business_id: auth.business.id, // Toujours du business authentifié, jamais du body
      name,
      short_code: shortCode,
      design_config: { color, style: 'rounded' },
    }).select().single()

    if (error) throw error
    return NextResponse.json({ success: true, qrCode: data, shortCode })
  } catch (error) {
    console.error('Erreur génération QR:', error)
    return NextResponse.json({ error: 'Erreur génération QR code' }, { status: 500 })
  }
}
