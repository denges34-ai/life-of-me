import type { BaseEntity } from '../../core/db/types'

/** Un voyage. Sans date de départ, c'est une « envie » (destination de rêve). */
export interface Trip extends BaseEntity {
  destination: string
  emoji: string
  /** AAAA-MM-JJ, ou `null` pour une envie. */
  startDate: string | null
  endDate: string | null
  /** Noms des participants. ME (« me ») représente le PDG et est toujours présent. */
  participants: string[]
  budgetCents: number
  notes: string
}

export type TripStatus = 'wish' | 'upcoming' | 'ongoing' | 'past'

/** Une activité de l'itinéraire. */
export interface ItineraryItem extends BaseEntity {
  tripId: string
  date: string
  /** HH:MM, ou vide si pas d'horaire. */
  time: string
  title: string
  address: string
  note: string
}

export type BookingKind = 'lodging' | 'transport' | 'document'

/** Hébergement, transport ou document à prévoir. */
export interface Booking extends BaseEntity {
  tripId: string
  kind: BookingKind
  title: string
  details: string
  /** Réservé / prêt. */
  done: boolean
}

export interface PackingItem extends BaseEntity {
  tripId: string
  label: string
  packed: boolean
}

/** Tables Dexie du bureau (ajoutées en version 2 de la base). */
export const voyagesSchemaV2 = {
  trips: 'id, startDate',
  itineraryItems: 'id, tripId, date',
  bookings: 'id, tripId',
  packingItems: 'id, tripId',
}
