import Stripe from 'stripe'

// Client Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
})

// Créer une session de paiement Stripe
export async function createCheckoutSession({
  customerId,
  priceId,
  businessId,
  successUrl,
  cancelUrl,
}: {
  customerId?: string
  priceId: string
  businessId: string
  successUrl: string
  cancelUrl: string
}) {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { businessId },
    allow_promotion_codes: true,
    billing_address_collection: 'required',
  })
  return session
}

// Créer un portail client Stripe
export async function createCustomerPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string
  returnUrl: string
}) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
  return session
}
