import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-guard'
import { checkRateLimit } from '@/lib/rate-limit'
import { sanitizeEmail, sanitizeString, isUUID } from '@/lib/sanitize'
import { sendEmail } from '@/lib/resend'

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth.error) return auth.error

  // Max 50 réponses par heure
  const rl = checkRateLimit({ windowMs: 3_600_000, max: 50, identifier: `reply:${auth.business.id}` })
  if (!rl.allowed) return NextResponse.json({ error: 'Trop de réponses envoyées' }, { status: 429 })

  try {
    const body = await request.json()
    const { feedbackId, replyMessage } = body

    if (!isUUID(feedbackId)) return NextResponse.json({ error: 'feedbackId invalide' }, { status: 400 })
    const message = sanitizeString(replyMessage, 2000)
    if (!message) return NextResponse.json({ error: 'Message vide' }, { status: 400 })

    const supabase = createAdminClient()

    // Vérifier ownership du feedback + récupérer l'email du client
    const { data: feedback } = await supabase
      .from('private_feedbacks')
      .select('id, business_id, message, customer:customers(name, email)')
      .eq('id', feedbackId)
      .eq('business_id', auth.business.id) // ← ownership strict
      .single()

    if (!feedback) return NextResponse.json({ error: 'Feedback introuvable ou non autorisé' }, { status: 404 })

    // Vérifier qu'une réponse n'existe pas déjà
    const { data: existing } = await supabase
      .from('feedback_replies')
      .select('id')
      .eq('feedback_id', feedbackId)
      .maybeSingle()

    if (existing) return NextResponse.json({ error: 'Ce feedback a déjà reçu une réponse' }, { status: 409 })

    const customer = (feedback.customer as unknown) as { name: string | null; email: string | null } | null
    const customerEmail = sanitizeEmail(customer?.email)

    if (customerEmail) {
      const businessName = auth.business.name as string
      const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,sans-serif;background:#f9fafb;margin:0;padding:20px;">
<div style="max-width:520px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);padding:32px 24px;text-align:center;">
    <h1 style="color:white;margin:0;font-size:22px;font-weight:700;">${sanitizeString(businessName, 100)}</h1>
    <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">vous a répondu</p>
  </div>
  <div style="padding:28px 24px;">
    <p style="color:#374151;font-size:15px;margin:0 0 20px;">Bonjour ${sanitizeString(customer?.name || '', 100)},</p>
    <div style="background:#f0f9ff;border-left:4px solid #3b82f6;border-radius:8px;padding:16px;margin-bottom:20px;">
      <p style="color:#1e40af;font-size:14px;margin:0;line-height:1.6;">${sanitizeString(message, 2000)}</p>
    </div>
    <div style="background:#f9fafb;border-radius:8px;padding:14px;margin-bottom:20px;">
      <p style="color:#9ca3af;font-size:12px;margin:0 0 6px;text-transform:uppercase;">Votre message</p>
      <p style="color:#6b7280;font-size:13px;margin:0;font-style:italic;">"${sanitizeString(feedback.message, 500)}"</p>
    </div>
  </div>
  <div style="padding:16px 24px;background:#f9fafb;border-top:1px solid #f3f4f6;text-align:center;">
    <p style="color:#9ca3af;font-size:11px;margin:0;">Propulsé par <strong>ProReview</strong></p>
  </div>
</div></body></html>`

      await sendEmail({
        to: customerEmail,
        subject: `Réponse de ${sanitizeString(businessName, 100)} à votre avis`,
        html,
      })
    }

    // Enregistrer la réponse
    await supabase.from('feedback_replies').insert({
      feedback_id: feedbackId,
      business_id: auth.business.id,
      message,
    })

    // Marquer résolu
    await supabase.from('private_feedbacks').update({
      is_read: true,
      is_resolved: true,
      resolved_at: new Date().toISOString(),
    }).eq('id', feedbackId)

    return NextResponse.json({ success: true, emailSent: !!customerEmail })
  } catch (error) {
    console.error('Erreur réponse feedback:', error)
    return NextResponse.json({ error: 'Erreur envoi' }, { status: 500 })
  }
}
