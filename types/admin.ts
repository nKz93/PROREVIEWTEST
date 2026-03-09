// Types pour les pages admin (données cross-business)

export interface AdminBusiness {
  id: string
  name: string
  email: string
  plan: string
  business_type?: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  monthly_sms_used: number
  monthly_sms_limit: number
  widget_enabled?: boolean
  widget_slug?: string | null
  google_review_url?: string | null
  created_at: string
  updated_at?: string
}

export interface AdminInvoice {
  id: string
  business_id: string
  stripe_invoice_id: string | null
  amount_cents: number
  status: string
  created_at: string
  business?: { name: string; email: string } | null
}

export interface AdminUser {
  id: string
  name: string
  email: string
  plan: string
  created_at: string
}

export interface AdminEntry {
  id: string
  email: string
  role: 'admin' | 'superadmin'
  user_id?: string
  created_at: string
}

export interface AdminBroadcast {
  id: string
  subject: string
  body: string
  target_plans: string[]
  status: string
  sent_count: number
  created_at: string
}

export interface AdminReviewRequest {
  id: string
  status: string
  method: string
  created_at: string
  customer?: { name: string } | null
}
