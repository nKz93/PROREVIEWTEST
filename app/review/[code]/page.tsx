import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ReviewFlow from './ReviewFlow'

interface ReviewPageProps {
  params: { code: string }
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { code } = params

  // Valider le format du code avant la DB — évite les requêtes inutiles
  if (!code || !/^[A-Za-z0-9]{8,20}$/.test(code)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-4xl mb-4">🔍</p>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Lien invalide</h1>
          <p className="text-gray-500">Ce lien n'est pas valide.</p>
        </div>
      </div>
    )
  }

  const supabase = createAdminClient()

  const { data: request } = await supabase
    .from('review_requests')
    .select('id, business_id, customer_id, status, opened_at, unique_code, customer:customers(name), business:businesses(name, google_review_url, logo_url)')
    .eq('unique_code', code)
    .single()

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-4xl mb-4">🔍</p>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Lien invalide</h1>
          <p className="text-gray-500">Ce lien de demande d'avis n'existe pas ou a expiré.</p>
        </div>
      </div>
    )
  }

  // Déjà traité → message adapté
  if (request.status === 'reviewed' || request.status === 'feedback') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <p className="text-5xl mb-4">{request.status === 'reviewed' ? '⭐' : '💬'}</p>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Déjà pris en compte !</h1>
          <p className="text-gray-500 text-sm">Votre avis a déjà été enregistré. Merci !</p>
        </div>
      </div>
    )
  }

  // Marquer comme ouvert (une seule fois)
  if (!request.opened_at) {
    await supabase
      .from('review_requests')
      .update({ opened_at: new Date().toISOString(), status: 'opened' })
      .eq('unique_code', code)
      .eq('status', 'sent') // Safety: only update if still 'sent'
  }

  const businessData = (request.business as unknown) as { name: string; google_review_url: string | null; logo_url: string | null } | null
  const customerData = (request.customer as unknown) as { name: string } | null

  return (
    <ReviewFlow
      requestId={request.id}
      businessId={request.business_id}
      customerId={request.customer_id}
      businessName={businessData?.name || 'ce commerce'}
      googleReviewUrl={businessData?.google_review_url || null}
      logoUrl={businessData?.logo_url || null}
      customerName={customerData?.name || 'vous'}
      uniqueCode={code}
    />
  )
}
