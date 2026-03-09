// Constantes de l'application

export const PLAN_LIMITS = {
  free: {
    smsPerMonth: 50,
    establishments: 1,
    hasQRCodes: false,
    hasAPI: false,
    hasPrioritySupport: false,
    hasAccountManager: false,
  },
  starter: {
    smsPerMonth: 100,
    establishments: 1,
    hasQRCodes: false,
    hasAPI: false,
    hasPrioritySupport: false,
    hasAccountManager: false,
  },
  pro: {
    smsPerMonth: 500,
    establishments: 3,
    hasQRCodes: true,
    hasAPI: false,
    hasPrioritySupport: true,
    hasAccountManager: false,
  },
  business: {
    smsPerMonth: 2000,
    establishments: 999,
    hasQRCodes: true,
    hasAPI: true,
    hasPrioritySupport: true,
    hasAccountManager: true,
  },
}

export const PLAN_PRICES = {
  starter: { monthly: 29, priceId: process.env.STRIPE_STARTER_PRICE_ID },
  pro: { monthly: 59, priceId: process.env.STRIPE_PRO_PRICE_ID },
  business: { monthly: 99, priceId: process.env.STRIPE_BUSINESS_PRICE_ID },
}

export const BUSINESS_TYPES = [
  { value: 'restaurant', label: 'Restaurant / Café' },
  { value: 'coiffeur', label: 'Coiffeur / Barbier' },
  { value: 'garage', label: 'Garage / Auto' },
  { value: 'dentiste', label: 'Dentiste / Médecin' },
  { value: 'beaute', label: 'Institut de beauté' },
  { value: 'hotel', label: 'Hôtel / Hébergement' },
  { value: 'commerce', label: 'Commerce de détail' },
  { value: 'autre', label: 'Autre' },
]

export const FEEDBACK_CATEGORIES = [
  { value: 'service', label: 'Service' },
  { value: 'qualite', label: 'Qualité' },
  { value: 'attente', label: 'Temps d\'attente' },
  { value: 'proprete', label: 'Propreté' },
  { value: 'prix', label: 'Prix' },
  { value: 'autre', label: 'Autre' },
]

export const SATISFACTION_EMOJIS = ['😡', '😕', '😐', '😊', '🤩']

export const DEFAULT_SMS_TEMPLATE = 
  'Bonjour {name}, merci pour votre visite chez {business} ! Votre avis compte pour nous 🙏 {link}'

export const DEFAULT_EMAIL_TEMPLATE = 
  'Bonjour {name}, merci pour votre visite chez {business} ! Votre avis compte beaucoup pour nous.'

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
