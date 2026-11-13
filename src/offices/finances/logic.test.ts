import { describe, expect, it } from 'vitest'
import {
  accountBalance,
  budgetLevel,
  budgetRows,
  defaultStartMonth,
  dueOccurrences,
  isMine,
  monthTotals,
  monthView,
  monthlySavingNeeded,
  monthlySeries,
  openingForBalance,
  percent,
  recurringDate,
  remainingToLive,
  spentByCategory,
  upcomingThisMonth,
  type FinanceData,
} from './logic'
import type { Account, Category, RecurringRule, Transaction } from './types'

const base = { createdAt: '', updatedAt: '', deletedAt: null, owner: 'me', visibility: 'private' as const }

function tx(partial: Partial<Transaction>): Transaction {
  return {
    ...base,
    id: Math.random().toString(36).slice(2),
    type: 'expense',
    amountCents: 1000,
    categoryId: 'food',
    accountId: 'main',
    date: '2026-11-10',
    note: '',
    tripId: null,
    paidBy: null,
    splitBetween: null,
    recurringId: null,
    recurringMonth: null,
    ...partial,
  }
}

function rule(partial: Partial<RecurringRule>): RecurringRule {
  return {
    ...base,
    id: 'rent',
    name: 'Loyer',
    type: 'expense',
    amountCents: 120000,
    categoryId: 'home',
    accountId: 'main',
    dayOfMonth: 1,
    startMonth: '2026-09',
    active: true,
    ...partial,
  }
}

const category = (id: string, order: number): Category => ({
  ...base,
  id,
  name: id,
  icon: '🏷️',
  color: '#000000',
  kind: 'expense',
  order,
  systemKey: null,
})

describe('totaux du mois', () => {
  const transactions = [
    tx({ amountCents: 5000 }),
    tx({ amountCents: 2500, categoryId: 'transport' }),
    tx({ type: 'income', amountCents: 400000, categoryId: 'salary' }),
    tx({ amountCents: 9900, date: '2026-10-31' }),
  ]

  it('additionne revenus et dépenses du mois demandé uniquement', () => {
    expect(monthTotals(transactions, '2026-11')).toEqual({ incomeCents: 400000, expenseCents: 7500 })
    expect(monthTotals(transactions, '2026-10')).toEqual({ incomeCents: 0, expenseCents: 9900 })
  })

  it('répartit les dépenses par catégorie, sans les revenus', () => {
    const spent = spentByCategory(transactions, '2026-11')
    expect(spent.get('food')).toBe(5000)
    expect(spent.get('transport')).toBe(2500)
    expect(spent.has('salary')).toBe(false)
  })

  it('produit une série mois par mois pour le graphique', () => {
    expect(monthlySeries(transactions, ['2026-10', '2026-11']).map((p) => p.expenseCents)).toEqual([9900, 7500])
  })
})

describe('budgetLevel', () => {
  it('reste vert sous 80 % du budget', () => {
    expect(budgetLevel(7900, 10000)).toBe('ok')
  })
  it('passe à l\'orange à partir de 80 %', () => {
    expect(budgetLevel(8000, 10000)).toBe('warning')
    expect(budgetLevel(10000, 10000)).toBe('warning')
  })
  it('passe au rouge dès que le budget est dépassé', () => {
    expect(budgetLevel(10001, 10000)).toBe('over')
  })
  it('gère un budget à zéro', () => {
    expect(budgetLevel(0, 0)).toBe('ok')
    expect(budgetLevel(1, 0)).toBe('over')
  })
})

describe('percent', () => {
  it('borne le résultat entre 0 et 100', () => {
    expect(percent(50, 200)).toBe(25)
    expect(percent(300, 200)).toBe(100)
    expect(percent(10, 0)).toBe(0)
  })
})

describe('récurrents', () => {
  it('ramène le jour au dernier jour des mois courts', () => {
    expect(recurringDate({ dayOfMonth: 31 }, '2026-02')).toBe('2026-02-28')
    expect(recurringDate({ dayOfMonth: 31 }, '2026-04')).toBe('2026-04-30')
    expect(recurringDate({ dayOfMonth: 5 }, '2026-11')).toBe('2026-11-05')
  })

  it('ne rattrape jamais le passé à la création', () => {
    // Le 13, un loyer « le 1er » démarre le mois suivant ; un abonnement « le 20 » démarre ce mois-ci.
    expect(defaultStartMonth(1, '2026-11-13')).toBe('2026-12')
    expect(defaultStartMonth(20, '2026-11-13')).toBe('2026-11')
    expect(defaultStartMonth(13, '2026-11-13')).toBe('2026-11')
    expect(defaultStartMonth(1, '2026-12-13')).toBe('2027-01')
  })

  it('liste les échéances arrivées à terme et pas encore créées', () => {
    const due = dueOccurrences(rule({}), new Set(['2026-09']), '2026-11-13')
    expect(due).toEqual([
      { month: '2026-10', date: '2026-10-01' },
      { month: '2026-11', date: '2026-11-01' },
    ])
  })

  it('attend le jour de l\'échéance', () => {
    expect(dueOccurrences(rule({ dayOfMonth: 20, startMonth: '2026-11' }), new Set(), '2026-11-13')).toEqual([])
    expect(dueOccurrences(rule({ dayOfMonth: 20, startMonth: '2026-11' }), new Set(), '2026-11-20')).toHaveLength(1)
  })

  it('ignore les règles en pause et ne recrée rien deux fois', () => {
    expect(dueOccurrences(rule({ active: false }), new Set(), '2026-11-13')).toEqual([])
    expect(dueOccurrences(rule({}), new Set(['2026-09', '2026-10', '2026-11']), '2026-11-13')).toEqual([])
  })

  it('limite le rattrapage à 12 mois', () => {
    expect(dueOccurrences(rule({ startMonth: '2020-01' }), new Set(), '2026-11-13')).toHaveLength(12)
  })

  it('compte ce qui reste à venir ce mois-ci', () => {
    const rules = [
      rule({ id: 'rent', dayOfMonth: 1 }), // déjà passé
      rule({ id: 'phone', dayOfMonth: 25, amountCents: 3900 }),
      rule({ id: 'salary', type: 'income', dayOfMonth: 25, amountCents: 450000 }),
      rule({ id: 'gym', dayOfMonth: 28, amountCents: 6000, active: false }),
    ]
    expect(upcomingThisMonth(rules, new Map(), '2026-11-13')).toEqual({ incomeCents: 450000, expenseCents: 3900 })
  })
})

describe('reste à vivre', () => {
  it('compte les revenus, les dépenses et les récurrents à venir', () => {
    expect(
      remainingToLive({ incomeCents: 400000, expenseCents: 150000 }, { incomeCents: 0, expenseCents: 50000 }),
    ).toBe(200000)
  })

  it('peut être négatif', () => {
    expect(remainingToLive({ incomeCents: 1000, expenseCents: 5000 }, { incomeCents: 0, expenseCents: 0 })).toBe(-4000)
  })
})

describe('comptes', () => {
  const account: Account = { ...base, id: 'main', name: 'Courant', kind: 'checking', openingBalanceCents: 100000 }
  const transactions = [
    tx({ amountCents: 2500 }),
    tx({ type: 'income', amountCents: 10000 }),
    tx({ amountCents: 9999, accountId: 'other' }),
  ]

  it('calcule le solde à partir du solde de départ et des mouvements du compte', () => {
    expect(accountBalance(account, transactions)).toBe(107500)
  })

  it('retrouve le solde de départ pour afficher un solde saisi à la main', () => {
    const opening = openingForBalance(250000, 'main', transactions)
    expect(accountBalance({ ...account, openingBalanceCents: opening }, transactions)).toBe(250000)
  })
})

describe('vue du mois', () => {
  const data: FinanceData = {
    accounts: [],
    categories: [category('food', 0), category('transport', 1)],
    budgets: [{ ...base, id: 'b1', categoryId: 'food', amountCents: 10000 }],
    rules: [rule({ id: 'phone', dayOfMonth: 25, amountCents: 3900 })],
    goals: [],
    transactions: [tx({ amountCents: 12000 }), tx({ type: 'income', amountCents: 100000, categoryId: 'salary' })],
    generatedByRule: new Map(),
  }

  it('signale un budget dépassé et laisse sans alerte une catégorie sans budget', () => {
    const rows = budgetRows(data, '2026-11')
    expect(rows[0]).toMatchObject({ spentCents: 12000, budgetCents: 10000, level: 'over' })
    expect(rows[1]).toMatchObject({ spentCents: 0, budgetCents: null, level: 'ok' })
  })

  it('n\'anticipe les récurrents que pour le mois en cours', () => {
    expect(monthView(data, '2026-11', '2026-11-13').remainingCents).toBe(100000 - 12000 - 3900)
    expect(monthView(data, '2026-10', '2026-11-13').upcoming).toEqual({ incomeCents: 0, expenseCents: 0 })
  })
})

describe('dépenses de voyage', () => {
  it('ne compte dans mes finances que ce que j\'ai payé', () => {
    expect(isMine({ paidBy: null })).toBe(true)
    expect(isMine({ paidBy: 'me' })).toBe(true)
    expect(isMine({ paidBy: 'Léa' })).toBe(false)
  })
})

describe('tirelires', () => {
  it('calcule le versement mensuel nécessaire', () => {
    expect(monthlySavingNeeded({ targetCents: 120000, savedCents: 0, targetDate: '2027-05-01' }, '2026-11-13')).toBe(20000)
  })
  it('renvoie 0 quand l\'objectif est atteint et null sans date', () => {
    expect(monthlySavingNeeded({ targetCents: 1000, savedCents: 1000, targetDate: '2027-05-01' }, '2026-11-13')).toBe(0)
    expect(monthlySavingNeeded({ targetCents: 1000, savedCents: 0, targetDate: null }, '2026-11-13')).toBeNull()
  })
  it('demande tout d\'un coup si la date est déjà là', () => {
    expect(monthlySavingNeeded({ targetCents: 5000, savedCents: 0, targetDate: '2026-11-30' }, '2026-11-13')).toBe(5000)
  })
})
