import { useState, type FormEvent } from 'react'
import type { CurrencyCode } from '../../../core/db/types'
import { centsToInput, formatDate, formatMoney, parseMoney } from '../../../core/format'
import { Button } from '../../../shared/ui/Button'
import { EmptyState, ProgressBar, SectionTitle, TextButton } from '../../../shared/ui/bits'
import { MoneyField, TextField } from '../../../shared/ui/Field'
import { Sheet } from '../../../shared/ui/Sheet'
import { contributeToGoal, deleteGoal, saveGoal } from '../db'
import { monthlySavingNeeded, percent, type FinanceData } from '../logic'
import type { SavingsGoal } from '../types'

interface Props {
  data: FinanceData
  currency: CurrencyCode
  today: string
  color: string
}

/** Onglet « Objectifs » du bureau : les tirelires. */
export function GoalsTab({ data, currency, today, color }: Props) {
  const [goalSheet, setGoalSheet] = useState<{ goal?: SavingsGoal } | null>(null)
  const [contributing, setContributing] = useState<SavingsGoal | null>(null)

  return (
    <>
      <SectionTitle action={<TextButton color={color} onClick={() => setGoalSheet({})}>+ Tirelire</TextButton>}>Tirelires</SectionTitle>

      {data.goals.length === 0 && (
        <EmptyState icon="🐷" title="Aucune tirelire" hint="Voyage d'été, fonds d'urgence… Crée une tirelire avec un montant à atteindre." />
      )}

      {data.goals.map((goal) => {
        const done = goal.savedCents >= goal.targetCents
        const needed = monthlySavingNeeded(goal, today)
        return (
          <section key={goal.id} className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <button type="button" onClick={() => setGoalSheet({ goal })} className="block w-full text-left">
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate font-bold">
                  <span className="mr-2">{goal.icon}</span>
                  {goal.name}
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums">{percent(goal.savedCents, goal.targetCents)} %</span>
              </div>
              <div className="mt-2">
                <ProgressBar percent={percent(goal.savedCents, goal.targetCents)} color={color} />
              </div>
              <p className="mt-1.5 text-sm tabular-nums">
                <strong>{formatMoney(goal.savedCents, currency)}</strong>
                <span className="text-muted"> sur {formatMoney(goal.targetCents, currency)}</span>
              </p>
              <p className="text-xs text-muted">
                {done
                  ? '🎉 Objectif atteint !'
                  : [
                      goal.targetDate ? `Pour le ${formatDate(goal.targetDate)}` : null,
                      needed ? `${formatMoney(needed, currency)} par mois pour y arriver` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'Sans date limite'}
              </p>
            </button>
            <Button className="mt-3 w-full" variant="ghost" onClick={() => setContributing(goal)}>
              Verser ou retirer
            </Button>
          </section>
        )
      })}

      {goalSheet && <GoalSheet goal={goalSheet.goal} currency={currency} color={color} onClose={() => setGoalSheet(null)} />}
      {contributing && <ContributionSheet goal={contributing} currency={currency} color={color} onClose={() => setContributing(null)} />}
    </>
  )
}

function GoalSheet({ goal, currency, color, onClose }: { goal?: SavingsGoal; currency: CurrencyCode; color: string; onClose: () => void }) {
  const [name, setName] = useState(goal?.name ?? '')
  const [icon, setIcon] = useState(goal?.icon ?? '🐷')
  const [target, setTarget] = useState(goal ? centsToInput(goal.targetCents) : '')
  const [saved, setSaved] = useState(goal ? centsToInput(goal.savedCents) : '')
  const [targetDate, setTargetDate] = useState(goal?.targetDate ?? '')

  const targetCents = parseMoney(target)
  const savedCents = saved.trim() === '' ? 0 : parseMoney(saved)
  const valid = name.trim().length > 0 && targetCents !== null && targetCents > 0 && savedCents !== null

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!valid) return
    await saveGoal({ name: name.trim(), icon: icon.trim() || '🐷', targetCents, savedCents, targetDate: targetDate || null }, goal?.id)
    onClose()
  }

  async function handleDelete() {
    if (!goal || !window.confirm(`Supprimer la tirelire « ${goal.name} » ?`)) return
    await deleteGoal(goal.id)
    onClose()
  }

  return (
    <Sheet title={goal ? 'Modifier la tirelire' : 'Nouvelle tirelire'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 pb-2">
        <div className="grid grid-cols-[5rem_1fr] gap-3">
          <TextField label="Icône" value={icon} onChange={setIcon} maxLength={4} className="text-center text-2xl" />
          <TextField label="Nom" value={name} onChange={setName} maxLength={30} placeholder="Ex. Voyage été" autoFocus={!goal} required />
        </div>
        <MoneyField label="Montant à atteindre" value={target} onChange={setTarget} currency={currency} />
        <MoneyField label="Déjà mis de côté" value={saved} onChange={setSaved} currency={currency} />
        <TextField label="Date visée (facultatif)" type="date" value={targetDate} onChange={setTargetDate} />
        <div className="mt-1 flex gap-3">
          {goal && (
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

function ContributionSheet({ goal, currency, color, onClose }: { goal: SavingsGoal; currency: CurrencyCode; color: string; onClose: () => void }) {
  const [amount, setAmount] = useState('')
  const cents = parseMoney(amount)
  const valid = cents !== null && cents > 0

  async function apply(sign: 1 | -1) {
    if (!valid) return
    await contributeToGoal(goal, sign * cents)
    onClose()
  }

  return (
    <Sheet title={`${goal.icon} ${goal.name}`} onClose={onClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void apply(1)
        }}
        className="flex flex-col gap-4 pb-2"
      >
        <MoneyField label="Montant" value={amount} onChange={setAmount} currency={currency} autoFocus large />
        <div className="flex gap-3">
          <Button variant="ghost" disabled={!valid} onClick={() => void apply(-1)}>
            Retirer
          </Button>
          <Button type="submit" className="flex-1" disabled={!valid} style={{ backgroundColor: color }}>
            Verser
          </Button>
        </div>
      </form>
    </Sheet>
  )
}
