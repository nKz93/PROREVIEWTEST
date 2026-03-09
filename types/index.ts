// Types principaux de l'application ProReview

export interface Business {
  id: string
  user_id: string
  name: string
  email: string
  phone: string | null
  google_place_id: string | null
  google_review_url: string | null
  logo_url: string | null
  business_type: string
  sms_template: string
  email_template: string
  auto_send_enabled: boolean
  auto_send_delay_hours: number
  send_method: 'sms' | 'email' | 'both'
  plan: 'free' | 'starter' | 'pro' | 'business'
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  monthly_sms_limit: number
  monthly_sms_used: number
  widget_enabled: boolean
  widget_slug: string | null
  widget_theme: string
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  business_id: string
  name: string
  phone: string | null
  email: string | null
  visit_date: string
  tags: string[]
  source: 'manual' | 'csv' | 'api' | 'qr'
  created_at: string
}

export interface ReviewRequest {
  id: string
  business_id: string
  customer_id: string
  unique_code: string
  method: 'sms' | 'email'
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'reviewed' | 'feedback' | 'failed'
  sent_at: string | null
  opened_at: string | null
  clicked_at: string | null
  reviewed_at: string | null
  created_at: string
  customer?: Customer
}

export interface ReviewClick {
  id: string
  request_id: string
  satisfaction_score: number
  action: 'redirect_google' | 'private_feedback'
  user_agent: string | null
  ip_address: string | null
  clicked_at: string
}

export interface PrivateFeedback {
  id: string
  business_id: string
  request_id: string
  customer_id: string
  score: number
  message: string
  category: string
  is_read: boolean
  is_resolved: boolean
  resolved_at: string | null
  created_at: string
  customer?: Customer
}

export interface QRCode {
  id: string
  business_id: string
  name: string
  short_code: string
  scan_count: number
  is_active: boolean
  design_config: {
    color: string
    style: string
  }
  created_at: string
}

export interface Campaign {
  id: string
  business_id: string
  name: string
  method: 'sms' | 'email' | 'both'
  status: 'draft' | 'scheduled' | 'sending' | 'completed'
  total_recipients: number
  sent_count: number
  scheduled_at: string | null
  completed_at: string | null
  created_at: string
}

export interface Invoice {
  id: string
  business_id: string
  stripe_invoice_id: string | null
  amount_cents: number
  status: string
  period_start: string | null
  period_end: string | null
  pdf_url: string | null
  created_at: string
}

export interface DashboardStats {
  totalRequestsSent: number
  clickRate: number
  googleReviewsObtained: number
  averageScore: number
  smsUsed: number
  smsLimit: number
  recentActivity: ActivityItem[]
  chartData: ChartDataPoint[]
}

export interface ActivityItem {
  id: string
  type: 'sms_sent' | 'email_sent' | 'review_received' | 'feedback_received'
  customerName: string
  date: string
  details?: string
}

export interface ChartDataPoint {
  date: string
  avis: number
  feedbacks: number
}

export type PlanType = 'free' | 'starter' | 'pro' | 'business'

export interface PlanLimits {
  smsPerMonth: number
  establishments: number
  hasQRCodes: boolean
  hasAPI: boolean
  hasPrioritySupport: boolean
  hasAccountManager: boolean
}

// Types Admin
export interface Admin {
  id: string
  user_id: string
  email: string
  role: 'admin' | 'superadmin'
  created_at: string
}

export interface AdminBusinessStats {
  id: string
  name: string
  email: string
  business_type: string
  plan: PlanType
  monthly_sms_used: number
  monthly_sms_limit: number
  created_at: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  total_customers: number
  total_requests: number
  total_reviews: number
  total_feedbacks: number
}

export interface AdminGlobalStats {
  totalBusinesses: number
  totalRevenueMRR: number
  totalSMSSentThisMonth: number
  totalReviewsCollected: number
  planBreakdown: { plan: string; count: number }[]
  revenueByMonth: { month: string; revenue: number }[]
  newBusinessesByMonth: { month: string; count: number }[]
  churnRate: number
}
