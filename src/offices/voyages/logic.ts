import { daysBetween, eachDay } from '../../core/dates'
import { ME } from '../../core/db/types'
import { formatDate } from '../../core/format'
import type { Trip, TripStatus } from './types'

// Logique métier du bureau Voyages : uniquement des fonctions pures, testées.

type TripDates = Pick<Trip, 'startDate' | 'endDate'>

/** Dernier jour du voyage (un voyage sans date de fin dure un jour). */
const lastDay = (trip: TripDates): string | null => trip.endDate ?? trip.startDate

export function tripStatus(trip: TripDates, today: string): TripStatus {
  if (!trip.startDate) return 'wish'
  if (today < trip.startDate) return 'upcoming'
  return today > (lastDay(trip) as string) ? 'past' : 'ongoing'
}

/** Jours restants avant le départ (0 = aujourd'hui, négatif = déjà parti). `null` pour une envie. */
export function daysUntil(trip: TripDates, today: string): number | null {
  return trip.startDate ? daysBetween(today, trip.startDate) : null
}

/** Tous les jours du voyage, du départ au retour. */
export function tripDays(trip: TripDates): string[] {
  if (!trip.startDate) return []
  return eachDay(trip.startDate, lastDay(trip) as string)
}

/** Le voyage à mettre en avant : celui en cours, sinon le prochain départ. */
export function nextTrip<T extends TripDates>(trips: T[], today: string): T | null {
  const ongoing = trips.find((trip) => tripStatus(trip, today) === 'ongoing')
  if (ongoing) return ongoing
  const upcoming = trips
    .filter((trip) => tripStatus(trip, today) === 'upcoming')
    .sort((a, b) => (a.startDate as string).localeCompare(b.startDate as string))
  return upcoming[0] ?? null
}

/** Texte court du compte à rebours, affiché sur le bureau 3D et les cartes. */
export function countdownLabel(trip: TripDates, today: string): string | null {
  const status = tripStatus(trip, today)
  if (status === 'wish') return null
  if (status === 'ongoing') return 'En voyage'
  if (status === 'past') return 'Terminé'
  return `J-${daysUntil(trip, today)}`
}

/** « 12.07.2026 – 19.07.2026 », ou une seule date, ou rien pour une envie. */
export function formatTripDates(trip: TripDates): string {
  if (!trip.startDate) return 'Un jour, peut-être…'
  const end = lastDay(trip) as string
  return end === trip.startDate ? formatDate(trip.startDate) : `${formatDate(trip.startDate)} – ${formatDate(end)}`
}

/** Nom affiché d'un participant (« me » devient le prénom du PDG). */
export function participantName(participant: string, myName: string): string {
  return participant === ME ? myName || 'Moi' : participant
}

// ---------- Qui doit quoi ----------

export interface SharedExpense {
  amountCents: number
  paidBy: string
  /** Vide = partagé entre tous les participants. */
  splitBetween: string[]
}

/**
 * Solde de chaque participant : positif = on lui doit de l'argent, négatif = il en doit.
 * Les centimes qui ne tombent pas juste sont répartis un par un, pour que la somme fasse toujours zéro.
 */
export function computeBalances(expenses: SharedExpense[], participants: string[]): Map<string, number> {
  const balances = new Map<string, number>(participants.map((participant) => [participant, 0]))
  const add = (who: string, cents: number) => balances.set(who, (balances.get(who) ?? 0) + cents)

  for (const expense of expenses) {
    const sharers = expense.splitBetween.length > 0 ? expense.splitBetween : participants
    if (sharers.length === 0) continue
    const base = Math.floor(expense.amountCents / sharers.length)
    const remainder = expense.amountCents - base * sharers.length
    add(expense.paidBy, expense.amountCents)
    sharers.forEach((sharer, index) => add(sharer, -(base + (index < remainder ? 1 : 0))))
  }
  return balances
}

export interface Transfer {
  from: string
  to: string
  amountCents: number
}

/** Liste minimale de remboursements pour remettre tout le monde à zéro. */
export function settle(balances: ReadonlyMap<string, number>): Transfer[] {
  const debtors = [...balances].filter(([, cents]) => cents < 0).map(([who, cents]) => ({ who, cents: -cents }))
  const creditors = [...balances].filter(([, cents]) => cents > 0).map(([who, cents]) => ({ who, cents }))
  debtors.sort((a, b) => b.cents - a.cents)
  creditors.sort((a, b) => b.cents - a.cents)

  const transfers: Transfer[] = []
  let d = 0
  let c = 0
  while (d < debtors.length && c < creditors.length) {
    const amountCents = Math.min(debtors[d].cents, creditors[c].cents)
    if (amountCents > 0) transfers.push({ from: debtors[d].who, to: creditors[c].who, amountCents })
    debtors[d].cents -= amountCents
    creditors[c].cents -= amountCents
    if (debtors[d].cents === 0) d++
    if (creditors[c].cents === 0) c++
  }
  return transfers
}
