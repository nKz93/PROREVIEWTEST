import { createHash, randomBytes } from 'crypto'

/**
 * Génère une nouvelle clé API.
 * Retourne la clé en clair (à montrer une seule fois) et son hash (à stocker).
 */
export function generateApiKey(): { rawKey: string; hash: string; prefix: string } {
  const rawKey = 'prv_' + randomBytes(32).toString('hex') // 64 chars hex = 256 bits entropy
  const hash = hashApiKey(rawKey)
  const prefix = rawKey.slice(0, 12) // "prv_xxxxxxxx" — affiché dans l'UI pour identifier la clé
  return { rawKey, hash, prefix }
}

/**
 * Hash une clé API avec SHA-256.
 * Assez fort pour des clés longues et aléatoires (pas de besoin de bcrypt ici —
 * SHA-256 est suffisant pour des secrets à haute entropie, contrairement aux mots de passe).
 */
export function hashApiKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex')
}
