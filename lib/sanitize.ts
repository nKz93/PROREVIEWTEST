/**
 * Sanitisation et validation des entrées utilisateur.
 * Protège contre XSS, injections, et données malformées.
 */

/**
 * Nettoie une chaîne de caractères : retire les balises HTML et caractères dangereux.
 */
export function sanitizeString(input: unknown, maxLength = 500): string {
  if (typeof input !== 'string') return ''
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/<[^>]*>/g, '')       // Retire les balises HTML
    .replace(/[<>"'`]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '`': '&#x60;' }[c] || c))
}

/**
 * Valide et nettoie un numéro de téléphone.
 */
export function sanitizePhone(phone: unknown): string | null {
  if (!phone || typeof phone !== 'string') return null
  const cleaned = phone.replace(/[\s\-\.\(\)]/g, '')
  // Accepte format international (+33...) ou local (06..., 07...)
  if (!/^(\+\d{8,15}|0[1-9]\d{8})$/.test(cleaned)) return null
  // Normaliser en +33...
  if (cleaned.startsWith('0')) return '+33' + cleaned.slice(1)
  return cleaned
}

/**
 * Valide un email.
 */
export function sanitizeEmail(email: unknown): string | null {
  if (!email || typeof email !== 'string') return null
  const e = email.trim().toLowerCase().slice(0, 254)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) return null
  return e
}

/**
 * Valide un UUID v4.
 */
export function isUUID(value: unknown): value is string {
  if (typeof value !== 'string') return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

/**
 * Valide un score entre 1 et 5.
 */
export function sanitizeScore(score: unknown): number | null {
  const n = Number(score)
  if (!Number.isInteger(n) || n < 1 || n > 5) return null
  return n
}

/**
 * Sanitise un tableau de tags.
 */
export function sanitizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return []
  return tags
    .filter(t => typeof t === 'string')
    .map(t => sanitizeString(t, 50))
    .filter(Boolean)
    .slice(0, 10) // Max 10 tags
}
