import type { BaseEntity } from '../../core/db/types'

export type TransactionType = 'expense' | 'income'

/** Un compte (courant, épargne, cash). Pas de connexion bancaire : tout est saisi à la main. */
export interface Account extends BaseEntity {
  name: string
  kind: 'checking' | 'savings' | 'cash'
  /** Solde de départ. Solde actuel = solde de départ + revenus − dépenses du compte. */
  openingBalanceCents: number
}

export interface Category extends BaseEntity {
  name: string
  icon: string
  /** Couleur dans les graphiques (palette fixe, voir palette.ts). */
  color: string
  kind: TransactionType
  order: number
  /** Catégories que l'appli doit savoir retrouver (ex. dépenses de voyage). */
  systemKey: 'travel' | 'other' | null
}

/** Une dépense ou un revenu. Le montant est toujours positif, en centimes. */
export interface Transaction extends BaseEntity {
  type: TransactionType
  amountCents: number
  categoryId: string | null
  accountId: string | null
  /** AAAA-MM-JJ */
  date: string
  note: string
  /** Voyage auquel la dépense est rattachée (bureau Voyages). */
  tripId: string | null
  /** Qui a payé (dépense de voyage). `null` ou ME = moi : seules celles-ci comptent dans mes finances. */
  paidBy: string | null
  /** Entre qui la dépense est partagée (dépense de voyage). */
  splitBetween: string[] | null
  /** Règle récurrente qui a créé cette ligne, et pour quel mois (AAAA-MM). */
  recurringId: string | null
  recurringMonth: string | null
}

/** Budget mensuel d'une catégorie. */
export interface Budget extends BaseEntity {
  categoryId: string
  amountCents: number
}

/** Dépense ou revenu qui revient chaque mois (loyer, abonnement, salaire). */
export interface RecurringRule extends BaseEntity {
  name: string
  type: TransactionType
  amountCents: number
  categoryId: string | null
  accountId: string | null
  /** Jour du mois (1 à 31 ; ramené au dernier jour si le mois est plus court). */
  dayOfMonth: number
  /** Premier mois concerné (AAAA-MM). */
  startMonth: string
  active: boolean
}

/** Tirelire : objectif d'épargne avec montant cible et date facultative. */
export interface SavingsGoal extends BaseEntity {
  name: string
  icon: string
  targetCents: number
  savedCents: number
  targetDate: string | null
}

/** Tables Dexie du bureau (ajoutées en version 2 de la base). */
export const financesSchemaV2 = {
  accounts: 'id',
  transactions: 'id, date, tripId, recurringId',
  categories: 'id, order',
  budgets: 'id, categoryId',
  recurringRules: 'id',
  savingsGoals: 'id',
}
