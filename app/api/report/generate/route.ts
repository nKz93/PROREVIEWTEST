import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAuth, requireCronSecret } from '@/lib/auth-guard'
import { checkRateLimit } from '@/lib/rate-limit'
import { sendEmail } from '@/lib/resend'

// Échappement HTML pour prévenir les injections XSS dans les emails
function esc(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

function buildReportHTML(data: {
  businessName: string; period: string; sent: number; reviewed: number
  feedbacks: number; smsUsed: number; smsLimit: number
  topFeedbacks: Array<{ score: number; category: string; message: string }>
  plan: string
}): string {
  const convRate = data.sent > 0 ? Math.round((data.reviewed / data.sent) * 100) : 0
  const smsPercent = Math.round((data.smsUsed / data.smsLimit) * 100)
  // Données utilisateur échappées avant injection dans le HTML
  const safeName = esc(data.businessName)
  const safePeriod = esc(data.period)
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;color:#1e293b}
    .container{max-width:640px;margin:0 auto;padding:24px}
    .header{background:linear-gradient(135deg,#3b82f6,#8b5cf6);border-radius:20px;padding:36px;text-align:center;margin-bottom:24px}
    .header h1{color:white;font-size:28px;font-weight:800;margin-bottom:6px}
    .header p{color:rgba(255,255,255,0.8);font-size:14px}
    .badge{display:inline-block;background:rgba(255,255,255,0.2);color:white;font-size:12px;padding:4px 12px;border-radius:100px;margin-top:8px}
    .section-title{font-size:14px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.08em;margin:24px 0 12px}
    .kpi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:8px}
    .kpi{background:white;border-radius:16px;padding:20px;text-align:center;box-shadow:0 1px 6px rgba(0,0,0,.06)}
    .kpi .number{font-size:36px;font-weight:800;background:linear-gradient(135deg,#3b82f6,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
    .kpi .label{font-size:11px;color:#94a3b8;margin-top:4px;font-weight:500}
    .card{background:white;border-radius:16px;padding:20px;box-shadow:0 1px 6px rgba(0,0,0,.06);margin-bottom:12px}
    .progress-bar{background:#e2e8f0;border-radius:100px;height:8px;margin-top:6px;overflow:hidden}
    .progress-fill{height:100%;border-radius:100px;background:linear-gradient(to right,#3b82f6,#8b5cf6)}
    .feedback-item{border-left:3px solid #e2e8f0;padding-left:12px;margin-bottom:12px}
    .stars{color:#f59e0b;font-size:13px}
    .feedback-text{font-size:13px;color:#475569;margin-top:2px;line-height:1.5}
    .footer{text-align:center;margin-top:24px}
    .footer a{display:inline-block;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:white;text-decoration:none;font-weight:600;padding:12px 32px;border-radius:12px;font-size:14px}
    .footer p{color:#94a3b8;font-size:11px;margin-top:12px}
  </style></head><body>
  <div class="container">
    <div class="header">
      <h1>📊 Rapport mensuel</h1>
      <p>${safeName}</p>
      <div class="badge">${safePeriod}</div>
    </div>
    <p class="section-title">Résultats du mois</p>
    <div class="kpi-grid">
      <div class="kpi"><div class="number">${data.sent}</div><div class="label">Demandes envoyées</div></div>
      <div class="kpi"><div class="number">${data.reviewed}</div><div class="label">Avis Google obtenus</div></div>
      <div class="kpi"><div class="number">${convRate}%</div><div class="label">Taux de conversion</div></div>
    </div>
    <div class="card">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px">
        <span style="font-size:13px;font-weight:600;color:#374151">Quota SMS</span>
        <span style="font-size:13px;color:#64748b">${data.smsUsed} / ${data.smsLimit}</span>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${smsPercent}%"></div></div>
      <p style="font-size:11px;color:#94a3b8;margin-top:6px">${data.smsLimit - data.smsUsed} SMS restants</p>
    </div>
    ${data.feedbacks > 0 && data.topFeedbacks.length > 0
      ? `<p class="section-title">Feedbacks à traiter (${data.feedbacks})</p>
         <div class="card">${data.topFeedbacks.slice(0, 3).map(f =>
           `<div class="feedback-item">
              <div class="stars">${'★'.repeat(f.score)}${'☆'.repeat(5 - f.score)}</div>
              <p class="feedback-text">"${esc(f.message).slice(0, 120)}${f.message.length > 120 ? '…' : ''}"</p>
            </div>`).join('')}
         </div>`
      : `<div class="card" style="text-align:center;padding:24px">
           <p style="font-size:28px;margin-bottom:8px">🎉</p>
           <p style="font-weight:700;color:#10b981">Aucun feedback négatif ce mois !</p>
         </div>`}
    <div class="footer">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">Voir mon dashboard</a>
      <p>Rapport généré par ProReview · Plan ${data.plan}</p>
    </div>
  </div></body></html>`
}

async function generateForBusiness(businessId: string, shouldSendEmail: boolean) {
  const supabase = createAdminClient()
  const { data: business } = await supabase.from('businesses').select('*').eq('id', businessId).single()
  if (!business) return null

  const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0)
  const period = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  const [{ count: sent }, { count: reviewed }, { count: feedbacks }, { data: rawFeedbacks }] = await Promise.all([
    supabase.from('review_requests').select('*', { count: 'exact', head: true }).eq('business_id', businessId).gte('created_at', startOfMonth.toISOString()),
    supabase.from('review_requests').select('*', { count: 'exact', head: true }).eq('business_id', businessId).eq('status', 'reviewed').gte('created_at', startOfMonth.toISOString()),
    supabase.from('private_feedbacks').select('*', { count: 'exact', head: true }).eq('business_id', businessId).eq('is_read', false),
    supabase.from('private_feedbacks').select('score, category, message').eq('business_id', businessId).eq('is_resolved', false).limit(5),
  ])

  const reportData = {
    businessName: business.name,
    period: period.charAt(0).toUpperCase() + period.slice(1),
    sent: sent || 0,
    reviewed: reviewed || 0,
    feedbacks: feedbacks || 0,
    smsUsed: business.monthly_sms_used || 0,
    smsLimit: business.monthly_sms_limit || 50,
    topFeedbacks: (rawFeedbacks || []) as Array<{ score: number; category: string; message: string }>,
    plan: business.plan,
  }

  const html = buildReportHTML(reportData)
  if (shouldSendEmail && business.email) {
    await sendEmail({ to: business.email, subject: `📊 Votre rapport ProReview — ${reportData.period}`, html })
  }
  return { html, data: reportData }
}

// POST — déclenché manuellement par un commerçant authentifié (son propre rapport)
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth.error) return auth.error

  // Max 5 rapports générés par jour
  const rl = checkRateLimit({ windowMs: 86_400_000, max: 5, identifier: `report:${auth.business.id}` })
  if (!rl.allowed) return NextResponse.json({ error: 'Limite de génération atteinte' }, { status: 429 })

  try {
    const body = await request.json()
    // On ignore le businessId du body — on utilise TOUJOURS celui de l'utilisateur authentifié
    const result = await generateForBusiness(auth.business.id as string, body.sendEmail === true)
    if (!result) return NextResponse.json({ error: 'Erreur génération' }, { status: 500 })
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Erreur rapport:', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

// GET — cron mensuel uniquement, sécurisé par CRON_SECRET
export async function GET(request: NextRequest) {
  const cronError = requireCronSecret(request)
  if (cronError) return cronError

  const supabase = createAdminClient()
  const { data: businesses } = await supabase.from('businesses').select('id').neq('email', '')

  let sent = 0
  for (const biz of businesses || []) {
    try {
      await generateForBusiness(biz.id, true)
      sent++
      await new Promise(r => setTimeout(r, 200))
    } catch { /* skip individual failures */ }
  }

  return NextResponse.json({ success: true, sent })
}
