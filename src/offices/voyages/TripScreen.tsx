import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useCeoProfile, useSettings } from '../../core/company'
import { formatMoneyRounded, toISODate } from '../../core/format'
import { OfficeLayout, type TabDef } from '../../shared/ui/OfficeLayout'
import type { Transaction } from '../finances/types'
import { ExpenseSheet, ExpensesTab } from './components/ExpensesTab'
import { InfoTab } from './components/InfoTab'
import { ItinerarySheet, ItineraryTab, type ItinerarySheetState } from './components/ItineraryTab'
import { PackingTab } from './components/PackingTab'
import { TripSheet } from './components/TripSheet'
import { useTripBundle } from './db'
import { countdownLabel, formatTripDates, tripDays } from './logic'

const COLOR = '#1098ad'

type TripTab = 'infos' | 'itineraire' | 'valise' | 'depenses'

const TABS: TabDef<TripTab>[] = [
  { id: 'infos', label: 'Infos' },
  { id: 'itineraire', label: 'Itinéraire' },
  { id: 'valise', label: 'Valise' },
  { id: 'depenses', label: 'Dépenses' },
]

/** Fiche d'un voyage. */
export function TripScreen() {
  const { tripId = '' } = useParams()
  const navigate = useNavigate()
  const bundle = useTripBundle(tripId)
  const currency = useSettings()?.currency ?? 'CHF'
  const myName = useCeoProfile()?.firstName ?? ''
  const [tab, setTab] = useState<TripTab>('infos')
  const [editingTrip, setEditingTrip] = useState(false)
  const [itinerarySheet, setItinerarySheet] = useState<ItinerarySheetState | null>(null)
  // `undefined` = fermé ; `null` = nouvelle dépense ; sinon dépense à modifier.
  const [expenseSheet, setExpenseSheet] = useState<Transaction | null | undefined>(undefined)

  if (bundle === undefined) return null
  if (bundle === null) return <Navigate to="/bureau/voyages" replace />

  const { trip, expenses } = bundle
  const today = toISODate()
  const days = tripDays(trip)
  const spent = expenses.reduce((sum, expense) => sum + expense.amountCents, 0)

  // Le bouton « + » dépend de l'onglet : une activité, ou une dépense.
  const onAdd =
    tab === 'itineraire' && days.length > 0
      ? () => setItinerarySheet({ date: days.includes(today) ? today : days[0] })
      : tab === 'depenses'
        ? () => setExpenseSheet(null)
        : undefined

  return (
    <>
      <OfficeLayout
        color={COLOR}
        icon={trip.emoji}
        title={trip.destination}
        subtitle={formatTripDates(trip)}
        backTo="/bureau/voyages"
        figures={[
          { label: 'Départ', value: countdownLabel(trip, today) ?? 'Envie' },
          { label: 'Budget', value: trip.budgetCents > 0 ? formatMoneyRounded(trip.budgetCents, currency) : '—' },
          { label: 'Dépensé', value: formatMoneyRounded(spent, currency) },
        ]}
        tabs={TABS}
        activeTab={tab}
        onTabChange={setTab}
        onAdd={onAdd}
        addLabel={tab === 'depenses' ? 'Ajouter une dépense' : 'Ajouter une activité'}
      >
        {tab === 'infos' && <InfoTab bundle={bundle} currency={currency} myName={myName} color={COLOR} onEditTrip={() => setEditingTrip(true)} />}
        {tab === 'itineraire' && <ItineraryTab bundle={bundle} color={COLOR} onOpenSheet={setItinerarySheet} />}
        {tab === 'valise' && <PackingTab bundle={bundle} color={COLOR} />}
        {tab === 'depenses' && <ExpensesTab bundle={bundle} currency={currency} myName={myName} color={COLOR} onEdit={setExpenseSheet} />}
      </OfficeLayout>

      {editingTrip && (
        <TripSheet
          trip={trip}
          currency={currency}
          myName={myName}
          color={COLOR}
          onClose={() => setEditingTrip(false)}
          onDeleted={() => navigate('/bureau/voyages', { replace: true })}
        />
      )}
      {itinerarySheet && (
        <ItinerarySheet tripId={trip.id} days={days} state={itinerarySheet} color={COLOR} onClose={() => setItinerarySheet(null)} />
      )}
      {expenseSheet !== undefined && (
        <ExpenseSheet
          bundle={bundle}
          expense={expenseSheet ?? undefined}
          currency={currency}
          myName={myName}
          color={COLOR}
          onClose={() => setExpenseSheet(undefined)}
        />
      )}
    </>
  )
}
