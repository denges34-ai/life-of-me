import { useState } from 'react'
import { Link, Route, Routes, useNavigate } from 'react-router-dom'
import { useCeoProfile, useSettings } from '../../core/company'
import { toISODate } from '../../core/format'
import { EmptyState, SectionTitle } from '../../shared/ui/bits'
import { OfficeLayout, type TabDef } from '../../shared/ui/OfficeLayout'
import { TripSheet } from './components/TripSheet'
import { useTrips } from './db'
import { countdownLabel, formatTripDates, nextTrip, participantName, tripStatus } from './logic'
import { TripScreen } from './TripScreen'
import type { Trip, TripStatus } from './types'

const COLOR = '#1098ad'

type ListTab = 'voyages' | 'envies'

const TABS: TabDef<ListTab>[] = [
  { id: 'voyages', label: 'Voyages' },
  { id: 'envies', label: 'Envies' },
]

const SECTIONS: { status: TripStatus; title: string }[] = [
  { status: 'ongoing', title: 'En cours' },
  { status: 'upcoming', title: 'À venir' },
  { status: 'past', title: 'Passés' },
]

/** Écran du bureau Voyages : la liste, et la fiche de chaque voyage. */
export default function VoyagesScreen() {
  return (
    <Routes>
      <Route index element={<TripList />} />
      <Route path=":tripId" element={<TripScreen />} />
    </Routes>
  )
}

function TripList() {
  const trips = useTrips()
  const navigate = useNavigate()
  const currency = useSettings()?.currency ?? 'CHF'
  const myName = useCeoProfile()?.firstName ?? ''
  const [tab, setTab] = useState<ListTab>('voyages')
  const [creating, setCreating] = useState(false)

  if (!trips) return null

  const today = toISODate()
  const byStatus = (status: TripStatus) =>
    trips
      .filter((trip) => tripStatus(trip, today) === status)
      // À venir : le plus proche d'abord. Passés : le plus récent d'abord.
      .sort((a, b) => (status === 'past' ? -1 : 1) * (a.startDate ?? '').localeCompare(b.startDate ?? ''))
  const wishes = byStatus('wish').sort((a, b) => a.destination.localeCompare(b.destination))
  const next = nextTrip(trips, today)
  const planned = trips.length - wishes.length

  return (
    <>
      <OfficeLayout
        color={COLOR}
        icon="✈️"
        title="Voyages"
        figures={[
          { label: 'Prochain', value: next ? next.destination : '—' },
          { label: 'Départ', value: next ? (countdownLabel(next, today) ?? '—') : '—' },
          { label: 'Envies', value: String(wishes.length) },
        ]}
        tabs={TABS}
        activeTab={tab}
        onTabChange={setTab}
        onAdd={() => setCreating(true)}
        addLabel={tab === 'envies' ? 'Ajouter une envie' : 'Ajouter un voyage'}
      >
        {tab === 'voyages' &&
          (planned === 0 ? (
            <EmptyState icon="🧭" title="Aucun voyage prévu" hint="Touche le bouton + pour préparer ton prochain départ." />
          ) : (
            SECTIONS.map((section) => {
              const list = byStatus(section.status)
              if (list.length === 0) return null
              return (
                <div key={section.status} className="flex flex-col gap-2">
                  <SectionTitle>{section.title}</SectionTitle>
                  {list.map((trip) => (
                    <TripCard key={trip.id} trip={trip} today={today} myName={myName} />
                  ))}
                </div>
              )
            })
          ))}

        {tab === 'envies' &&
          (wishes.length === 0 ? (
            <EmptyState icon="💭" title="Aucune envie pour l'instant" hint="Note ici les destinations qui te font rêver. Tu leur donneras des dates plus tard." />
          ) : (
            wishes.map((trip) => <TripCard key={trip.id} trip={trip} today={today} myName={myName} />)
          ))}
      </OfficeLayout>

      {creating && (
        <TripSheet
          startAsWish={tab === 'envies'}
          currency={currency}
          myName={myName}
          color={COLOR}
          onClose={() => setCreating(false)}
          onSaved={(tripId) => navigate(`/bureau/voyages/${tripId}`)}
        />
      )}
    </>
  )
}

function TripCard({ trip, today, myName }: { trip: Trip; today: string; myName: string }) {
  const label = countdownLabel(trip, today)
  return (
    <Link
      to={`/bureau/voyages/${trip.id}`}
      className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5 active:bg-black/5"
    >
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-3xl" style={{ backgroundColor: `${COLOR}1f` }}>
        {trip.emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-lg font-bold">{trip.destination}</span>
        <span className="block truncate text-sm text-muted">{formatTripDates(trip)}</span>
        {trip.participants.length > 1 && (
          <span className="block truncate text-xs text-muted">
            Avec {trip.participants.slice(1).map((p) => participantName(p, myName)).join(', ')}
          </span>
        )}
      </span>
      {label && (
        <span className="shrink-0 rounded-full px-3 py-1 text-sm font-bold text-white" style={{ backgroundColor: COLOR }}>
          {label}
        </span>
      )}
    </Link>
  )
}
