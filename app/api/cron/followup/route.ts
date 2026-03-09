import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendSMS } from '@/lib/twilio'
import { normalizePhone, interpolateTemplate } from '@/lib/utils'
import { APP_URL } from '@/lib/constants'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const { data: rules } = await supabase
    .from('followup_rules')
    .select('*, business:businesses(id, name, monthly_sms_used, monthly_sms_limit, plan)')
    .eq('is_active', true)

  let sent = 0

  for (const rule of rules || []) {
    const business = (rule.business as unknown) as Record<string, unknown> | null
    if (!business) continue

    // Respecter le quota SMS
    const smsUsed = business.monthly_sms_used as number
    const smsLimit = business.monthly_sms_limit as number
    if (smsUsed >= smsLimit) continue

    const cutoffTime = new Date(Date.now() - (rule.delay_hours as number) * 3_600_000).toISOString()

    // Récupérer les IDs de request déjà relancés au moins max_followups fois
    const { data: alreadySent } = await supabase
      .from('followup_sends')
      .select('request_id')
      .gte('followup_number', rule.max_followups as number)

    const excludedIds = (alreadySent || []).map(f => f.request_id as string).filter(Boolean)

    // Demandes 'sent' depuis plus de delay_hours, pas encore relancées
    let query = supabase
      .from('review_requests')
      .select('id, unique_code, customer:customers(name, phone)')
      .eq('business_id', business.id as string)
      .eq('status', 'sent')
      .lt('sent_at', cutoffTime)
      .limit(50)

    // Exclure les demandes déjà relancées (si la liste n'est pas vide)
    if (excludedIds.length > 0) {
      query = query.not('id', 'in', `(${excludedIds.map(id => `'${id}'`).join(',')})`)
    }

    const { data: requestsToFollowup } = await query

    let remainingSms = smsLimit - smsUsed

    for (const req of requestsToFollowup || []) {
      if (remainingSms <= 0) break

      const customer = (req.customer as unknown) as { name: string | null; phone: string | null } | null
      if (!customer?.phone) continue

      const phone = normalizePhone(customer.phone)
      const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL || APP_URL}/review/${req.unique_code}`
      const message = interpolateTemplate(rule.message_template as string, {
        name: customer.name || 'client',
        business: business.name as string,
        link: reviewUrl,
      }).slice(0, 800)

      try {
        await sendSMS(phone, message)

        // Enregistrer le followup
        const { data: existing } = await supabase
          .from('followup_sends')
          .select('id, followup_number')
          .eq('request_id', req.id)
          .order('followup_number', { ascending: false })
          .limit(1)
          .maybeSingle()

        await supabase.from('followup_sends').insert({
          request_id: req.id,
          followup_number: (existing?.followup_number || 0) + 1,
        })

        await supabase.rpc('increment_sms_count', { business_id: business.id })
        sent++
        remainingSms--

        // Throttle pour ne pas saturer Twilio
        await new Promise(r => setTimeout(r, 150))
      } catch (err) {
        console.error(`Followup erreur request ${req.id}:`, err)
      }
    }
  }

  return NextResponse.json({ success: true, sent })
}
