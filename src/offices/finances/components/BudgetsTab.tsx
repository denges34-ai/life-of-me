import { useState, type FormEvent } from 'react'
import type { CurrencyCode } from '../../../core/db/types'
import { centsToInput, formatMoney, parseMoney } from '../../../core/format'
import { Button } from '../../../shared/ui/Button'
import { Card, ProgressBar, SectionTitle, TextButton } from '../../../shared/ui/bits'
import { MoneyField, TextField } from '../../../shared/ui/Field'
import { Sheet } from '../../../shared/ui/Sheet'
import { deleteCategory, saveCategory, setBudget } from '../db'
import type { BudgetRow, FinanceData, MonthView } from '../logic'
import { STATUS_COLORS } from '../palette'
import type { Category, TransactionType } from '../types'

interface Props {
  data: FinanceData
  view: MonthView
  currency: CurrencyCode
  color: string
}

type Editing = { category?: Category; kind: TransactionType } | null

/** État d'un budget, en toutes lettres (jamais la couleur seule). */
function levelLabel(row: BudgetRow, currency: CurrencyCode): string {
  if (row.budgetCents === null) return 'Pas de budget défini'
  if (row.level === 'over') return `⛔ Dépassé de ${formatMoney(row.spentCents - row.budgetCents, currency)}`
  if (row.level === 'warning') return `⚠️ Bientôt atteint · reste ${formatMoney(row.budgetCents - row.spentCents, currency)}`
  return `✓ Reste ${formatMoney(row.budgetCents - row.spentCents, currency)}`
}

export function BudgetsTab({ data, view, currency, color }: Props) {
  const [editing, setEditing] = useState<Editing>(null)
  const incomeCategories = data.categories.filter((category) => category.kind === 'income')

  return (
    <>
      <SectionTitle action={<TextButton color={color} onClick={() => setEditing({ kind: 'expense' })}>+ Catégorie</TextButton>}>
        Budgets du mois
      </SectionTitle>

      {view.budgets.map((row) => (
        <button
          key={row.category.id}
          type="button"
          onClick={() => setEditing({ category: row.category, kind: 'expense' })}
          className="rounded-3xl bg-white p-4 text-left shadow-sm ring-1 ring-black/5 active:bg-black/5"
        >
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate font-bold">
              <span className="mr-2">{row.category.icon}</span>
              {row.category.name}
            </span>
            <span className="shrink-0 text-sm font-semibold tabular-nums">
              {formatMoney(row.spentCents, currency)}
              {row.budgetCents !== null && <span className="text-muted"> / {formatMoney(row.budgetCents, currency)}</span>}
            </span>
          </div>
          {row.budgetCents !== null && (
            <div className="mt-2">
              <ProgressBar percent={(row.spentCents / Math.max(1, row.budgetCents)) * 100} color={STATUS_COLORS[row.level]} />
            </div>
          )}
          <p className="mt-1.5 text-xs text-muted">{levelLabel(row, currency)}</p>
        </button>
      ))}

      <SectionTitle action={<TextButton color={color} onClick={() => setEditing({ kind: 'income' })}>+ Catégorie</TextButton>}>
        Catégories de revenus
      </SectionTitle>
      <Card className="!p-2">
        {incomeCategories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setEditing({ category, kind: 'income' })}
            className="flex min-h-12 w-full items-center gap-3 rounded-2xl px-2 text-left font-semibold active:bg-black/5"
          >
            <span className="text-xl">{category.icon}</span>
            {category.name}
          </button>
        ))}
      </Card>

      {editing && (
        <CategorySheet
          data={data}
          category={editing.category}
          kind={editing.kind}
          currency={currency}
          color={color}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}

interface SheetProps {
  data: FinanceData
  category?: Category
  kind: TransactionType
  currency: CurrencyCode
  color: string
  onClose: () => void
}

/** Création / modification d'une catégorie et de son budget mensuel. */
function CategorySheet({ data, category, kind, currency, color, onClose }: SheetProps) {
  const currentBudget = category ? data.budgets.find((budget) => budget.categoryId === category.id) : undefined
  const [name, setName] = useState(category?.name ?? '')
  const [icon, setIcon] = useState(category?.icon ?? (kind === 'expense' ? '🏷️' : '💵'))
  const [budget, setBudgetText] = useState(currentBudget ? centsToInput(currentBudget.amountCents) : '')

  const budgetCents = budget.trim() === '' ? 0 : parseMoney(budget)
  const valid = name.trim().length > 0 && budgetCents !== null

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!valid) return
    const id = await saveCategory({ name: name.trim(), icon: icon.trim() || '🏷️', kind }, data.categories, category?.id)
    if (kind === 'expense') await setBudget(id, budgetCents)
    onClose()
  }

  async function handleDelete() {
    if (!category) return
    if (!window.confirm(`Supprimer la catégorie « ${category.name} » ? Les mouvements déjà notés sont conservés.`)) return
    await setBudget(category.id, null)
    await deleteCategory(category.id)
    onClose()
  }

  return (
    <Sheet title={category ? 'Modifier la catégorie' : 'Nouvelle catégorie'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 pb-2">
        <div className="grid grid-cols-[5rem_1fr] gap-3">
          <TextField label="Icône" value={icon} onChange={setIcon} maxLength={4} className="text-center text-2xl" />
          <TextField label="Nom" value={name} onChange={setName} maxLength={30} placeholder="Ex. Animaux" autoFocus={!category} required />
        </div>
        {kind === 'expense' && (
          <MoneyField label="Budget mensuel (vide = pas de budget)" value={budget} onChange={setBudgetText} currency={currency} />
        )}
        <div className="mt-1 flex gap-3">
          {/* Les catégories utilisées par l'appli elle-même ne se suppriment pas. */}
          {category && !category.systemKey && (
            <Button variant="danger" onClick={() => void handleDelete()}>
              Supprimer
            </Button>
          )}
          <Button type="submit" className="flex-1" disabled={!valid} style={{ backgroundColor: color }}>
            Enregistrer
          </Button>
        </div>
      </form>
    </Sheet>
  )
}
