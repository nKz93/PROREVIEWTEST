import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/resend'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

// Convertit les sauts de ligne en <br> après échappement HTML
function textToHtml(str: string): string {
  return escapeHtml(str).replace(/\n/g, '<br>')
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const adminSupabase = createAdminClient()
    const { data: adminData } = await adminSupabase
      .from('admins')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!adminData) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

    const raw = await request.json()

    const subject = typeof raw.subject === 'string' ? raw.subject.trim().slice(0, 200) : ''
    const body = typeof raw.body === 'string' ? raw.body.trim().slice(0, 10000) : ''
    const broadcastId = typeof raw.broadcastId === 'string' ? raw.broadcastId : null

    if (!subject || !body) {
      return NextResponse.json({ error: 'Sujet et corps requis' }, { status: 400 })
    }

    const VALID_PLANS = new Set(['free', 'starter', 'pro', 'business'])
    const targetPlans: string[] = Array.isArray(raw.targetPlans)
      ? raw.targetPlans.filter((p: unknown) => typeof p === 'string' && VALID_PLANS.has(p))
      : ['free', 'starter', 'pro', 'business']

    if (targetPlans.length === 0) {
      return NextResponse.json({ error: 'Au moins un plan requis' }, { status: 400 })
    }

    const { data: businesses } = await adminSupabase
      .from('businesses')
      .select('id, name, email, plan')
      .in('plan', targetPlans)
      .neq('email', '')
      .not('email', 'is', null)

    if (!businesses || businesses.length === 0) {
      return NextResponse.json({ success: true, sent: 0 })
    }

    if (broadcastId) {
      await adminSupabase.from('admin_broadcasts').update({ status: 'sending' }).eq('id', broadcastId)
    }

    let sentCount = 0

    for (const biz of businesses) {
      try {
        // Remplacer les variables dans le texte brut AVANT conversion HTML
        const personalizedText = body
          .replace(/\{name\}/g, biz.name)
          .replace(/\{plan\}/g, biz.plan)

        // Échapper et convertir les sauts de ligne en <br>
        const bodyHtml = textToHtml(personalizedText)

        const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: -apple-system, sans-serif; background: #f8fafc; margin: 0; padding: 20px; }
  .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 32px; text-align: center; }
  .header h1 { color: white; font-size: 22px; font-weight: 800; margin: 0; }
  .body { padding: 28px 32px; color: #374151; font-size: 15px; line-height: 1.8; }
  .footer { padding: 20px 32px; background: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8; }
  .cta { display: inline-block; margin-top: 20px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; font-weight: 600; padding: 12px 28px; border-radius: 12px; font-size: 14px; }
</style></head>
<body>
<div class="container">
  <div class="header"><h1>ProReview</h1></div>
  <div class="body">
    <p>Bonjour ${escapeHtml(biz.name)},</p>
    <br>
    <p>${bodyHtml}</p>
    <br>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="cta">Accéder à mon dashboard →</a>
  </div>
  <div class="footer">ProReview · Vous recevez cet email car vous êtes client ProReview</div>
</div>
</body>
</html>`

        await sendEmail({ to: biz.email, subject: escapeHtml(subject), html })
        sentCount++
        await new Promise(r => setTimeout(r, 100))
      } catch { /* skip individual failures */ }
    }

    if (broadcastId) {
      await adminSupabase.from('admin_broadcasts').update({
        status: 'sent',
        sent_count: sentCount,
        sent_at: new Date().toISOString(),
      }).eq('id', broadcastId)
    }

    return NextResponse.json({ success: true, sent: sentCount })
  } catch (error) {
    console.error('Erreur broadcast:', error)
    return NextResponse.json({ error: 'Erreur broadcast' }, { status: 500 })
  }
}
