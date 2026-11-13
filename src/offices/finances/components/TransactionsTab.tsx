import { formatDayLong, monthOf } from '../../../core/dates'
import type { CurrencyCode } from '../../../core/db/types'
import { formatMoney } from '../../../core/format'
import { Card, EmptyState, ListRow } from '../../../shared/ui/bits'
import type { FinanceData } from '../logic'
import type { Transaction } from '../types'

interface Props {
  data: FinanceData
  month: string
  currency: CurrencyCode
  onEdit: (transaction: Transaction) => void
}

/** Liste des mouvements du mois, regroupés par jour (les plus récents en haut). */
export function TransactionsTab({ data, month, currency, onEdit }: Props) {
  const transactions = data.transactions.filter((transaction) => monthOf(transaction.date) === month)
  if (transactions.length === 0) {
    return <EmptyState icon="🧾" title="Aucun mouvement ce mois-ci" hint="Touche le bouton + pour noter une dépense ou un revenu." />
  }

  // Les mouvements sont déjà triés par date décroissante : on les regroupe par jour.
  const days: { date: string; items: Transaction[] }[] = []
  for (const transaction of transactions) {
    const last = days[days.length - 1]
    if (last && last.date === transaction.date) last.items.push(transaction)
    else days.push({ date: transaction.date, items: [transaction] })
  }

  return (
    <>
      {days.map((day) => (
        <Card key={day.date} className="!p-3">
          <h3 className="px-1 pb-1 text-xs font-bold uppercase tracking-wide text-muted">{formatDayLong(day.date)}</h3>
          {day.items.map((transaction) => {
            const category = data.categories.find((c) => c.id === transaction.categoryId)
            const account = data.accounts.find((a) => a.id === transaction.accountId)
            const income = transaction.type === 'income'
            return (
              <ListRow
                key={transaction.id}
                icon={category?.icon ?? '❔'}
                title={transaction.note || category?.name || 'Sans catégorie'}
                subtitle={[transaction.note ? category?.name : null, account?.name, transaction.recurringId ? '🔁 récurrent' : null]
                  .filter(Boolean)
                  .join(' · ')}
                value={`${income ? '+' : '−'} ${formatMoney(transaction.amountCents, currency)}`}
                valueClassName={income ? 'text-emerald-700' : ''}
                onClick={() => onEdit(transaction)}
              />
            )
          })}
        </Card>
      ))}
    </>
  )
}
