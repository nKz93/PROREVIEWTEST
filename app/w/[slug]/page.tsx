import { createAdminClient } from '@/lib/supabase/server'
import { Star } from 'lucide-react'

export default async function WidgetPage({ params }: { params: { slug: string } }) {
  // Sanitiser le slug — uniquement alphanumériques et tirets
  const rawSlug = params.slug
  if (!rawSlug || !/^[a-zA-Z0-9_-]{1,100}$/.test(rawSlug)) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-50"><p className="text-gray-400">Widget non disponible</p></div>
  }

  const supabase = createAdminClient()

  // Requêtes séparées pour éviter l'injection via .or()
  let business = null
  const { data: bySlug } = await supabase
    .from('businesses')
    .select('id, name, logo_url, google_review_url, widget_enabled, widget_theme')
    .eq('widget_slug', rawSlug)
    .eq('widget_enabled', true)
    .single()

  if (bySlug) {
    business = bySlug
  } else {
    // Fallback sur l'ID uniquement si c'est un UUID valide
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(rawSlug)
    if (isUUID) {
      const { data: byId } = await supabase
        .from('businesses')
        .select('id, name, logo_url, google_review_url, widget_enabled, widget_theme')
        .eq('id', rawSlug)
        .eq('widget_enabled', true)
        .single()
      business = byId
    }
  }

  if (!business) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-50"><p className="text-gray-400">Widget non disponible</p></div>
  }

  const { data: reviews } = await supabase
    .from('review_requests')
    .select('id, reviewed_at, customer:customers(name)')
    .eq('business_id', business.id)
    .eq('status', 'reviewed')
    .order('reviewed_at', { ascending: false })
    .limit(6)

  const { count: totalReviewed } = await supabase
    .from('review_requests')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', business.id)
    .eq('status', 'reviewed')

  const reviewCount = totalReviewed || 0
  const isDark = business.widget_theme === 'dark'

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`w-full max-w-sm rounded-3xl overflow-hidden shadow-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="gradient-primary p-5 text-center">
          {business.logo_url ? (
            <img src={business.logo_url} alt="" className="h-10 mx-auto mb-2 rounded-xl object-contain" />
          ) : (
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-2">
              <Star className="w-6 h-6 text-white fill-white" />
            </div>
          )}
          <h1 className="text-white font-bold">{business.name}</h1>
          <div className="flex items-center justify-center gap-1 mt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-4 h-4 text-yellow-300 fill-yellow-300" />
            ))}
          </div>
          <p className="text-white/70 text-xs mt-0.5">{reviewCount} avis Google</p>
        </div>

        <div className={`p-4 space-y-2 ${isDark ? 'text-white' : ''}`}>
          {reviews && reviews.length > 0 ? (
            reviews.slice(0, 4).map((review) => {
              const customer = (review.customer as unknown) as { name: string } | null
              const initials = (customer?.name || 'C').charAt(0).toUpperCase()
              return (
                <div key={review.id} className={`flex items-center gap-3 p-2.5 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{customer?.name || 'Client vérifié'}</p>
                    <div className="flex gap-0.5 mt-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-green-500 font-medium flex-shrink-0">✓</span>
                </div>
              )
            })
          ) : (
            <div className="text-center py-4 text-gray-400 text-sm">
              <Star className="w-6 h-6 mx-auto mb-1 fill-yellow-300 text-yellow-300" />
              Les premiers avis arrivent bientôt !
            </div>
          )}
        </div>

        {business.google_review_url && (
          <div className="px-4 pb-4">
            <a
              href={business.google_review_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center text-sm font-semibold text-white gradient-primary py-2.5 rounded-xl hover:opacity-90 transition-opacity"
            >
              ⭐ Laisser un avis Google
            </a>
          </div>
        )}

        <div className="pb-3 text-center">
          <p className="text-xs text-gray-400">Propulsé par <span className="font-semibold">ProReview</span></p>
        </div>
      </div>
    </div>
  )
}
