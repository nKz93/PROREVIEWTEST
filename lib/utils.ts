import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Génère un code unique cryptographiquement sécurisé pour les demandes d'avis
export function generateUniqueCode(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  // Utiliser crypto.getRandomValues pour l'entropie cryptographique
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.getRandomValues) {
    const bytes = new Uint8Array(length)
    globalThis.crypto.getRandomValues(bytes)
    return Array.from(bytes).map(b => chars[b % chars.length]).join('')
  }
  // Fallback Node.js (côté serveur)
  const { randomBytes } = require('crypto')
  const bytes: Buffer = randomBytes(length)
  return Array.from(bytes).map((b: number) => chars[b % chars.length]).join('')
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('fr-FR').format(num)
}

export function formatDate(date: string | Date): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date))
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'EUR',
  }).format(cents / 100)
}

export function interpolateTemplate(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => variables[key] || match)
}

export function calculateRate(numerator: number, denominator: number): number {
  if (denominator === 0) return 0
  return Math.round((numerator / denominator) * 100)
}

export function getLast30DaysLabels(): string[] {
  const labels = []
  for (let i = 29; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    labels.push(date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }))
  }
  return labels
}

// Renvoie les dates ISO des 30 derniers jours pour les requêtes DB
export function getLast30DaysISO(): { label: string; date: string }[] {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    d.setHours(0, 0, 0, 0)
    return {
      label: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      date: d.toISOString(),
    }
  })
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidPhone(phone: string): boolean {
  return /^(\+33|0)[1-9](\d{8})$/.test(phone.replace(/\s/g, ''))
}

export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\s|-|\./g, '')
  if (cleaned.startsWith('0')) return '+33' + cleaned.slice(1)
  return cleaned
}

export function formatRelativeDate(date: string | Date): string {
  if (!date) return '—'
  const now = new Date()
  const d = new Date(date)
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'À l\'instant'
  if (diffMins < 60) return `Il y a ${diffMins} min`
  if (diffHours < 24) return `Il y a ${diffHours}h`
  if (diffDays < 7) return `Il y a ${diffDays}j`
  return formatDate(date)
}

// Slugifier pour les noms de business
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30)
}
