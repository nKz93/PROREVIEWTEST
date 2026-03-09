# ProReview — Guide de déploiement complet

Stack : **Next.js 14 · Supabase · Stripe · Twilio · Resend · Vercel**

---

## 1. Prérequis

- Compte [Supabase](https://supabase.com) (gratuit)
- Compte [Stripe](https://stripe.com)
- Compte [Twilio](https://twilio.com) avec un numéro SMS
- Compte [Resend](https://resend.com) + domaine vérifié
- Compte [Vercel](https://vercel.com) (gratuit)

---

## 2. Supabase — Base de données

1. Créer un projet sur supabase.com
2. Aller dans **SQL Editor** et coller tout le contenu de `supabase/schema.sql`
3. Cliquer **Run** — toutes les tables, index et politiques RLS sont créées
4. Récupérer dans **Settings → API** :
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ ne jamais exposer

---

## 3. Stripe — Paiements

1. Créer 3 produits dans le Dashboard Stripe avec abonnement récurrent mensuel :
   - **Starter** : 29€/mois
   - **Pro** : 59€/mois
   - **Business** : 99€/mois
2. Copier les Price IDs (`price_xxx`) dans les variables d'env
3. Récupérer la clé secrète dans **Développeurs → Clés API**
4. Après déploiement, créer un webhook dans **Développeurs → Webhooks** :
   - URL : `https://ton-domaine.com/api/webhooks/stripe`
   - Événements : `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`
   - Copier le **Signing secret** → `STRIPE_WEBHOOK_SECRET`

---

## 4. Twilio — SMS

1. Créer un compte sur twilio.com
2. Acheter un numéro de téléphone SMS (région France)
3. Récupérer dans **Account Info** :
   - `Account SID` → `TWILIO_ACCOUNT_SID`
   - `Auth Token` → `TWILIO_AUTH_TOKEN`
   - Numéro acheté → `TWILIO_PHONE_NUMBER` (format `+33757xxxxxx`)

---

## 5. Resend — Emails

1. Créer un compte sur resend.com
2. Ajouter et vérifier ton domaine (ex: `proreview.fr`)
3. Créer une clé API → `RESEND_API_KEY`
4. L'expéditeur est configuré sur `noreply@proreview.fr` dans `lib/resend.ts`
   → Modifier selon ton domaine vérifié

---

## 6. Variables d'environnement

Copier `.env.local.example` en `.env.local` et remplir toutes les valeurs :

```bash
cp .env.local.example .env.local
```

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_BUSINESS_PRICE_ID=price_...

# Twilio
TWILIO_ACCOUNT_SID=ACxx...
TWILIO_AUTH_TOKEN=xx...
TWILIO_PHONE_NUMBER=+33757xxxxxx

# Resend
RESEND_API_KEY=re_...

# App
NEXT_PUBLIC_APP_URL=https://app.proreview.fr
CRON_SECRET=<openssl rand -hex 32>
```

---

## 7. Déploiement sur Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel --prod
```

Ou connecter le repo GitHub à Vercel et configurer les variables d'env dans **Settings → Environment Variables**.

---

## 8. Créer le premier Super Admin

Après le premier déploiement, créer un compte sur `/auth/register` puis exécuter dans Supabase SQL Editor :

```sql
INSERT INTO admins (user_id, email, role)
SELECT id, email, 'superadmin'
FROM auth.users
WHERE email = 'ton@email.com'
ON CONFLICT DO NOTHING;
```

Accéder ensuite à `/admin`.

---

## 9. Tester en local

```bash
npm install
npm run dev
# → http://localhost:3000
```

---

## Structure des routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/auth/login` | Connexion |
| `/auth/register?ref=CODE` | Inscription (+ parrainage) |
| `/dashboard` | Dashboard commerçant |
| `/dashboard/customers` | Gestion clients |
| `/dashboard/feedbacks` | Feedbacks privés |
| `/dashboard/settings` | Paramètres + automatisations |
| `/dashboard/referral` | Programme de parrainage |
| `/dashboard/widget` | API & Webhooks (plan Business) |
| `/review/[code]` | Page publique de review |
| `/w/[slug]` | Widget de réputation intégrable |
| `/admin` | Super Admin Panel |
| `/admin/broadcast` | Emailing tous les clients |
| `/api/v1/customers` | API REST publique |
| `/api/v1/reviews` | API REST publique |

---

## Crons Vercel (automatiques)

Configurés dans `vercel.json` :

| Cron | Fréquence | Rôle |
|------|-----------|------|
| `/api/cron/auto-send` | Toutes les heures | Envoi auto aux nouveaux clients |
| `/api/cron/followup` | Toutes les 4h | Relances si pas de réponse |
| `/api/report/generate` | 1er du mois à 8h | Rapport mensuel par email |

Les crons sont sécurisés par `Authorization: Bearer CRON_SECRET`.

---

## Plans

| Plan | Prix | SMS/mois | QR | API |
|------|------|----------|----|-----|
| Free | 0€ | 50 | ❌ | ❌ |
| Starter | 29€ | 100 | ❌ | ❌ |
| Pro | 59€ | 500 | ✅ | ❌ |
| Business | 99€ | 2000 | ✅ | ✅ |
