import { useState, type FormEvent } from 'react'
import type { CurrencyCode } from '../../../core/db/types'
import { centsToInput, formatMoney, parseMoney, parseSignedMoney } from '../../../core/format'
import { Button } from '../../../shared/ui/Button'
import { Card, EmptyState, ListRow, SectionTitle, TextButton } from '../../../shared/ui/bits'
import { ChoiceChips, MoneyField, TextField } from '../../../shared/ui/Field'
import { Sheet } from '../../../shared/ui/Sheet'
import { deleteAccount, deleteRule, saveAccount, saveRule } from '../db'
import { accountBalance, type FinanceData } from '../logic'
import type { Account, RecurringRule, TransactionType } from '../types'

interface Props {
  data: FinanceData
  currency: CurrencyCode
  today: string
  color: string
}

const ACCOUNT_KINDS: { value: Account['kind']; label: string; icon: string }[] = [
  { value: 'checking', label: 'Courant', icon: '💳' },
  { value: 'savings', label: 'Épargne', icon: '🏦' },
  { value: 'cash', label: 'Cash', icon: '💶' },
]
const kindIcon = (kind: Account['kind']) => ACCOUNT_KINDS.find((k) => k.value === kind)?.icon ?? '💳'

/** Comptes (soldes saisis à la main) et mouvements récurrents. */
export function AccountsTab({ data, currency, today, color }: Props) {
  const [accountSheet, setAccountSheet] = useState<{ account?: Account } | null>(null)
  const [ruleSheet, setRuleSheet] = useState<{ rule?: RecurringRule } | null>(null)
  const total = data.accounts.reduce((sum, account) => sum + accountBalance(account, data.transactions), 0)

  return (
    <>
      <Card>
        <p className="text-sm font-semibold text-muted">Total de mes comptes</p>
        <p className="mt-1 text-3xl font-extrabold tabular-nums">{formatMoney(total, currency)}</p>
      </Card>

      <SectionTitle action={<TextButton color={color} onClick={() => setAccountSheet({})}>+ Compte</TextButton>}>Comptes</SectionTitle>
      <Card className="!p-2">
        {data.accounts.map((account) => (
          <ListRow
            key={account.id}
            icon={kindIcon(account.kind)}
            title={account.name}
            value={formatMoney(accountBalance(account, data.transactions), currency)}
            onClick={() => setAccountSheet({ account })}
          />
        ))}
      </Card>

      <SectionTitle action={<TextButton color={color} onClick={() => setRuleSheet({})}>+ Récurrent</TextButton>}>
        Chaque mois
      </SectionTitle>
      {data.rules.length === 0 ? (
        <EmptyState icon="🔁" title="Aucun récurrent" hint="Loyer, abonnements, salaire : ajoute-les une fois, ils se noteront tout seuls chaque mois." />
      ) : (
        <Card className="!p-2">
          {data.rules.map((rule) => {
            const category = data.categories.find((c) => c.id === rule.categoryId)
            return (
              <ListRow
                key={rule.id}
                icon={category?.icon ?? '🔁'}
                title={rule.name}
                subtitle={rule.active ? `Le ${rule.dayOfMonth} de chaque mois` : 'En pause'}
                value={`${rule.type === 'income' ? '+' : '−'} ${formatMoney(rule.amountCents, currency)}`}
                valueClassName={rule.active ? (rule.type === 'income' ? 'text-emerald-700' : '') : 'text-muted'}
                onClick={() => setRuleSheet({ rule })}
              />
            )
          })}
        </Card>
      )}

      {accountSheet && (
        <AccountSheet data={data} account={accountSheet.account} currency={currency} color={color} onClose={() => setAccountSheet(null)} />
      )}
      {ruleSheet && (
        <RuleSheet data={data} rule={ruleSheet.rule} currency={currency} today={today} color={color} onClose={() => setRuleSheet(null)} />
      )}
    </>
  )
}

function AccountSheet({
  data,
  account,
  currency,
  color,
  onClose,
}: {
  data: FinanceData
  account?: Account
  currency: CurrencyCode
  color: string
  onClose: () => void
}) {
  const [name, setName] = useState(account?.name ?? '')
  const [kind, setKind] = useState<Account['kind']>(account?.kind ?? 'checking')
  const [balance, setBalance] = useState(account ? centsToInput(accountBalance(account, data.transactions)) : '')

  const balanceCents = balance.trim() === '' ? 0 : parseSignedMoney(balance)
  const valid = name.trim().length > 0 && balanceCents !== null

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!valid) return
    await saveAccount({ name: name.trim(), kind, balanceCents }, data.transactions, account?.id)
    onClose()
  }

  async function handleDelete() {
    if (!account || !window.confirm(`Supprimer le compte « ${account.name} » ? Ses mouvements sont conservés.`)) return
    await deleteAccount(account.id)
    onClose()
  }

  return (
    <Sheet title={account ? 'Modifier le compte' : 'Nouveau compte'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 pb-2">
        <TextField label="Nom" value={name} onChange={setName} maxLength={30} placeholder="Ex. Compte commun" autoFocus={!account} required />
        <ChoiceChips label="Type" options={ACCOUNT_KINDS} value={kind} onChange={setKind} color={color} />
        <MoneyField label="Solde actuel" value={balance} onChange={setBalance} currency={currency} />
        <div className="mt-1 flex gap-3">
          {account && data.accounts.length > 1 && (
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

function RuleSheet({
  data,
  rule,
  currency,
  today,
  color,
  onClose,
}: {
  data: FinanceData
  rule?: RecurringRule
  currency: CurrencyCode
  today: string
  color: string
  onClose: () => void
}) {
  const firstCategory = (type: TransactionType) => data.categories.find((category) => category.kind === type)?.id ?? null
  const [name, setName] = useState(rule?.name ?? '')
  const [type, setType] = useState<TransactionType>(rule?.type ?? 'expense')
  const [amount, setAmount] = useState(rule ? centsToInput(rule.amountCents) : '')
  const [categoryId, setCategoryId] = useState<string | null>(rule ? rule.categoryId : firstCategory('expense'))
  const [accountId, setAccountId] = useState<string | null>(rule ? rule.accountId : (data.accounts[0]?.id ?? null))
  const [day, setDay] = useState(String(rule?.dayOfMonth ?? 1))
  const [active, setActive] = useState(rule?.active ?? true)

  const amountCents = parseMoney(amount)
  const dayOfMonth = Number(day)
  const valid =
    name.trim().length > 0 && amountCents !== null && amountCents > 0 && Number.isInteger(dayOfMonth) && dayOfMonth >= 1 && dayOfMonth <= 31

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!valid) return
    await saveRule({ name: name.trim(), type, amountCents, categoryId, accountId, dayOfMonth, active }, today, rule?.id)
    onClose()
  }

  async function handleDelete() {
    if (!rule || !window.confirm(`Supprimer « ${rule.name} » ? Les mouvements déjà créés sont conservés.`)) return
    await deleteRule(rule.id)
    onClose()
  }

  return (
    <Sheet title={rule ? 'Modifier le récurrent' : 'Nouveau récurrent'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 pb-2">
        <ChoiceChips
          label="Type"
          options={[
            { value: 'expense', label: '− Dépense' },
            { value: 'income', label: '+ Revenu' },
          ]}
          value={type}
          onChange={(next) => {
            setType(next)
            setCategoryId(firstCategory(next))
          }}
          color={color}
        />
        <TextField label="Nom" value={name} onChange={setName} maxLength={40} placeholder="Ex. Loyer" autoFocus={!rule} required />
        <div className="grid grid-cols-2 gap-3">
          <MoneyField label="Montant" value={amount} onChange={setAmount} currency={currency} />
          <TextField label="Jour du mois" value={day} onChange={setDay} inputMode="numeric" maxLength={2} />
        </div>
        <ChoiceChips
          label="Catégorie"
          options={data.categories.filter((c) => c.kind === type).map((c) => ({ value: c.id, label: c.name, icon: c.icon }))}
          value={categoryId}
          onChange={setCategoryId}
          color={color}
        />
        <ChoiceChips
          label="Compte"
          options={data.accounts.map((a) => ({ value: a.id, label: a.name }))}
          value={accountId}
          onChange={setAccountId}
          color={color}
        />
        {rule && (
          <label className="flex min-h-12 items-center justify-between gap-3 rounded-2xl bg-white px-4 ring-1 ring-black/10">
            <span className="font-semibold">Actif</span>
            <input type="checkbox" className="h-6 w-6 accent-emerald-600" checked={active} onChange={(e) => setActive(e.target.checked)} />
          </label>
        )}
        {!rule && <p className="text-xs text-muted">La première échéance sera la prochaine date à venir : rien n'est ajouté pour le passé.</p>}
        <div className="mt-1 flex gap-3">
          {rule && (
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
