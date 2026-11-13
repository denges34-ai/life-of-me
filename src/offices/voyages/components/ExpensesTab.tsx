import { useState, type FormEvent } from 'react'
import { ME, type CurrencyCode } from '../../../core/db/types'
import { centsToInput, formatDate, formatMoney, parseMoney, toISODate } from '../../../core/format'
import { Button } from '../../../shared/ui/Button'
import { Card, EmptyState, ListRow, ProgressBar, SectionTitle } from '../../../shared/ui/bits'
import { ChoiceChips, MoneyField, MultiChoiceChips, TextField } from '../../../shared/ui/Field'
import { Sheet } from '../../../shared/ui/Sheet'
import { deleteTransaction } from '../../finances/db'
import type { Transaction } from '../../finances/types'
import { saveTripExpense, type TripBundle } from '../db'
import { computeBalances, participantName, settle } from '../logic'

interface Props {
  bundle: TripBundle
  currency: CurrencyCode
  myName: string
  color: string
  onEdit: (expense: Transaction) => void
}

/** Dépenses du voyage et « qui doit quoi ». */
export function ExpensesTab({ bundle, currency, myName, color, onEdit }: Props) {
  const { trip, expenses } = bundle
  const total = expenses.reduce((sum, expense) => sum + expense.amountCents, 0)
  const over = trip.budgetCents > 0 && total > trip.budgetCents
  const name = (participant: string) => participantName(participant, myName)

  const transfers = settle(
    computeBalances(
      expenses.map((expense) => ({
        amountCents: expense.amountCents,
        paidBy: expense.paidBy ?? ME,
        splitBetween: expense.splitBetween ?? [],
      })),
      trip.participants,
    ),
  )

  return (
    <>
      <Card>
        <p className="text-sm font-semibold text-muted">Dépensé</p>
        <p className="mt-1 text-3xl font-extrabold tabular-nums">
          {formatMoney(total, currency)}
          {trip.budgetCents > 0 && <span className="text-base font-semibold text-muted"> / {formatMoney(trip.budgetCents, currency)}</span>}
        </p>
        {trip.budgetCents > 0 && (
          <>
            <div className="mt-2">
              <ProgressBar percent={(total / trip.budgetCents) * 100} color={over ? '#d03b3b' : color} />
            </div>
            <p className="mt-1.5 text-xs text-muted">
              {over ? `⛔ Dépassé de ${formatMoney(total - trip.budgetCents, currency)}` : `✓ Reste ${formatMoney(trip.budgetCents - total, currency)}`}
            </p>
          </>
        )}
      </Card>

      {trip.participants.length > 1 && expenses.length > 0 && (
        <Card>
          <h2 className="font-bold">🤝 Qui doit quoi</h2>
          {transfers.length === 0 ? (
            <p className="mt-1 text-sm text-muted">Tout le monde est quitte. 🎉</p>
          ) : (
            <ul className="mt-2 grid gap-2">
              {transfers.map((transfer) => (
                <li key={`${transfer.from}-${transfer.to}`} className="flex items-center justify-between gap-3 text-sm">
                  <span>
                    <strong>{name(transfer.from)}</strong> doit à <strong>{name(transfer.to)}</strong>
                  </span>
                  <span className="font-bold tabular-nums">{formatMoney(transfer.amountCents, currency)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <SectionTitle>Dépenses</SectionTitle>
      {expenses.length === 0 ? (
        <EmptyState icon="💸" title="Aucune dépense" hint="Touche le bouton + pour noter une dépense du voyage. Celles que tu paies comptent aussi dans tes finances." />
      ) : (
        <Card className="!p-2">
          {expenses.map((expense) => (
            <ListRow
              key={expense.id}
              icon="💸"
              title={expense.note || 'Dépense'}
              subtitle={`${formatDate(expense.date)} · payé par ${name(expense.paidBy ?? ME)}`}
              value={formatMoney(expense.amountCents, currency)}
              onClick={() => onEdit(expense)}
            />
          ))}
        </Card>
      )}
    </>
  )
}

interface SheetProps {
  bundle: TripBundle
  expense?: Transaction
  currency: CurrencyCode
  myName: string
  color: string
  onClose: () => void
}

export function ExpenseSheet({ bundle, expense, currency, myName, color, onClose }: SheetProps) {
  const { trip } = bundle
  const [amount, setAmount] = useState(expense ? centsToInput(expense.amountCents) : '')
  const [note, setNote] = useState(expense?.note ?? '')
  const [date, setDate] = useState(expense?.date ?? toISODate())
  const [paidBy, setPaidBy] = useState<string>(expense?.paidBy ?? ME)
  const [splitBetween, setSplitBetween] = useState<string[]>(
    expense?.splitBetween && expense.splitBetween.length > 0 ? expense.splitBetween : trip.participants,
  )

  const amountCents = parseMoney(amount)
  const valid = amountCents !== null && amountCents > 0 && splitBetween.length > 0
  const options = trip.participants.map((participant) => ({ value: participant, label: participantName(participant, myName) }))

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!valid) return
    await saveTripExpense(trip.id, { amountCents, note: note.trim(), date, paidBy, splitBetween }, expense?.id)
    onClose()
  }

  async function handleDelete() {
    if (!expense || !window.confirm('Supprimer cette dépense ?')) return
    await deleteTransaction(expense.id)
    onClose()
  }

  return (
    <Sheet title={expense ? 'Modifier la dépense' : 'Dépense du voyage'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 pb-2">
        <MoneyField label="Montant" value={amount} onChange={setAmount} currency={currency} autoFocus={!expense} large />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Quoi ?" value={note} onChange={setNote} maxLength={60} placeholder="Ex. Restaurant" />
          <TextField label="Date" type="date" value={date} onChange={setDate} required />
        </div>
        {trip.participants.length > 1 && (
          <>
            <ChoiceChips label="Payé par" options={options} value={paidBy} onChange={setPaidBy} color={color} />
            <MultiChoiceChips label="Partagé entre" options={options} values={splitBetween} onChange={setSplitBetween} color={color} />
          </>
        )}
        <div className="mt-1 flex gap-3">
          {expense && (
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
