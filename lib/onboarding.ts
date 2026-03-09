import { createClient } from '@/lib/supabase/client'

type OnboardingStep =
  | 'step_profile'
  | 'step_google_url'
  | 'step_first_customer'
  | 'step_first_send'
  | 'step_qr_code'

export async function markOnboardingStep(businessId: string, step: OnboardingStep) {
  try {
    const supabase = createClient()

    // Upsert the step
    await supabase
      .from('onboarding_steps')
      .upsert({ business_id: businessId, [step]: true }, { onConflict: 'business_id' })

    // Check if all steps are done
    const { data } = await supabase
      .from('onboarding_steps')
      .select('step_profile, step_google_url, step_first_customer, step_first_send, step_qr_code')
      .eq('business_id', businessId)
      .single()

    if (data && Object.values(data).every(Boolean)) {
      await supabase
        .from('onboarding_steps')
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq('business_id', businessId)
    }
  } catch {
    // Non-blocking — onboarding errors should never break the app
  }
}
