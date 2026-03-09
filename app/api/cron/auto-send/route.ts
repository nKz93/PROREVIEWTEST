import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendSMS } from '@/lib/twilio'
import { sendEmail, buildReviewEmailHTML } from '@/lib/resend'
import { generateUniqueCode, interpolateTemplate, normalizePhone } from '@/lib/utils'
import { APP_URL } from '@/lib/constants'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()

    const { data: businesses } = await supabase
      .from('businesses')
      .select('*')
      .eq('auto_send_enabled', true)

    if (!businesses?.length) return NextResponse.json({ message: 'Aucun business actif', totalSent: 0 })

    let totalSent = 0

    for (const business of businesses) {
      // Vérifier le quota SMS restant
      const smsRemaining = business.monthly_sms_limit - business.monthly_sms_used
      if (smsRemaining <= 0) continue

      const delayMs = business.auto_send_delay_hours * 60 * 60 * 1000
      const cutoffTime = new Date(Date.now() - delayMs).toISOString()
      const windowStart = new Date(Date.now() - delayMs - 3600000).toISOString()

      const { data: customers } = await supabase
        .from('customers')
        .select('*')
        .eq('business_id', business.id)
        .lte('created_at', cutoffTime)
        .gte('created_at', windowStart)

      if (!customers?.length) continue

      let sentThisBusiness = 0

      for (const customer of customers) {
        if (sentThisBusiness >= smsRemaining) break

        // Vérifier pas déjà de demande
        const { data: existing } = await supabase
          .from('review_requests')
          .select('id')
          .eq('customer_id', customer.id)
          .maybeSingle()

        if (existing) continue

        const code = generateUniqueCode()
        const reviewUrl = `${APP_URL}/review/${code}`
        const method = business.send_method === 'both' ? (customer.phone ? 'sms' : 'email') : business.send_method

        await supabase.from('review_requests').insert({
          business_id: business.id,
          customer_id: customer.id,
          unique_code: code,
          method,
          status: 'pending',
        })

        try {
          if (method === 'sms' && customer.phone) {
            const message = interpolateTemplate(business.sms_template, {
              name: customer.name,
              business: business.name,
              link: reviewUrl,
            })
            await sendSMS(normalizePhone(customer.phone), message)
            // Incrémenter le compteur SMS
            await supabase.rpc('increment_sms_count', { business_id: business.id })
          } else if (method === 'email' && customer.email) {
            const html = buildReviewEmailHTML({
              businessName: business.name,
              customerName: customer.name,
              reviewUrl,
            })
            await sendEmail({ to: customer.email, subject: `Votre avis sur ${business.name}`, html })
          }

          await supabase
            .from('review_requests')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('unique_code', code)

          totalSent++
          sentThisBusiness++
        } catch (err) {
          console.error(`Auto-send erreur client ${customer.id}:`, err)
          await supabase.from('review_requests').update({ status: 'failed' }).eq('unique_code', code)
        }
      }
    }

    return NextResponse.json({ success: true, totalSent })
  } catch (error) {
    console.error('Erreur cron auto-send:', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
