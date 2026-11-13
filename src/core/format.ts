import type { CurrencyCode } from './db/types'

const LOCALE = 'fr-CH'

/** Devises proposées dans l'appli. */
export const CURRENCIES: { code: CurrencyCode; label: string; flag: string }[] = [
  { code: 'CHF', label: 'Franc suisse', flag: '🇨🇭' },
  { code: 'EUR', label: 'Euro', flag: '🇪🇺' },
  { code: 'USD', label: 'Dollar américain', flag: '🇺🇸' },
  { code: 'GBP', label: 'Livre sterling', flag: '🇬🇧' },
  { code: 'CAD', label: 'Dollar canadien', flag: '🇨🇦' },
]

/** Les montants sont stockés en centimes entiers pour éviter les erreurs d'arrondi. */
export function formatMoney(cents: number, currency: CurrencyCode): string {
  return new Intl.NumberFormat(LOCALE, { style: 'currency', currency }).format(cents / 100)
}

/** Montant arrondi à l'unité, pour les chiffres clés (« 1 235 CHF »). */
export function formatMoneyRounded(cents: number, currency: CurrencyCode): string {
  return new Intl.NumberFormat(LOCALE, { style: 'currency', currency, maximumFractionDigits: 0 }).format(
    Math.round(cents / 100),
  )
}

/**
 * Lit un montant tapé par l'utilisateur (« 12 », « 12.5 », « 12,50 », « 1'200 ») en centimes.
 * Renvoie `null` si le texte n'est pas un montant valide.
 */
export function parseMoney(input: string): number | null {
  const clean = input.replace(/[\s'’]/g, '').replace(',', '.')
  if (clean === '' || clean === '.' || !/^\d*\.?\d{0,2}$/.test(clean)) return null
  return Math.round(Number(clean) * 100)
}

/** Comme parseMoney, mais accepte un signe « - » devant (solde d'un compte à découvert). */
export function parseSignedMoney(input: string): number | null {
  const trimmed = input.trim()
  const negative = trimmed.startsWith('-')
  const cents = parseMoney(negative ? trimmed.slice(1) : trimmed)
  if (cents === null) return null
  return negative ? -cents : cents
}

/** Centimes → texte pour un champ de saisie (1250 → « 12.50 », 1200 → « 12 »). */
export function centsToInput(cents: number): string {
  if (cents === 0) return ''
  const sign = cents < 0 ? '-' : ''
  const absolute = Math.abs(cents)
  return sign + (absolute % 100 === 0 ? String(absolute / 100) : (absolute / 100).toFixed(2))
}

/** Date du jour (ou d'un objet Date) au format de stockage AAAA-MM-JJ, en heure locale. */
export function toISODate(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Affiche une date stockée (AAAA-MM-JJ ou ISO complet) au format suisse JJ.MM.AAAA. */
export function formatDate(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split('-')
  return `${day}.${month}.${year}`
}
