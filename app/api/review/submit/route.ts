import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { checkRateLimit, getIP } from '@/lib/rate-limit'
import { sanitizeString, sanitizeScore, isUUID } from '@/lib/sanitize'

const VALID_ACTIONS = new Set(['redirect_google', 'private_feedback'])
const VALID_CATEGORIES = new Set(['service', 'qualite', 'attente', 'proprete', 'prix', 'general', 'autre'])

export async function POST(request: NextRequest) {
  // Rate limit strict : 5 soumissions par 10 minutes par IP (anti-spam)
  const ip = getIP(request)
  const rl = checkRateLimit({ windowMs: 600_000, max: 5, identifier: `review:${ip}` })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Trop de soumissions. Réessayez plus tard.' }, { status: 429 })
  }

  try {
    const body = await request.json()
    const { requestId, score, action, feedback, category } = body

    // Validation stricte de chaque champ
    if (!isUUID(requestId)) {
      return NextResponse.json({ error: 'requestId invalide' }, { status: 400 })
    }
    const validScore = sanitizeScore(score)
    if (validScore === null) {
      return NextResponse.json({ error: 'Score invalide (1-5)' }, { status: 400 })
    }
    if (!VALID_ACTIONS.has(action)) {
      return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Vérifier que la demande existe et n'a pas déjà été soumise
    const { data: reviewReq } = await supabase
      .from('review_requests')
      .select('id, status, business_id, customer_id')
      .eq('id', requestId)
      .single()

    if (!reviewReq) {
      return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 })
    }

    // Anti double-soumission : si déjà soumis, retourner silencieusement
    if (reviewReq.status === 'reviewed' || reviewReq.status === 'feedback') {
      return NextResponse.json({ success: true, alreadySubmitted: true })
    }

    // Enregistrer le clic
    await supabase.from('review_clicks').insert({
      request_id: requestId,
      satisfaction_score: validScore,
      action,
      user_agent: (request.headers.get('user-agent') || '').slice(0, 500),
      ip_address: ip,
    })

    // Mettre à jour le statut
    const newStatus = action === 'redirect_google' ? 'reviewed' : 'feedback'
    await supabase.from('review_requests').update({
      status: newStatus,
      clicked_at: new Date().toISOString(),
      reviewed_at: action === 'redirect_google' ? new Date().toISOString() : null,
    }).eq('id', requestId)

    // Feedback privé : valider et sanitiser
    if (action === 'private_feedback') {
      const message = sanitizeString(feedback, 2000)
      if (!message) {
        return NextResponse.json({ error: 'Message de feedback vide' }, { status: 400 })
      }
      const validCategory = VALID_CATEGORIES.has(category) ? category : 'general'

      await supabase.from('private_feedbacks').insert({
        business_id: reviewReq.business_id,   // ← Depuis la DB, pas du body
        request_id: requestId,
        customer_id: reviewReq.customer_id,    // ← Depuis la DB, pas du body
        score: validScore,
        message,
        category: validCategory,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur soumission avis:', error)
    return NextResponse.json({ error: 'Erreur lors de la soumission' }, { status: 500 })
  }
}
