import { monthOf } from '../../core/dates'
import { formatMoneyRounded } from '../../core/format'
import type { OfficeSummary, SummaryContext } from '../../core/offices/types'
import { loadFinanceData } from './db'
import { monthView } from './logic'

/** Ce que le bureau Finances raconte à l'open space et à la Salle du PDG. */
export async function getFinancesSummary({ today, currency }: SummaryContext): Promise<OfficeSummary> {
  const data = await loadFinanceData()
  const view = monthView(data, monthOf(today), today)
  const money = (cents: number) => formatMoneyRounded(cents, currency)

  const over = view.budgets.filter((row) => row.budgetCents !== null && row.level === 'over')
  const warning = view.budgets.filter((row) => row.budgetCents !== null && row.level === 'warning')
  const hasActivity = data.transactions.length > 0

  const briefing: string[] = []
  if (hasActivity) briefing.push(`Reste à vivre ce mois-ci : ${money(view.remainingCents)}`)
  else briefing.push('Note ta première dépense pour suivre ton mois.')
  for (const row of over) briefing.push(`Budget ${row.category.name} dépassé`)
  for (const row of warning) briefing.push(`Budget ${row.category.name} bientôt atteint`)

  return {
    state: over.length > 0 ? 'alert' : warning.length > 0 ? 'busy' : 'ok',
    badge: over.length > 0 ? String(over.length) : null,
    deskLabel: hasActivity ? money(view.remainingCents) : null,
    keyFigures: [
      { label: 'Reste à vivre', value: money(view.remainingCents) },
      { label: 'Dépenses du mois', value: money(view.totals.expenseCents) },
      { label: 'Tirelires', value: money(data.goals.reduce((sum, goal) => sum + goal.savedCents, 0)) },
    ],
    briefing,
  }
}
