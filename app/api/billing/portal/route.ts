import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCustomerPortalSession } from '@/lib/stripe'
import { APP_URL } from '@/lib/constants'
import { checkRateLimit, getIP } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const rl = checkRateLimit({ windowMs: 60_000, max: 10, identifier: `billing:${getIP(request)}` })
  if (!rl.allowed) return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 })

  try {
    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { data: business } = await supabase
      .from('businesses')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (!business?.stripe_customer_id) {
      return NextResponse.json({ error: 'Aucun abonnement actif' }, { status: 400 })
    }

    const portalSession = await createCustomerPortalSession({
      customerId: business.stripe_customer_id,
      returnUrl: `${APP_URL}/dashboard/billing`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error('Erreur portail Stripe:', error)
    return NextResponse.json({ error: 'Erreur portail' }, { status: 500 })
  }
}
