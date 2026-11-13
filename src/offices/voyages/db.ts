import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../core/db/db'
import type { EntityData } from '../../core/db/entity'
import { alive, createIn, removeIn, updateIn } from '../../core/db/repo'
import { ME } from '../../core/db/types'
import { emitEvent } from '../../core/events'
import { addTransaction, getTravelCategoryId, updateTransaction } from '../finances/db'
import { useFinanceStore } from '../finances/store'
import type { Transaction } from '../finances/types'
import type { Booking, ItineraryItem, PackingItem, Trip } from './types'

// Lectures et écritures du bureau Voyages.
// Tout ce qui touche aux voyages est « partagé » : visible par l'associée en phase 3.

const SHARED = 'shared' as const

// ---------- Lecture ----------

export async function loadTrips(): Promise<Trip[]> {
  return alive(await db.trips.toArray())
}

export function useTrips(): Trip[] | undefined {
  return useLiveQuery(loadTrips, [])
}

/** Dépenses rattachées à un voyage (toutes, quel que soit le payeur). */
export async function loadTripExpenses(tripId: string): Promise<Transaction[]> {
  const expenses = alive(await db.transactions.where('tripId').equals(tripId).toArray())
  return expenses.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
}

export interface TripBundle {
  trip: Trip
  itinerary: ItineraryItem[]
  bookings: Booking[]
  packing: PackingItem[]
  expenses: Transaction[]
}

/** Un voyage et tout ce qui va avec. `null` si le voyage n'existe pas (ou plus). */
export function useTripBundle(tripId: string): TripBundle | null | undefined {
  return useLiveQuery(async () => {
    const trip = await db.trips.get(tripId)
    if (!trip || trip.deletedAt) return null
    const [itinerary, bookings, packing, expenses] = await Promise.all([
      db.itineraryItems.where('tripId').equals(tripId).toArray(),
      db.bookings.where('tripId').equals(tripId).toArray(),
      db.packingItems.where('tripId').equals(tripId).toArray(),
      loadTripExpenses(tripId),
    ])
    return {
      trip,
      itinerary: alive(itinerary).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)),
      bookings: alive(bookings).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      packing: alive(packing).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      expenses,
    }
  }, [tripId])
}

// ---------- Voyages ----------

export async function saveTrip(input: EntityData<Trip>, id?: string): Promise<string> {
  if (id) {
    await updateIn(db.trips, id, input)
    return id
  }
  const trip = await createIn(db.trips, input, SHARED)
  emitEvent('trip.created')
  return trip.id
}

export const deleteTrip = (id: string) => removeIn(db.trips, id)

// ---------- Itinéraire ----------

export async function saveItineraryItem(input: EntityData<ItineraryItem>, id?: string): Promise<void> {
  if (id) return updateIn(db.itineraryItems, id, input)
  await createIn(db.itineraryItems, input, SHARED)
  emitEvent('trip.itineraryItemAdded')
}

export const deleteItineraryItem = (id: string) => removeIn(db.itineraryItems, id)

// ---------- Hébergement, transports, documents ----------

export async function saveBooking(input: EntityData<Booking>, id?: string): Promise<void> {
  if (id) return updateIn(db.bookings, id, input)
  await createIn(db.bookings, input, SHARED)
}

export const toggleBooking = (booking: Booking) => updateIn(db.bookings, booking.id, { done: !booking.done })
export const deleteBooking = (id: string) => removeIn(db.bookings, id)

// ---------- Valise ----------

/** Ajoute des objets à la valise, sans créer de doublon (comparaison sans majuscules). */
export async function addPackingItems(tripId: string, labels: string[], existing: PackingItem[]): Promise<number> {
  const known = new Set(existing.map((item) => item.label.trim().toLowerCase()))
  let added = 0
  await db.transaction('rw', db.packingItems, db.settings, async () => {
    for (const raw of labels) {
      const label = raw.trim()
      if (!label || known.has(label.toLowerCase())) continue
      known.add(label.toLowerCase())
      await createIn(db.packingItems, { tripId, label, packed: false }, SHARED)
      added++
    }
  })
  return added
}

export async function togglePacked(item: PackingItem): Promise<void> {
  await updateIn(db.packingItems, item.id, { packed: !item.packed })
  if (!item.packed) emitEvent('trip.packingItemChecked')
}

export const deletePackingItem = (id: string) => removeIn(db.packingItems, id)

// ---------- Dépenses du voyage (liées au bureau Finances) ----------

export interface TripExpenseInput {
  amountCents: number
  note: string
  date: string
  paidBy: string
  splitBetween: string[]
}

/** Compte débité quand c'est moi qui paie : le dernier utilisé, sinon le premier. */
async function myAccountId(): Promise<string | null> {
  const accounts = alive(await db.accounts.toArray())
  const last = useFinanceStore.getState().lastAccountId
  return accounts.find((account) => account.id === last)?.id ?? accounts[0]?.id ?? null
}

/**
 * Une dépense de voyage est un mouvement du bureau Finances rattaché au voyage.
 * Si c'est moi qui paie, elle compte dans mon budget ; sinon elle ne sert qu'au « qui doit quoi ».
 */
export async function saveTripExpense(tripId: string, input: TripExpenseInput, id?: string): Promise<void> {
  const accountId = input.paidBy === ME ? await myAccountId() : null
  if (id) {
    await updateTransaction(id, { ...input, accountId })
    return
  }
  await addTransaction({
    type: 'expense',
    categoryId: await getTravelCategoryId(),
    accountId,
    tripId,
    ...input,
  })
}
