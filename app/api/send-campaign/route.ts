import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendSMS } from '@/lib/twilio'
import { sendEmail, buildReviewEmailHTML } from '@/lib/resend'
import { generateUniqueCode, interpolateTemplate, normalizePhone } from '@/lib/utils'
import { requireAuth, checkSMSQuota } from '@/lib/auth-guard'
import { checkRateLimit } from '@/lib/rate-limit'
import { isUUID } from '@/lib/sanitize'
import { APP_URL } from '@/lib/constants'

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth.error) return auth.error

  // Rate limit : 5 lancements de campagne par heure par business
  const rl = checkRateLimit({ windowMs: 3_600_000, max: 5, identifier: `campaign:${auth.business.id}` })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Trop de campagnes lancées. Réessayez dans une heure.' }, { status: 429 })
  }

  try {
    const body = await request.json()
    const { campaignId } = body

    if (!isUUID(campaignId)) {
      return NextResponse.json({ error: 'campaignId invalide' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Vérifier ownership de la campagne
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('business_id', auth.business.id)
      .single()

    if (!campaign) {
      return NextResponse.json({ error: 'Campagne introuvable ou non autorisée' }, { status: 404 })
    }

    if (campaign.status === 'sending' || campaign.status === 'completed') {
      return NextResponse.json({ error: 'Cette campagne a déjà été envoyée' }, { status: 409 })
    }

    const business = auth.business

    // Quota SMS si la campagne envoie des SMS
    if (campaign.method !== 'email') {
      const quotaError = checkSMSQuota(business)
      if (quotaError) return quotaError
    }

    const { data: customers } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', business.id)

    if (!customers?.length) {
      return NextResponse.json({ error: 'Aucun client dans ce business' }, { status: 400 })
    }

    // Filtrer les clients qui ont un moyen de contact selon la méthode
    const eligibleCustomers = customers.filter(customer => {
      const method = campaign.method === 'both'
        ? (customer.phone ? 'sms' : customer.email ? 'email' : null)
        : campaign.method
      if (!method) return false
      if (method === 'sms' && !customer.phone) return false
      if (method === 'email' && !customer.email) return false
      return true
    })

    if (!eligibleCustomers.length) {
      return NextResponse.json({ error: 'Aucun client avec un moyen de contact valide' }, { status: 400 })
    }

    const quotaRemaining = business.monthly_sms_limit - business.monthly_sms_used

    await supabase.from('campaigns').update({
      status: 'sending',
      total_recipients: eligibleCustomers.length,
    }).eq('id', campaignId)

    let sentCount = 0
    let smsSentCount = 0

    for (const customer of eligibleCustomers) {
      // Vérifier pas déjà de demande pour ce client dans cette campagne
      const { data: existing } = await supabase
        .from('review_requests')
        .select('id')
        .eq('business_id', business.id)
        .eq('customer_id', customer.id)
        .gte('created_at', campaign.created_at)
        .maybeSingle()

      if (existing) continue

      const method = campaign.method === 'both'
        ? (customer.phone ? 'sms' : 'email')
        : campaign.method as 'sms' | 'email'

      // Vérifier quota SMS avant chaque envoi SMS
      if (method === 'sms' && smsSentCount >= quotaRemaining) break

      const code = generateUniqueCode()
      const reviewUrl = `${APP_URL}/review/${code}`

      // Créer la review_request UNIQUEMENT si on peut envoyer
      const { error: insertError } = await supabase.from('review_requests').insert({
        business_id: business.id,
        customer_id: customer.id,
        unique_code: code,
        method,
        status: 'pending',
      })

      if (insertError) continue

      try {
        if (method === 'sms' && customer.phone) {
          const message = interpolateTemplate(
            (business.sms_template as string) || 'Bonjour {name}, donnez-nous votre avis : {link}',
            { name: customer.name, business: business.name as string, link: reviewUrl }
          )
          await sendSMS(normalizePhone(customer.phone), message)
          await supabase.rpc('increment_sms_count', { business_id: business.id })
          smsSentCount++
        } else if (method === 'email' && customer.email) {
          const html = buildReviewEmailHTML({
            businessName: business.name as string,
            customerName: customer.name,
            reviewUrl,
            logoUrl: business.logo_url as string | null,
          })
          await sendEmail({
            to: customer.email,
            subject: `Votre avis sur ${business.name}`,
            html,
          })
        }

        await supabase.from('review_requests')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('unique_code', code)

        sentCount++
      } catch (err) {
        console.error(`Erreur client ${customer.id}:`, err)
        await supabase.from('review_requests').update({ status: 'failed' }).eq('unique_code', code)
      }
    }

    await supabase.from('campaigns').update({
      status: 'completed',
      sent_count: sentCount,
      completed_at: new Date().toISOString(),
    }).eq('id', campaignId)

    return NextResponse.json({ success: true, sentCount, total: eligibleCustomers.length })
  } catch (error) {
    console.error('Erreur campagne:', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
