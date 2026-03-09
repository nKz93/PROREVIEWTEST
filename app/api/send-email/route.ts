import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, buildReviewEmailHTML } from '@/lib/resend'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-guard'
import { checkRateLimit, getIP } from '@/lib/rate-limit'
import { sanitizeEmail, isUUID } from '@/lib/sanitize'

export async function POST(request: NextRequest) {
  // Rate limit : 60/min par IP
  const ip = getIP(request)
  const rl = checkRateLimit({ windowMs: 60_000, max: 60, identifier: `email:${ip}` })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })
  }

  const auth = await requireAuth(request)
  if (auth.error) return auth.error

  try {
    const body = await request.json()
    const { to, subject, businessName, customerName, reviewUrl, logoUrl, requestCode } = body

    const email = sanitizeEmail(to)
    if (!email) return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
    if (!businessName || !reviewUrl) return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })

    // Vérifier ownership du requestCode
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

    const html = buildReviewEmailHTML({
      businessName: auth.business.name as string,
      customerName: customerName || '',
      reviewUrl,
      logoUrl,
    })

    const result = await sendEmail({
      to: email,
      subject: subject || `Votre avis sur ${auth.business.name}`,
      html,
    })

    if (requestCode) {
      const supabase = createAdminClient()
      await supabase.from('review_requests')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('unique_code', requestCode)
    }

    return NextResponse.json({ success: true, id: result.id })
  } catch (error) {
    console.error('Erreur envoi email:', error)
    return NextResponse.json({ error: 'Erreur envoi email' }, { status: 500 })
  }
}
