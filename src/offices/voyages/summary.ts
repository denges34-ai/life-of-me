import { db } from '../../core/db/db'
import { alive } from '../../core/db/repo'
import { daysBetween } from '../../core/dates'
import type { OfficeSummary, SummaryContext } from '../../core/offices/types'
import { loadTripExpenses, loadTrips } from './db'
import { countdownLabel, daysUntil, nextTrip, tripDays, tripStatus } from './logic'

/** À partir de combien de jours avant le départ on rappelle la valise. */
const PACKING_REMINDER_DAYS = 7

/** Ce que le bureau Voyages raconte à l'open space et à la Salle du PDG. */
export async function getVoyagesSummary({ today }: SummaryContext): Promise<OfficeSummary> {
  const trips = await loadTrips()
  const wishes = trips.filter((trip) => tripStatus(trip, today) === 'wish').length
  const done = trips.filter((trip) => tripStatus(trip, today) === 'past').length
  const next = nextTrip(trips, today)

  if (!next) {
    return {
      state: 'ok',
      badge: null,
      deskLabel: null,
      keyFigures: [
        { label: 'Prochain voyage', value: '—' },
        { label: 'Envies', value: String(wishes) },
        { label: 'Voyages faits', value: String(done) },
      ],
      briefing: [wishes > 0 ? `Aucun voyage prévu… mais ${wishes} envie${wishes > 1 ? 's' : ''} en attente.` : 'Aucun voyage prévu pour l\'instant.'],
    }
  }

  const ongoing = tripStatus(next, today) === 'ongoing'
  const days = daysUntil(next, today) ?? 0
  const packing = alive(await db.packingItems.where('tripId').equals(next.id).toArray())
  const unpacked = packing.filter((item) => !item.packed).length
  const spent = (await loadTripExpenses(next.id)).reduce((sum, expense) => sum + expense.amountCents, 0)
  const overBudget = next.budgetCents > 0 && spent > next.budgetCents
  const packingDue = !ongoing && days <= PACKING_REMINDER_DAYS && unpacked > 0

  const name = `${next.emoji} ${next.destination}`
  const briefing: string[] = []
  if (ongoing) {
    briefing.push(`${name} : jour ${daysBetween(next.startDate as string, today) + 1} sur ${tripDays(next).length}. Profite !`)
  } else {
    briefing.push(days === 0 ? `${name} : c'est aujourd'hui !` : `${name} dans ${days} jour${days > 1 ? 's' : ''}`)
  }
  if (packingDue) briefing.push(`Valise : encore ${unpacked} chose${unpacked > 1 ? 's' : ''} à préparer`)
  if (overBudget) briefing.push(`Budget du voyage ${next.destination} dépassé`)

  return {
    state: overBudget ? 'alert' : packingDue ? 'busy' : 'ok',
    badge: overBudget ? '!' : packingDue ? String(unpacked) : null,
    deskLabel: countdownLabel(next, today),
    keyFigures: [
      { label: 'Prochain voyage', value: next.destination },
      { label: 'Départ', value: countdownLabel(next, today) ?? '—' },
      { label: 'Envies', value: String(wishes) },
    ],
    briefing,
  }
}
