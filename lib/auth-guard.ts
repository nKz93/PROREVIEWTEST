import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Vérifie la session et retourne le business de l'utilisateur connecté.
 * Utilise getUser() (vérification serveur) plutôt que getSession() (JWT local non vérifié).
 */
export async function requireAuth(request: NextRequest): Promise<
  | { error: NextResponse; session: null; business: null }
  | { error: null; session: { user: { id: string } }; business: { id: string; plan: string; monthly_sms_used: number; monthly_sms_limit: number; [key: string]: unknown } }
> {
  const supabase = createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return {
      error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }),
      session: null,
      business: null,
    }
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!business) {
    return {
      error: NextResponse.json({ error: 'Business introuvable' }, { status: 404 }),
      session: null,
      business: null,
    }
  }

  return { error: null, session: { user: { id: user.id } }, business }
}

/**
 * Vérifie que l'utilisateur est admin.
 * Utilise getUser() pour valider le JWT côté serveur.
 */
export async function requireAdmin(request: NextRequest): Promise<
  | { error: NextResponse; session: null }
  | { error: null; session: { user: { id: string } } }
> {
  const supabase = createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }), session: null }
  }

  const adminSupabase = createAdminClient()
  const { data: adminData } = await adminSupabase
    .from('admins')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!adminData) {
    return { error: NextResponse.json({ error: 'Accès refusé' }, { status: 403 }), session: null }
  }

  return { error: null, session: { user: { id: user.id } } }
}

/**
 * Vérifie le secret des crons Vercel.
 */
export function requireCronSecret(request: NextRequest): NextResponse | null {
  const authHeader = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  return null
}

/**
 * Vérifie que le quota SMS n'est pas dépassé.
 */
export function checkSMSQuota(business: { monthly_sms_used: number; monthly_sms_limit: number }): NextResponse | null {
  if (business.monthly_sms_used >= business.monthly_sms_limit) {
    return NextResponse.json(
      { error: 'Quota SMS mensuel atteint. Passez à un plan supérieur.' },
      { status: 429 }
    )
  }
  return null
}
