import { describe, expect, it } from 'vitest'
import { addDays, addMonths, daysBetween, daysInMonth, eachDay, formatDayLong, formatMonth, formatMonthShort, lastMonths, monthOf } from './dates'
import { centsToInput, parseMoney, parseSignedMoney } from './format'
import { getDayPhase } from '../scene/dayPhase'
import { deskSlots, floorSize, ringsFor } from '../scene/layout'

describe('mois', () => {
  it('extrait le mois d\'une date', () => {
    expect(monthOf('2026-11-13')).toBe('2026-11')
  })
  it('décale les mois en passant les années', () => {
    expect(addMonths('2026-11', 2)).toBe('2027-01')
    expect(addMonths('2026-01', -1)).toBe('2025-12')
    expect(addMonths('2026-06', 0)).toBe('2026-06')
  })
  it('liste les derniers mois dans l\'ordre', () => {
    expect(lastMonths('2026-02', 4)).toEqual(['2025-11', '2025-12', '2026-01', '2026-02'])
  })
  it('connaît la longueur des mois, années bissextiles comprises', () => {
    expect(daysInMonth('2026-02')).toBe(28)
    expect(daysInMonth('2028-02')).toBe(29)
    expect(daysInMonth('2026-12')).toBe(31)
  })
  it('écrit les mois en français', () => {
    expect(formatMonth('2026-11')).toBe('novembre 2026')
    expect(formatMonthShort('2026-02')).toBe('févr.')
  })
})

describe('jours', () => {
  it('ajoute des jours en passant les mois', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })
  it('compte les jours entre deux dates', () => {
    expect(daysBetween('2026-11-13', '2026-11-25')).toBe(12)
    expect(daysBetween('2026-11-13', '2026-11-10')).toBe(-3)
    // Changement d'heure d'été : toujours un nombre entier de jours.
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2)
  })
  it('liste tous les jours d\'une période', () => {
    expect(eachDay('2026-11-29', '2026-12-01')).toEqual(['2026-11-29', '2026-11-30', '2026-12-01'])
    expect(eachDay('2026-12-01', '2026-11-29')).toEqual([])
  })
  it('écrit un jour en toutes lettres', () => {
    expect(formatDayLong('2026-11-13')).toBe('ven. 13 novembre')
  })
})

describe('saisie des montants', () => {
  it('accepte point, virgule, espaces et apostrophes', () => {
    expect(parseMoney('12')).toBe(1200)
    expect(parseMoney('12.5')).toBe(1250)
    expect(parseMoney('12,50')).toBe(1250)
    expect(parseMoney("1'200")).toBe(120000)
    expect(parseMoney('1 200.05')).toBe(120005)
    expect(parseMoney('0.07')).toBe(7)
  })
  it('refuse ce qui n\'est pas un montant', () => {
    expect(parseMoney('')).toBeNull()
    expect(parseMoney('abc')).toBeNull()
    expect(parseMoney('12.345')).toBeNull()
    expect(parseMoney('-5')).toBeNull()
  })
  it('accepte un solde négatif quand c\'est demandé', () => {
    expect(parseSignedMoney('-50')).toBe(-5000)
    expect(parseSignedMoney('50')).toBe(5000)
  })
  it('réaffiche un montant dans un champ', () => {
    expect(centsToInput(1250)).toBe('12.50')
    expect(centsToInput(1200)).toBe('12')
    expect(centsToInput(-5000)).toBe('-50')
    expect(centsToInput(0)).toBe('')
  })
})

describe('open space', () => {
  it('allume les lampes le soir et la nuit seulement', () => {
    expect(getDayPhase(8)).toMatchObject({ name: 'morning', lampsOn: false })
    expect(getDayPhase(13)).toMatchObject({ name: 'day', lampsOn: false })
    expect(getDayPhase(19)).toMatchObject({ name: 'evening', lampsOn: true })
    expect(getDayPhase(23)).toMatchObject({ name: 'night', lampsOn: true })
    expect(getDayPhase(3)).toMatchObject({ name: 'night', lampsOn: true })
  })

  it('place chaque bureau à un endroit différent, jamais au centre (réservé au PDG)', () => {
    for (const count of [1, 2, 7, 8, 9, 20]) {
      const slots = deskSlots(count)
      expect(slots).toHaveLength(count)
      expect(new Set(slots.map((slot) => slot.join(','))).size).toBe(count)
      expect(slots.some(([x, z]) => x === 0 && z === 0)).toBe(false)
    }
  })

  it('agrandit le plateau quand il y a plus de 8 bureaux', () => {
    expect(ringsFor(8)).toBe(1)
    expect(ringsFor(9)).toBe(2)
    expect(floorSize(9)).toBeGreaterThan(floorSize(8))
  })
})
