import { useState, type FormEvent } from 'react'
import type { CurrencyCode } from '../../../core/db/types'
import { centsToInput, parseMoney, toISODate } from '../../../core/format'
import { Button } from '../../../shared/ui/Button'
import { ChoiceChips, MoneyField, TextField } from '../../../shared/ui/Field'
import { Sheet } from '../../../shared/ui/Sheet'
import { addTransaction, deleteTransaction, updateTransaction } from '../db'
import type { FinanceData } from '../logic'
import { useFinanceStore } from '../store'
import type { Transaction, TransactionType } from '../types'

interface Props {
  data: FinanceData
  currency: CurrencyCode
  /** Mouvement à modifier. Absent = nouvel ajout. */
  transaction?: Transaction
  color: string
  onClose: () => void
}

/**
 * Ajout rapide d'une dépense ou d'un revenu.
 * Objectif : moins de 10 secondes. Montant → (catégorie déjà proposée) → Enregistrer.
 */
export function TransactionSheet({ data, currency, transaction, color, onClose }: Props) {
  const store = useFinanceStore()

  // Catégorie proposée : la dernière utilisée pour ce type, sinon la première.
  const defaultCategory = (type: TransactionType): string | null => {
    const categories = data.categories.filter((category) => category.kind === type)
    const last = type === 'expense' ? store.lastExpenseCategoryId : store.lastIncomeCategoryId
    return categories.some((category) => category.id === last) ? last : (categories[0]?.id ?? null)
  }
  const defaultAccount = data.accounts.some((account) => account.id === store.lastAccountId)
    ? store.lastAccountId
    : (data.accounts[0]?.id ?? null)

  const [type, setType] = useState<TransactionType>(transaction?.type ?? 'expense')
  const [amount, setAmount] = useState(transaction ? centsToInput(transaction.amountCents) : '')
  const [categoryId, setCategoryId] = useState<string | null>(transaction ? transaction.categoryId : defaultCategory('expense'))
  const [accountId, setAccountId] = useState<string | null>(transaction ? transaction.accountId : defaultAccount)
  const [date, setDate] = useState(transaction?.date ?? toISODate())
  const [note, setNote] = useState(transaction?.note ?? '')

  const amountCents = parseMoney(amount)
  const valid = amountCents !== null && amountCents > 0
  const categories = data.categories.filter((category) => category.kind === type)

  function changeType(next: TransactionType) {
    setType(next)
    setCategoryId(defaultCategory(next))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!valid) return
    const input = { type, amountCents, categoryId, accountId, date, note: note.trim() }
    if (transaction) await updateTransaction(transaction.id, input)
    else await addTransaction(input)
    store.rememberChoice({ type, categoryId, accountId })
    onClose()
  }

  async function handleDelete() {
    if (!transaction || !window.confirm('Supprimer ce mouvement ?')) return
    await deleteTransaction(transaction.id)
    onClose()
  }

  return (
    <Sheet title={transaction ? 'Modifier' : 'Ajouter'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 pb-2">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-black/5 p-1" role="radiogroup" aria-label="Type">
          {(['expense', 'income'] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={type === option}
              onClick={() => changeType(option)}
              className={`min-h-11 rounded-xl text-sm font-bold transition ${type === option ? 'bg-white shadow-sm' : 'text-muted'}`}
            >
              {option === 'expense' ? '− Dépense' : '+ Revenu'}
            </button>
          ))}
        </div>

        <MoneyField label="Montant" value={amount} onChange={setAmount} currency={currency} autoFocus={!transaction} large />

        <ChoiceChips
          label="Catégorie"
          options={categories.map((category) => ({ value: category.id, label: category.name, icon: category.icon }))}
          value={categoryId}
          onChange={setCategoryId}
          color={color}
        />

        {data.accounts.length > 1 && (
          <ChoiceChips
            label="Compte"
            options={data.accounts.map((account) => ({ value: account.id, label: account.name }))}
            value={accountId}
            onChange={setAccountId}
            color={color}
          />
        )}

        <div className="grid grid-cols-2 gap-3">
          <TextField label="Date" type="date" value={date} onChange={setDate} required />
          <TextField label="Note (facultatif)" value={note} onChange={setNote} placeholder="Ex. Migros" maxLength={60} />
        </div>

        <div className="mt-1 flex gap-3">
          {transaction && (
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
