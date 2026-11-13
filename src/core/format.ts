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
