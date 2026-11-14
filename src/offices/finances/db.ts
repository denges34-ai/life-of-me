import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../core/db/db'
import { alive, createIn, removeIn, updateIn } from '../../core/db/repo'
import type { EntityData } from '../../core/db/entity'
import { emitEvent } from '../../core/events'
import { defaultStartMonth, dueOccurrences, isMine, openingForBalance, type FinanceData } from './logic'
import { CATEGORY_COLORS, OTHER_COLOR } from './palette'
import type { Account, Category, RecurringRule, SavingsGoal, Transaction, TransactionType } from './types'

// Lectures et écritures du bureau Finances.

// ---------- Lecture ----------

/** Ordre d'affichage des comptes : le compte courant d'abord (c'est aussi le compte proposé par défaut). */
const ACCOUNT_KIND_ORDER: Account['kind'][] = ['checking', 'savings', 'cash']

export async function loadFinanceData(): Promise<FinanceData> {
  const [accounts, categories, budgets, rules, goals, transactions] = await Promise.all([
    db.accounts.toArray(),
    db.categories.orderBy('order').toArray(),
    db.budgets.toArray(),
    db.recurringRules.toArray(),
    db.savingsGoals.toArray(),
    db.transactions.toArray(),
  ])

  // Les lignes supprimées comptent ici : une échéance effacée à la main ne doit pas revenir.
  const generatedByRule = new Map<string, Set<string>>()
  for (const transaction of transactions) {
    if (!transaction.recurringId || !transaction.recurringMonth) continue
    const months = generatedByRule.get(transaction.recurringId) ?? new Set<string>()
    months.add(transaction.recurringMonth)
    generatedByRule.set(transaction.recurringId, months)
  }

  return {
    accounts: alive(accounts).sort(
      (a, b) => ACCOUNT_KIND_ORDER.indexOf(a.kind) - ACCOUNT_KIND_ORDER.indexOf(b.kind) || a.createdAt.localeCompare(b.createdAt),
    ),
    categories: alive(categories),
    budgets: alive(budgets),
    rules: alive(rules),
    goals: alive(goals),
    transactions: alive(transactions)
      .filter(isMine)
      .sort((a, b) => (a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date))),
    generatedByRule,
  }
}

/** Données du bureau, rechargées automatiquement à chaque changement. */
export function useFinanceData(): FinanceData | undefined {
  return useLiveQuery(loadFinanceData, [])
}

// ---------- Valeurs par défaut ----------

const DEFAULT_EXPENSE_CATEGORIES: { name: string; icon: string; systemKey: Category['systemKey'] }[] = [
  { name: 'Logement', icon: '🏠', systemKey: null },
  { name: 'Nourriture', icon: '🛒', systemKey: null },
  { name: 'Transport', icon: '🚆', systemKey: null },
  { name: 'Sorties', icon: '🍻', systemKey: null },
  { name: 'Sport', icon: '🏋️', systemKey: null },
  { name: 'Abonnements', icon: '📱', systemKey: null },
  { name: 'Voyages', icon: '✈️', systemKey: 'travel' },
  { name: 'Cadeaux', icon: '🎁', systemKey: null },
  { name: 'Autre', icon: '📦', systemKey: 'other' },
]

const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salaire', icon: '💼' },
  { name: 'Autre revenu', icon: '💵' },
]

const DEFAULT_ACCOUNTS: { name: string; kind: Account['kind'] }[] = [
  { name: 'Compte courant', kind: 'checking' },
  { name: 'Épargne', kind: 'savings' },
  { name: 'Cash', kind: 'cash' },
]

/** Crée les catégories et comptes de départ si le bureau est vide. Sans effet sinon. */
export async function ensureFinanceDefaults(): Promise<void> {
  await db.transaction('rw', db.categories, db.accounts, db.settings, async () => {
    if ((await db.categories.count()) > 0) return

    let order = 0
    for (const [index, category] of DEFAULT_EXPENSE_CATEGORIES.entries()) {
      await createIn(db.categories, {
        ...category,
        kind: 'expense',
        color: CATEGORY_COLORS[index] ?? OTHER_COLOR,
        order: order++,
      })
    }
    for (const category of DEFAULT_INCOME_CATEGORIES) {
      await createIn(db.categories, { ...category, kind: 'income', color: OTHER_COLOR, order: order++, systemKey: null })
    }
    for (const account of DEFAULT_ACCOUNTS) {
      await createIn(db.accounts, { ...account, openingBalanceCents: 0 })
    }
  })
}

/** Identifiant de la catégorie « Voyages » (dépenses rattachées à un voyage). */
export async function getTravelCategoryId(): Promise<string | null> {
  const categories = alive(await db.categories.toArray())
  return categories.find((category) => category.systemKey === 'travel')?.id ?? null
}

// ---------- Mouvements ----------

export interface TransactionInput {
  type: TransactionType
  amountCents: number
  categoryId: string | null
  accountId: string | null
  date: string
  note: string
  tripId?: string | null
  paidBy?: string | null
  splitBetween?: string[] | null
}

export async function addTransaction(input: TransactionInput): Promise<Transaction> {
  const transaction = await createIn(
    db.transactions,
    {
      ...input,
      tripId: input.tripId ?? null,
      paidBy: input.paidBy ?? null,
      splitBetween: input.splitBetween ?? null,
      recurringId: null,
      recurringMonth: null,
    },
    // Les dépenses de voyage seront partagées avec l'associée ; le reste est privé.
    input.tripId ? 'shared' : 'private',
  )
  emitEvent('transaction.added')
  return transaction
}

export const updateTransaction = (id: string, changes: Partial<TransactionInput>) =>
  updateIn(db.transactions, id, changes)

export const deleteTransaction = (id: string) => removeIn(db.transactions, id)

// ---------- Récurrents ----------

export type RuleInput = Omit<EntityData<RecurringRule>, 'startMonth'>

export async function saveRule(input: RuleInput, today: string, id?: string): Promise<void> {
  if (id) await updateIn(db.recurringRules, id, input)
  else await createIn(db.recurringRules, { ...input, startMonth: defaultStartMonth(input.dayOfMonth, today) })
}

export const deleteRule = (id: string) => removeIn(db.recurringRules, id)

/** Crée les mouvements des récurrents arrivés à échéance. À appeler à l'ouverture de l'appli. */
export async function generateRecurring(today: string): Promise<number> {
  let created = 0
  await db.transaction('rw', db.recurringRules, db.transactions, db.settings, async () => {
    const rules = alive(await db.recurringRules.toArray())
    for (const rule of rules) {
      const existing = await db.transactions.where('recurringId').equals(rule.id).toArray()
      const generated = new Set(existing.map((transaction) => transaction.recurringMonth ?? ''))
      for (const occurrence of dueOccurrences(rule, generated, today)) {
        await createIn(db.transactions, {
          type: rule.type,
          amountCents: rule.amountCents,
          categoryId: rule.categoryId,
          accountId: rule.accountId,
          date: occurrence.date,
          note: rule.name,
          tripId: null,
          paidBy: null,
          splitBetween: null,
          recurringId: rule.id,
          recurringMonth: occurrence.month,
        })
        created++
      }
    }
  })
  return created
}

// ---------- Comptes ----------

export async function saveAccount(
  input: { name: string; kind: Account['kind']; balanceCents: number },
  transactions: Transaction[],
  id?: string,
): Promise<void> {
  if (id) {
    await updateIn(db.accounts, id, {
      name: input.name,
      kind: input.kind,
      // Le solde saisi à la main fait foi : on ajuste le solde de départ en conséquence.
      openingBalanceCents: openingForBalance(input.balanceCents, id, transactions),
    })
  } else {
    await createIn(db.accounts, { name: input.name, kind: input.kind, openingBalanceCents: input.balanceCents })
  }
}

export const deleteAccount = (id: string) => removeIn(db.accounts, id)

// ---------- Catégories et budgets ----------

export async function saveCategory(
  input: { name: string; icon: string; kind: TransactionType },
  existing: Category[],
  id?: string,
): Promise<string> {
  if (id) {
    await updateIn(db.categories, id, { name: input.name, icon: input.icon })
    return id
  }
  // Première couleur de la palette encore libre ; sinon gris (regroupée dans « Autres »).
  const used = new Set(existing.filter((c) => c.kind === 'expense').map((c) => c.color))
  const color = input.kind === 'expense' ? (CATEGORY_COLORS.find((c) => !used.has(c)) ?? OTHER_COLOR) : OTHER_COLOR
  const order = Math.max(-1, ...existing.map((c) => c.order)) + 1
  const category = await createIn(db.categories, { ...input, color, order, systemKey: null })
  return category.id
}

export const deleteCategory = (id: string) => removeIn(db.categories, id)

/** Définit le budget mensuel d'une catégorie. `null` ou 0 = plus de budget. */
export async function setBudget(categoryId: string, amountCents: number | null): Promise<void> {
  await db.transaction('rw', db.budgets, db.settings, async () => {
    const current = alive(await db.budgets.where('categoryId').equals(categoryId).toArray())[0]
    if (!amountCents) {
      if (current) await removeIn(db.budgets, current.id)
    } else if (current) {
      await updateIn(db.budgets, current.id, { amountCents })
    } else {
      await createIn(db.budgets, { categoryId, amountCents })
    }
  })
}

// ---------- Tirelires ----------

export async function saveGoal(input: EntityData<SavingsGoal>, id?: string): Promise<void> {
  if (id) await updateIn(db.savingsGoals, id, input)
  else await createIn(db.savingsGoals, input)
}

/** Ajoute (ou retire, si négatif) de l'argent dans une tirelire. Jamais en dessous de zéro. */
export async function contributeToGoal(goal: SavingsGoal, deltaCents: number): Promise<void> {
  await updateIn(db.savingsGoals, goal.id, { savedCents: Math.max(0, goal.savedCents + deltaCents) })
  if (deltaCents > 0) emitEvent('savings.contributed')
}

export const deleteGoal = (id: string) => removeIn(db.savingsGoals, id)
