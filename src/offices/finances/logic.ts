import { addMonths, daysInMonth, monthOf } from '../../core/dates'
import { ME } from '../../core/db/types'
import type { Account, Budget, Category, RecurringRule, SavingsGoal, Transaction } from './types'

// Logique métier du bureau Finances : uniquement des fonctions pures (aucun accès à la base),
// pour être testées facilement.

/** Tout ce que le bureau Finances a besoin de lire. */
export interface FinanceData {
  accounts: Account[]
  /** Triées dans l'ordre d'affichage. */
  categories: Category[]
  budgets: Budget[]
  rules: RecurringRule[]
  goals: SavingsGoal[]
  /** Uniquement MES mouvements (voir `isMine`). */
  transactions: Transaction[]
  /** Pour chaque règle récurrente, les mois déjà générés (même si la ligne a été supprimée ensuite). */
  generatedByRule: Map<string, Set<string>>
}

/** Une dépense de voyage payée par quelqu'un d'autre ne sort pas de ma poche. */
export const isMine = (transaction: Pick<Transaction, 'paidBy'>): boolean =>
  transaction.paidBy === null || transaction.paidBy === ME

export interface MonthTotals {
  incomeCents: number
  expenseCents: number
}

export function monthTotals(transactions: Transaction[], month: string): MonthTotals {
  const totals: MonthTotals = { incomeCents: 0, expenseCents: 0 }
  for (const transaction of transactions) {
    if (monthOf(transaction.date) !== month) continue
    if (transaction.type === 'income') totals.incomeCents += transaction.amountCents
    else totals.expenseCents += transaction.amountCents
  }
  return totals
}

/** Dépenses du mois par catégorie (clé `null` = sans catégorie). */
export function spentByCategory(transactions: Transaction[], month: string): Map<string | null, number> {
  const spent = new Map<string | null, number>()
  for (const transaction of transactions) {
    if (transaction.type !== 'expense' || monthOf(transaction.date) !== month) continue
    spent.set(transaction.categoryId, (spent.get(transaction.categoryId) ?? 0) + transaction.amountCents)
  }
  return spent
}

// ---------- Budgets ----------

export type BudgetLevel = 'ok' | 'warning' | 'over'

/** À partir de 80 % du budget, on prévient (orange). */
export const BUDGET_WARNING_RATIO = 0.8

/** Vert tant qu'on est large, orange à l'approche du plafond, rouge une fois dépassé. */
export function budgetLevel(spentCents: number, budgetCents: number): BudgetLevel {
  if (budgetCents <= 0) return spentCents > 0 ? 'over' : 'ok'
  const ratio = spentCents / budgetCents
  if (ratio > 1) return 'over'
  return ratio >= BUDGET_WARNING_RATIO ? 'warning' : 'ok'
}

export interface BudgetRow {
  category: Category
  spentCents: number
  /** `null` = pas de budget défini pour cette catégorie. */
  budgetCents: number | null
  level: BudgetLevel
}

/** Une ligne par catégorie de dépense, avec ce qui a été dépensé ce mois-ci et l'état du budget. */
export function budgetRows(data: FinanceData, month: string): BudgetRow[] {
  const spent = spentByCategory(data.transactions, month)
  return data.categories
    .filter((category) => category.kind === 'expense')
    .map((category) => {
      const budget = data.budgets.find((b) => b.categoryId === category.id)
      const spentCents = spent.get(category.id) ?? 0
      const budgetCents = budget ? budget.amountCents : null
      return {
        category,
        spentCents,
        budgetCents,
        level: budgetCents === null ? 'ok' : budgetLevel(spentCents, budgetCents),
      }
    })
}

/** Pourcentage borné entre 0 et 100 (0 si le total est nul). */
export function percent(part: number, total: number): number {
  if (total <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((part / total) * 100)))
}

// ---------- Récurrents ----------

/** Date d'une échéance dans un mois donné (le 31 devient le 30 ou le 28 si besoin). */
export function recurringDate(rule: Pick<RecurringRule, 'dayOfMonth'>, month: string): string {
  const day = Math.min(Math.max(1, rule.dayOfMonth), daysInMonth(month))
  return `${month}-${String(day).padStart(2, '0')}`
}

/**
 * Premier mois d'une nouvelle règle : on ne rattrape jamais le passé.
 * Si le jour est déjà passé ce mois-ci, la règle démarre le mois prochain.
 */
export function defaultStartMonth(dayOfMonth: number, today: string): string {
  const month = monthOf(today)
  return recurringDate({ dayOfMonth }, month) >= today ? month : addMonths(month, 1)
}

export interface Occurrence {
  month: string
  date: string
}

/**
 * Échéances arrivées à terme et pas encore créées.
 * `generatedMonths` : mois pour lesquels la ligne existe déjà.
 * On remonte au maximum de `maxBacklog` mois (appli pas ouverte pendant longtemps).
 */
export function dueOccurrences(
  rule: Pick<RecurringRule, 'active' | 'dayOfMonth' | 'startMonth'>,
  generatedMonths: ReadonlySet<string>,
  today: string,
  maxBacklog = 12,
): Occurrence[] {
  if (!rule.active) return []
  const currentMonth = monthOf(today)
  const earliest = addMonths(currentMonth, -(maxBacklog - 1))
  const due: Occurrence[] = []
  for (let month = rule.startMonth > earliest ? rule.startMonth : earliest; month <= currentMonth; month = addMonths(month, 1)) {
    const date = recurringDate(rule, month)
    if (date <= today && !generatedMonths.has(month)) due.push({ month, date })
  }
  return due
}

/** Récurrents encore à venir d'ici la fin du mois en cours. */
export function upcomingThisMonth(
  rules: RecurringRule[],
  generatedByRule: ReadonlyMap<string, ReadonlySet<string>>,
  today: string,
): MonthTotals {
  const month = monthOf(today)
  const totals: MonthTotals = { incomeCents: 0, expenseCents: 0 }
  for (const rule of rules) {
    if (!rule.active || rule.startMonth > month) continue
    if (generatedByRule.get(rule.id)?.has(month)) continue
    if (recurringDate(rule, month) <= today) continue
    if (rule.type === 'income') totals.incomeCents += rule.amountCents
    else totals.expenseCents += rule.amountCents
  }
  return totals
}

/**
 * « Reste à vivre » du mois : ce qui est entré, moins ce qui est sorti,
 * en comptant déjà les récurrents prévus d'ici la fin du mois.
 */
export function remainingToLive(totals: MonthTotals, upcoming: MonthTotals): number {
  return totals.incomeCents + upcoming.incomeCents - totals.expenseCents - upcoming.expenseCents
}

export interface MonthView {
  totals: MonthTotals
  /** Récurrents à venir (toujours à zéro pour un mois passé). */
  upcoming: MonthTotals
  remainingCents: number
  budgets: BudgetRow[]
}

/** Tout ce qu'il faut pour afficher un mois. */
export function monthView(data: FinanceData, month: string, today: string): MonthView {
  const totals = monthTotals(data.transactions, month)
  const upcoming =
    month === monthOf(today)
      ? upcomingThisMonth(data.rules, data.generatedByRule, today)
      : { incomeCents: 0, expenseCents: 0 }
  return {
    totals,
    upcoming,
    remainingCents: remainingToLive(totals, upcoming),
    budgets: budgetRows(data, month),
  }
}

// ---------- Comptes ----------

/** Mouvement net des transactions d'un compte (revenus − dépenses). */
export function accountMovement(accountId: string, transactions: Transaction[]): number {
  let movement = 0
  for (const transaction of transactions) {
    if (transaction.accountId !== accountId) continue
    movement += transaction.type === 'income' ? transaction.amountCents : -transaction.amountCents
  }
  return movement
}

export function accountBalance(account: Account, transactions: Transaction[]): number {
  return account.openingBalanceCents + accountMovement(account.id, transactions)
}

/** Solde de départ à enregistrer pour que le solde actuel affiche `targetCents`. */
export function openingForBalance(targetCents: number, accountId: string, transactions: Transaction[]): number {
  return targetCents - accountMovement(accountId, transactions)
}

// ---------- Graphiques ----------

export interface MonthPoint extends MonthTotals {
  month: string
}

/** Totaux mois par mois, pour le graphique d'évolution. */
export function monthlySeries(transactions: Transaction[], months: string[]): MonthPoint[] {
  return months.map((month) => ({ month, ...monthTotals(transactions, month) }))
}

// ---------- Tirelires ----------

/**
 * Montant à mettre de côté chaque mois pour atteindre l'objectif à temps.
 * `null` si la tirelire n'a pas de date ; 0 si l'objectif est déjà atteint.
 */
export function monthlySavingNeeded(
  goal: Pick<SavingsGoal, 'targetCents' | 'savedCents' | 'targetDate'>,
  today: string,
): number | null {
  const remaining = goal.targetCents - goal.savedCents
  if (remaining <= 0) return 0
  if (!goal.targetDate) return null
  const [y1, m1] = monthOf(today).split('-').map(Number)
  const [y2, m2] = monthOf(goal.targetDate).split('-').map(Number)
  const months = Math.max(1, (y2 - y1) * 12 + (m2 - m1))
  return Math.ceil(remaining / months)
}
