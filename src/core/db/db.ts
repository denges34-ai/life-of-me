import Dexie, { type EntityTable } from 'dexie'
import {
  financesSchemaV2,
  type Account,
  type Budget,
  type Category,
  type RecurringRule,
  type SavingsGoal,
  type Transaction,
} from '../../offices/finances/types'
import {
  voyagesSchemaV2,
  type Booking,
  type ItineraryItem,
  type PackingItem,
  type Trip,
} from '../../offices/voyages/types'
import type { AppSettings, OfficeConfig, Profile } from './types'

/** Identifiant de l'unique ligne de réglages. */
export const SETTINGS_ID = 'app'

/**
 * Base de données locale (IndexedDB).
 *
 * RÈGLE D'OR : ne jamais modifier une version existante. Pour changer le schéma,
 * ajouter un nouveau bloc `this.version(n + 1)` (avec `.upgrade()` si besoin) :
 * c'est ce qui garantit qu'aucune donnée n'est perdue lors d'une mise à jour.
 */
export class LifeOfMeDB extends Dexie {
  profiles!: EntityTable<Profile, 'id'>
  settings!: EntityTable<AppSettings, 'id'>
  officeConfigs!: EntityTable<OfficeConfig, 'id'>

  // Finances
  accounts!: EntityTable<Account, 'id'>
  transactions!: EntityTable<Transaction, 'id'>
  categories!: EntityTable<Category, 'id'>
  budgets!: EntityTable<Budget, 'id'>
  recurringRules!: EntityTable<RecurringRule, 'id'>
  savingsGoals!: EntityTable<SavingsGoal, 'id'>

  // Voyages
  trips!: EntityTable<Trip, 'id'>
  itineraryItems!: EntityTable<ItineraryItem, 'id'>
  bookings!: EntityTable<Booking, 'id'>
  packingItems!: EntityTable<PackingItem, 'id'>

  constructor() {
    super('life-of-me')

    // v1 — phase 0 : profil, réglages, configuration des bureaux.
    this.version(1).stores({
      profiles: 'id',
      settings: 'id',
      officeConfigs: 'id, officeId, order',
    })

    // v2 — phase 1 : bureaux Finances et Voyages. Les tables de la v1 sont conservées telles quelles.
    this.version(2).stores({
      ...financesSchemaV2,
      ...voyagesSchemaV2,
    })
  }
}

export const db = new LifeOfMeDB()
