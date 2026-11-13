import { describe, expect, it } from 'vitest'
import { formatDate, formatMoney, toISODate } from './format'

// Intl utilise des espaces insécables : on les normalise pour comparer.
const normalize = (text: string) => text.replace(/\s/g, ' ')

describe('formatDate', () => {
  it('affiche une date au format suisse JJ.MM.AAAA', () => {
    expect(formatDate('2026-11-13')).toBe('13.11.2026')
  })

  it('accepte aussi une date ISO complète', () => {
    expect(formatDate('2026-01-05T08:30:00.000Z')).toBe('05.01.2026')
  })
})

describe('toISODate', () => {
  it('donne la date locale au format AAAA-MM-JJ', () => {
    expect(toISODate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })
})

describe('formatMoney', () => {
  it('convertit les centimes en montant lisible', () => {
    const text = normalize(formatMoney(123450, 'CHF'))
    // Le séparateur de milliers dépend de l'appareil : « 1 234.50 » ou « 1'234.50 ».
    expect(text).toMatch(/1.234\.50/)
    expect(text).toContain('CHF')
  })

  it('gère zéro et les montants négatifs', () => {
    expect(normalize(formatMoney(0, 'CHF'))).toContain('0.00')
    expect(normalize(formatMoney(-995, 'EUR'))).toMatch(/9[.,]95/)
  })
})
