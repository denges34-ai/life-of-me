import { useState } from 'react'
import { useSettings } from '../../core/company'
import { monthOf } from '../../core/dates'
import { formatMoneyRounded, toISODate } from '../../core/format'
import { OfficeLayout, type TabDef } from '../../shared/ui/OfficeLayout'
import { AccountsTab } from './components/AccountsTab'
import { BudgetsTab } from './components/BudgetsTab'
import { GoalsTab } from './components/GoalsTab'
import { MonthSwitcher } from './components/MonthSwitcher'
import { OverviewTab } from './components/OverviewTab'
import { TransactionSheet } from './components/TransactionSheet'
import { TransactionsTab } from './components/TransactionsTab'
import { useFinanceData } from './db'
import { monthView } from './logic'
import { useFinanceStore, type FinanceTab } from './store'
import type { Transaction } from './types'

// Couleur et icône répétées ici pour éviter un import circulaire avec index.ts.
const COLOR = '#1f9d6b'

const TABS: TabDef<FinanceTab>[] = [
  { id: 'apercu', label: 'Aperçu' },
  { id: 'mouvements', label: 'Mouvements' },
  { id: 'budgets', label: 'Budgets' },
  { id: 'comptes', label: 'Comptes' },
  { id: 'objectifs', label: 'Objectifs' },
]

/** Écran du bureau Finances. */
export default function FinancesScreen() {
  const data = useFinanceData()
  const currency = useSettings()?.currency ?? 'CHF'
  const { tab, setTab, month, setMonth } = useFinanceStore()
  // `undefined` = feuille fermée ; `null` = nouvel ajout ; sinon mouvement à modifier.
  const [editing, setEditing] = useState<Transaction | null | undefined>(undefined)

  if (!data) return null

  const today = toISODate()
  const view = monthView(data, month, today)
  const isCurrentMonth = month === monthOf(today)
  const money = (cents: number) => formatMoneyRounded(cents, currency)
  const showsMonth = tab === 'apercu' || tab === 'mouvements' || tab === 'budgets'

  return (
    <>
      <OfficeLayout
        color={COLOR}
        icon="💰"
        title="Finances"
        figures={[
          { label: isCurrentMonth ? 'Reste à vivre' : 'Solde du mois', value: money(view.remainingCents) },
          { label: 'Dépenses', value: money(view.totals.expenseCents) },
          { label: 'Revenus', value: money(view.totals.incomeCents) },
        ]}
        tabs={TABS}
        activeTab={tab}
        onTabChange={setTab}
        onAdd={() => setEditing(null)}
        addLabel="Ajouter une dépense ou un revenu"
      >
        {showsMonth && <MonthSwitcher month={month} onChange={setMonth} />}
        {tab === 'apercu' && <OverviewTab data={data} view={view} month={month} today={today} currency={currency} />}
        {tab === 'mouvements' && <TransactionsTab data={data} month={month} currency={currency} onEdit={setEditing} />}
        {tab === 'budgets' && <BudgetsTab data={data} view={view} currency={currency} color={COLOR} />}
        {tab === 'comptes' && <AccountsTab data={data} currency={currency} today={today} color={COLOR} />}
        {tab === 'objectifs' && <GoalsTab data={data} currency={currency} today={today} color={COLOR} />}
      </OfficeLayout>

      {editing !== undefined && (
        <TransactionSheet
          data={data}
          currency={currency}
          transaction={editing ?? undefined}
          color={COLOR}
          onClose={() => setEditing(undefined)}
        />
      )}
    </>
  )
}
