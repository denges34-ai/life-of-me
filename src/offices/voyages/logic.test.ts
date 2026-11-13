import { describe, expect, it } from 'vitest'
import { computeBalances, countdownLabel, daysUntil, formatTripDates, nextTrip, settle, tripDays, tripStatus } from './logic'

const TODAY = '2026-11-13'
const trip = (startDate: string | null, endDate: string | null = startDate) => ({ startDate, endDate })

describe('statut d\'un voyage', () => {
  it('distingue envie, à venir, en cours et passé', () => {
    expect(tripStatus(trip(null), TODAY)).toBe('wish')
    expect(tripStatus(trip('2026-12-20', '2026-12-27'), TODAY)).toBe('upcoming')
    expect(tripStatus(trip('2026-11-10', '2026-11-15'), TODAY)).toBe('ongoing')
    expect(tripStatus(trip('2026-11-13'), TODAY)).toBe('ongoing')
    expect(tripStatus(trip('2026-10-01', '2026-10-05'), TODAY)).toBe('past')
  })

  it('compte les jours avant le départ', () => {
    expect(daysUntil(trip('2026-11-25'), TODAY)).toBe(12)
    expect(daysUntil(trip('2026-11-13'), TODAY)).toBe(0)
    expect(daysUntil(trip(null), TODAY)).toBeNull()
  })

  it('affiche le bon compte à rebours', () => {
    expect(countdownLabel(trip('2026-11-25'), TODAY)).toBe('J-12')
    expect(countdownLabel(trip('2026-11-10', '2026-11-15'), TODAY)).toBe('En voyage')
    expect(countdownLabel(trip('2026-10-01'), TODAY)).toBe('Terminé')
    expect(countdownLabel(trip(null), TODAY)).toBeNull()
  })

  it('liste tous les jours du voyage', () => {
    expect(tripDays(trip('2026-12-30', '2027-01-02'))).toEqual(['2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02'])
    expect(tripDays(trip(null))).toEqual([])
  })

  it('formate les dates au format suisse', () => {
    expect(formatTripDates(trip('2026-07-12', '2026-07-19'))).toBe('12.07.2026 – 19.07.2026')
    expect(formatTripDates(trip('2026-07-12'))).toBe('12.07.2026')
  })
})

describe('prochain voyage', () => {
  it('choisit le voyage en cours, sinon le départ le plus proche', () => {
    const later = trip('2027-02-01')
    const sooner = trip('2026-12-01')
    const ongoing = trip('2026-11-12', '2026-11-14')
    expect(nextTrip([later, sooner, trip(null), trip('2026-01-01')], TODAY)).toBe(sooner)
    expect(nextTrip([later, sooner, ongoing], TODAY)).toBe(ongoing)
    expect(nextTrip([trip(null), trip('2026-01-01')], TODAY)).toBeNull()
  })
})

describe('qui doit quoi', () => {
  const two = ['me', 'Léa']

  it('partage une dépense en deux', () => {
    const balances = computeBalances([{ amountCents: 10000, paidBy: 'me', splitBetween: two }], two)
    expect(balances.get('me')).toBe(5000)
    expect(balances.get('Léa')).toBe(-5000)
    expect(settle(balances)).toEqual([{ from: 'Léa', to: 'me', amountCents: 5000 }])
  })

  it('compense les dépenses de chacun', () => {
    const balances = computeBalances(
      [
        { amountCents: 10000, paidBy: 'me', splitBetween: two },
        { amountCents: 4000, paidBy: 'Léa', splitBetween: two },
      ],
      two,
    )
    expect(settle(balances)).toEqual([{ from: 'Léa', to: 'me', amountCents: 3000 }])
  })

  it('ne doit rien quand tout est équilibré', () => {
    const balances = computeBalances(
      [
        { amountCents: 5000, paidBy: 'me', splitBetween: two },
        { amountCents: 5000, paidBy: 'Léa', splitBetween: two },
      ],
      two,
    )
    expect(settle(balances)).toEqual([])
  })

  it('une dépense pour une seule personne n\'est due que par elle', () => {
    const balances = computeBalances([{ amountCents: 3000, paidBy: 'me', splitBetween: ['Léa'] }], two)
    expect(settle(balances)).toEqual([{ from: 'Léa', to: 'me', amountCents: 3000 }])
  })

  it('répartit les centimes qui ne tombent pas juste, sans rien perdre', () => {
    const three = ['me', 'Léa', 'Tom']
    const balances = computeBalances([{ amountCents: 10000, paidBy: 'me', splitBetween: three }], three)
    expect([...balances.values()].reduce((sum, cents) => sum + cents, 0)).toBe(0)
    const transfers = settle(balances)
    expect(transfers.reduce((sum, t) => sum + t.amountCents, 0)).toBe(balances.get('me'))
  })

  it('partage entre tout le monde si aucun partage n\'est précisé', () => {
    const balances = computeBalances([{ amountCents: 6000, paidBy: 'Léa', splitBetween: [] }], two)
    expect(balances.get('me')).toBe(-3000)
  })

  it('règle un groupe de trois avec le moins de remboursements possible', () => {
    const three = ['me', 'Léa', 'Tom']
    const balances = computeBalances(
      [
        { amountCents: 9000, paidBy: 'me', splitBetween: three },
        { amountCents: 3000, paidBy: 'Léa', splitBetween: three },
      ],
      three,
    )
    // me : +5000, Léa : −1000, Tom : −4000
    expect(settle(balances)).toEqual([
      { from: 'Tom', to: 'me', amountCents: 4000 },
      { from: 'Léa', to: 'me', amountCents: 1000 },
    ])
  })
})
