import { NextRequest, NextResponse } from 'next/server'
import { sendSMS } from '@/lib/twilio'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAuth, checkSMSQuota } from '@/lib/auth-guard'
import { checkRateLimit, getIP } from '@/lib/rate-limit'
import { sanitizePhone, isUUID } from '@/lib/sanitize'

export async function POST(request: NextRequest) {
  // Rate limit : 30 requêtes par minute par IP
  const ip = getIP(request)
  const rl = checkRateLimit({ windowMs: 60_000, max: 30, identifier: `sms:${ip}` })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Trop de requêtes. Réessayez dans une minute.' }, {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
    })
  }

  // Auth obligatoire
  const auth = await requireAuth(request)
  if (auth.error) return auth.error

  // Quota SMS
  const quotaError = checkSMSQuota(auth.business)
  if (quotaError) return quotaError

  try {
    const body = await request.json()
    const { to, message, requestCode } = body

    // Validation
    const phone = sanitizePhone(to)
    if (!phone) return NextResponse.json({ error: 'Numéro de téléphone invalide' }, { status: 400 })
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message manquant' }, { status: 400 })
    }
    if (message.length > 800) {
      return NextResponse.json({ error: 'Message trop long (max 800 caractères)' }, { status: 400 })
    }

    // Vérifier que requestCode appartient bien à ce business
    if (requestCode) {
      if (typeof requestCode !== 'string' || !/^[A-Za-z0-9]{8,20}$/.test(requestCode)) {
        return NextResponse.json({ error: 'Code invalide' }, { status: 400 })
      }
      const supabase = createAdminClient()
      const { data: reviewReq } = await supabase
        .from('review_requests')
        .select('business_id')
        .eq('unique_code', requestCode)
        .single()

      if (!reviewReq || reviewReq.business_id !== auth.business.id) {
        return NextResponse.json({ error: 'Code non autorisé' }, { status: 403 })
      }
    }

    const result = await sendSMS(phone, message)

    if (requestCode) {
      const supabase = createAdminClient()
      await supabase.from('review_requests')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('unique_code', requestCode)
      // Incrémenter le compteur SMS
      await supabase.rpc('increment_sms_count', { business_id: auth.business.id })
    }

    return NextResponse.json({ success: true, sid: result.sid })
  } catch (error) {
    console.error('Erreur envoi SMS:', error)
    return NextResponse.json({ error: 'Erreur lors de l\'envoi du SMS' }, { status: 500 })
  }
}
