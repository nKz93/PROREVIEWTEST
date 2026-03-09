/**
 * Rate limiter simple basé sur IP.
 * En production avec plusieurs instances Vercel, utiliser Upstash Redis.
 * Pour une app à faible trafic, cette implémentation en mémoire suffit.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Nettoyer les entrées expirées toutes les 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key)
  }
}, 5 * 60 * 1000)

interface RateLimitOptions {
  windowMs: number  // Fenêtre de temps en ms
  max: number       // Nb max de requêtes dans la fenêtre
  identifier: string // IP ou user_id
}

export function checkRateLimit({ windowMs, max, identifier }: RateLimitOptions): {
  allowed: boolean
  remaining: number
  resetAt: number
} {
  const now = Date.now()
  const key = identifier
  const existing = store.get(key)

  if (!existing || existing.resetAt < now) {
    // Nouvelle fenêtre
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: max - 1, resetAt: now + windowMs }
  }

  if (existing.count >= max) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt }
  }

  existing.count++
  return { allowed: true, remaining: max - existing.count, resetAt: existing.resetAt }
}

/**
 * Extrait l'IP réelle d'une requête Next.js
 */
export function getIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') || 'unknown'
}
