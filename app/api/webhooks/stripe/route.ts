import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const PLAN_SMS_LIMITS: Record<string, number> = {
  starter: 100,
  pro: 500,
  business: 2000,
}

// Identifier le plan à partir du price ID
function getPlanFromPriceId(priceId: string): string {
  if (priceId === process.env.STRIPE_STARTER_PRICE_ID) return 'starter'
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'pro'
  if (priceId === process.env.STRIPE_BUSINESS_PRICE_ID) return 'business'
  return 'free'
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook Stripe invalide:', err)
    return NextResponse.json({ error: 'Webhook invalide' }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const businessId = session.metadata?.businessId

        if (businessId && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
          const priceId = subscription.items.data[0]?.price.id
          const plan = getPlanFromPriceId(priceId)

          await supabase.from('businesses').update({
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            plan,
            monthly_sms_limit: PLAN_SMS_LIMITS[plan] || 50,
          }).eq('id', businessId)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const priceId = subscription.items.data[0]?.price.id
        const plan = getPlanFromPriceId(priceId)

        const { data: business } = await supabase
          .from('businesses')
          .select('id')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (business) {
          await supabase.from('businesses').update({
            plan,
            monthly_sms_limit: PLAN_SMS_LIMITS[plan] || 50,
          }).eq('id', business.id)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const { data: business } = await supabase
          .from('businesses')
          .select('id')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (business) {
          await supabase.from('businesses').update({
            plan: 'free',
            stripe_subscription_id: null,
            monthly_sms_limit: 50,
          }).eq('id', business.id)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const { data: business } = await supabase
          .from('businesses')
          .select('id')
          .eq('stripe_customer_id', invoice.customer as string)
          .single()

        if (business) {
          await supabase.from('invoices').insert({
            business_id: business.id,
            stripe_invoice_id: invoice.id,
            amount_cents: invoice.amount_paid,
            status: 'paid',
            period_start: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
            period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
            pdf_url: invoice.invoice_pdf,
          })

          // Réinitialiser le compteur SMS mensuel
          await supabase.from('businesses').update({ monthly_sms_used: 0 }).eq('id', business.id)
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Erreur traitement webhook:', error)
    return NextResponse.json({ error: 'Erreur traitement' }, { status: 500 })
  }
}
