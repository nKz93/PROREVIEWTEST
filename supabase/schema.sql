-- ============================================
-- ProReview — Schéma Supabase complet v2
-- À coller dans l'éditeur SQL de Supabase
-- ============================================

-- ============================================
-- TABLES PRINCIPALES
-- ============================================

CREATE TABLE IF NOT EXISTS businesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  google_place_id TEXT,
  google_review_url TEXT,
  logo_url TEXT,
  business_type TEXT DEFAULT 'autre',
  sms_template TEXT DEFAULT 'Bonjour {name}, merci pour votre visite chez {business} ! Votre avis compte pour nous 🙏 {link}',
  email_template TEXT DEFAULT 'Bonjour {name}, merci pour votre visite chez {business} ! Votre avis compte beaucoup pour nous.',
  auto_send_enabled BOOLEAN DEFAULT false,
  auto_send_delay_hours INTEGER DEFAULT 24,
  send_method TEXT DEFAULT 'sms' CHECK (send_method IN ('sms', 'email', 'both')),
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'business')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  monthly_sms_limit INTEGER DEFAULT 50,
  monthly_sms_used INTEGER DEFAULT 0,
  widget_enabled BOOLEAN DEFAULT false,
  widget_slug TEXT UNIQUE,
  widget_theme TEXT DEFAULT 'light',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  visit_date TIMESTAMPTZ DEFAULT NOW(),
  tags TEXT[] DEFAULT '{}',
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'csv', 'api', 'qr')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS review_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  unique_code TEXT UNIQUE NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('sms', 'email')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'reviewed', 'feedback', 'failed')),
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS review_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID REFERENCES review_requests(id) ON DELETE CASCADE,
  satisfaction_score INTEGER CHECK (satisfaction_score BETWEEN 1 AND 5),
  action TEXT CHECK (action IN ('redirect_google', 'private_feedback')),
  user_agent TEXT,
  ip_address TEXT,
  clicked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS private_feedbacks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  request_id UUID REFERENCES review_requests(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  score INTEGER CHECK (score BETWEEN 1 AND 5),
  message TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  is_read BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS qr_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  short_code TEXT UNIQUE NOT NULL,
  scan_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  design_config JSONB DEFAULT '{"color": "#3B82F6", "style": "rounded"}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  method TEXT DEFAULT 'sms' CHECK (method IN ('sms', 'email', 'both')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'completed')),
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT UNIQUE,
  amount_cents INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLES ADMIN
-- ============================================

CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL UNIQUE,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLES FEATURES V2
-- ============================================

CREATE TABLE IF NOT EXISTS followup_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE UNIQUE,
  delay_hours INTEGER DEFAULT 48,
  max_followups INTEGER DEFAULT 1,
  message_template TEXT DEFAULT 'Bonjour {name}, avez-vous eu le temps de nous laisser un avis ? {link}',
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS followup_sends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID REFERENCES review_requests(id) ON DELETE CASCADE,
  followup_number INTEGER DEFAULT 1,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feedback_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  feedback_id UUID REFERENCES private_feedbacks(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events TEXT[] DEFAULT '{review.received,feedback.received}',
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id UUID REFERENCES webhooks(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  payload JSONB,
  response_status INTEGER,
  success BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  referred_business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  referral_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'rewarded')),
  reward_months INTEGER DEFAULT 1,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS onboarding_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE UNIQUE,
  step_profile BOOLEAN DEFAULT false,
  step_google_url BOOLEAN DEFAULT false,
  step_first_customer BOOLEAN DEFAULT false,
  step_first_send BOOLEAN DEFAULT false,
  step_qr_code BOOLEAN DEFAULT false,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_broadcasts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  target_plans TEXT[] DEFAULT '{free,starter,pro,business}',
  sent_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'sent')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEX POUR LES PERFORMANCES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_customers_business_id ON customers(business_id);
CREATE INDEX IF NOT EXISTS idx_review_requests_business_id ON review_requests(business_id);
CREATE INDEX IF NOT EXISTS idx_review_requests_customer_id ON review_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_review_requests_status ON review_requests(status);
CREATE INDEX IF NOT EXISTS idx_review_requests_unique_code ON review_requests(unique_code);
CREATE INDEX IF NOT EXISTS idx_private_feedbacks_business_id ON private_feedbacks(business_id);
CREATE INDEX IF NOT EXISTS idx_private_feedbacks_is_read ON private_feedbacks(is_read);
CREATE INDEX IF NOT EXISTS idx_invoices_business_id ON invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_followup_sends_request_id ON followup_sends(request_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_businesses_widget_slug ON businesses(widget_slug);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE followup_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE followup_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_broadcasts ENABLE ROW LEVEL SECURITY;

-- Policies : chaque user voit uniquement ses données
CREATE POLICY "Users own businesses" ON businesses FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users own customers" ON customers FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
CREATE POLICY "Users own review_requests" ON review_requests FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
CREATE POLICY "Users own private_feedbacks" ON private_feedbacks FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
CREATE POLICY "Users own qr_codes" ON qr_codes FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
CREATE POLICY "Users own campaigns" ON campaigns FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
CREATE POLICY "Users own invoices" ON invoices FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
CREATE POLICY "Users own followup_rules" ON followup_rules FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
CREATE POLICY "Users own feedback_replies" ON feedback_replies FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
CREATE POLICY "Users own webhooks" ON webhooks FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
CREATE POLICY "Users own referrals" ON referrals FOR ALL USING (referrer_business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
CREATE POLICY "Users own onboarding_steps" ON onboarding_steps FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
CREATE POLICY "Users own api_keys" ON api_keys FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
CREATE POLICY "Users own webhook_logs" ON webhook_logs FOR ALL USING (webhook_id IN (SELECT id FROM webhooks WHERE business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())));
CREATE POLICY "Superadmin only admins" ON admins FOR ALL USING (EXISTS (SELECT 1 FROM admins a WHERE a.user_id = auth.uid() AND a.role = 'superadmin'));
CREATE POLICY "Superadmin only broadcasts" ON admin_broadcasts FOR ALL USING (EXISTS (SELECT 1 FROM admins a WHERE a.user_id = auth.uid()));
-- Accès public pour les pages de review (via unique_code)
-- Review page uses createAdminClient (server-side) — no public anon SELECT needed
-- Authenticated users can read their own business requests (handled by "Users own review_requests")
-- We remove the open SELECT policy entirely for security
CREATE POLICY "Public write review_clicks" ON review_clicks
  FOR INSERT WITH CHECK (
    -- Le request_id doit exister et ne pas être déjà soumis
    EXISTS (
      SELECT 1 FROM review_requests r
      WHERE r.id = request_id
        AND r.status NOT IN ('reviewed', 'feedback')
    )
  );
CREATE POLICY "Public write private_feedbacks" ON private_feedbacks
  FOR INSERT WITH CHECK (
    -- Only allow insert if the linked review_request exists
    EXISTS (
      SELECT 1 FROM review_requests
      WHERE id = request_id
      AND status NOT IN ('reviewed', 'feedback')
    )
  );
CREATE POLICY "Public read businesses for widget" ON businesses FOR SELECT USING (widget_enabled = true OR user_id = auth.uid());

-- ============================================
-- TRIGGER : updated_at automatique
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- FONCTION : incrémenter le compteur SMS
-- ============================================

CREATE OR REPLACE FUNCTION increment_sms_count(business_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE businesses
  SET monthly_sms_used = monthly_sms_used + 1
  WHERE id = business_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PREMIER SUPER ADMIN
-- Décommenter et remplacer avec tes vraies valeurs
-- ============================================
-- INSERT INTO admins (user_id, email, role)
-- VALUES ('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 'ton@email.com', 'superadmin')
-- ON CONFLICT DO NOTHING;

-- ============================================
-- INDEX SUPPLEMENTAIRES (performances et sécurité)
-- ============================================

-- Index pour la vérification des clés API (path chaud)
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_api_keys_business_id ON api_keys(business_id);

-- Index pour les followup queries
CREATE INDEX IF NOT EXISTS idx_followup_sends_request_number ON followup_sends(request_id, followup_number);
CREATE INDEX IF NOT EXISTS idx_review_requests_sent_at ON review_requests(business_id, sent_at) WHERE status = 'sent';

-- Index pour les widgets
CREATE INDEX IF NOT EXISTS idx_businesses_widget_active ON businesses(widget_slug) WHERE widget_enabled = true;

-- Index pour les stats (dashboard)
CREATE INDEX IF NOT EXISTS idx_review_requests_business_status ON review_requests(business_id, status);
CREATE INDEX IF NOT EXISTS idx_review_requests_business_created ON review_requests(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_private_feedbacks_business_resolved ON private_feedbacks(business_id, is_resolved);

-- ============================================
-- POLICIES ADMIN : accès cross-business
-- Les admins peuvent voir toutes les données pour la gestion
-- ============================================

-- Fonction helper pour vérifier si l'utilisateur est admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admins peuvent voir tous les businesses
CREATE POLICY "Admins read all businesses" ON businesses
  FOR SELECT USING (is_admin());

-- Admins peuvent voir tous les customers
CREATE POLICY "Admins read all customers" ON customers
  FOR SELECT USING (is_admin());

-- Admins peuvent voir toutes les review_requests
CREATE POLICY "Admins read all review_requests" ON review_requests
  FOR SELECT USING (is_admin());

-- Admins peuvent voir tous les private_feedbacks
CREATE POLICY "Admins read all private_feedbacks" ON private_feedbacks
  FOR SELECT USING (is_admin());

-- Admins peuvent voir toutes les invoices
CREATE POLICY "Admins read all invoices" ON invoices
  FOR SELECT USING (is_admin());

-- Admins peuvent mettre à jour les businesses (gestion des plans, etc.)
CREATE POLICY "Admins update businesses" ON businesses
  FOR UPDATE USING (is_admin());

