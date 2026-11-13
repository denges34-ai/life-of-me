import { useState, type FormEvent } from 'react'
import { formatDayLong } from '../../../core/dates'
import { Button } from '../../../shared/ui/Button'
import { Card, EmptyState, TextButton } from '../../../shared/ui/bits'
import { TextField } from '../../../shared/ui/Field'
import { Sheet } from '../../../shared/ui/Sheet'
import { deleteItineraryItem, saveItineraryItem, type TripBundle } from '../db'
import { tripDays } from '../logic'
import type { ItineraryItem } from '../types'

export interface ItinerarySheetState {
  item?: ItineraryItem
  date: string
}

interface Props {
  bundle: TripBundle
  color: string
  onOpenSheet: (state: ItinerarySheetState) => void
}

/** Itinéraire jour par jour. */
export function ItineraryTab({ bundle, color, onOpenSheet }: Props) {
  const { trip, itinerary } = bundle
  const days = tripDays(trip)

  if (days.length === 0) {
    return <EmptyState icon="🗓️" title="Pas encore de dates" hint="Ajoute les dates du voyage dans l'onglet Infos pour construire l'itinéraire jour par jour." />
  }

  // Les activités restées sur un jour hors du voyage (dates modifiées) sont affichées quand même.
  const allDays = [...new Set([...days, ...itinerary.map((item) => item.date)])].sort()

  return (
    <>
      {allDays.map((day) => {
        const items = itinerary.filter((item) => item.date === day)
        const dayNumber = days.indexOf(day) + 1
        return (
          <Card key={day} className="!p-3">
            <div className="flex min-h-11 items-center justify-between gap-2 px-1">
              <h3 className="font-bold">
                {dayNumber > 0 ? `Jour ${dayNumber}` : 'Hors voyage'}
                <span className="ml-2 text-sm font-semibold capitalize text-muted">{formatDayLong(day)}</span>
              </h3>
              <TextButton color={color} onClick={() => onOpenSheet({ date: day })}>
                + Activité
              </TextButton>
            </div>
            {items.length === 0 && <p className="px-1 pb-1 text-sm text-muted">Journée libre.</p>}
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onOpenSheet({ item, date: item.date })}
                className="flex min-h-14 w-full items-start gap-3 rounded-2xl px-1 py-2 text-left active:bg-black/5"
              >
                <span className="w-12 shrink-0 pt-0.5 text-sm font-bold tabular-nums" style={{ color }}>
                  {item.time || '—'}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{item.title}</span>
                  {item.address && <span className="block truncate text-xs text-muted">📍 {item.address}</span>}
                  {item.note && <span className="block text-xs text-muted">{item.note}</span>}
                </span>
              </button>
            ))}
          </Card>
        )
      })}
    </>
  )
}

interface SheetProps {
  tripId: string
  days: string[]
  state: ItinerarySheetState
  color: string
  onClose: () => void
}

export function ItinerarySheet({ tripId, days, state, color, onClose }: SheetProps) {
  const { item } = state
  const [title, setTitle] = useState(item?.title ?? '')
  const [date, setDate] = useState(state.date)
  const [time, setTime] = useState(item?.time ?? '')
  const [address, setAddress] = useState(item?.address ?? '')
  const [note, setNote] = useState(item?.note ?? '')
  const valid = title.trim().length > 0 && date !== ''

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!valid) return
    await saveItineraryItem({ tripId, date, time, title: title.trim(), address: address.trim(), note: note.trim() }, item?.id)
    onClose()
  }

  async function handleDelete() {
    if (!item) return
    await deleteItineraryItem(item.id)
    onClose()
  }

  return (
    <Sheet title={item ? "Modifier l'activité" : 'Nouvelle activité'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 pb-2">
        <TextField label="Activité" value={title} onChange={setTitle} maxLength={60} placeholder="Ex. Visite du château" autoFocus={!item} required />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Jour" type="date" value={date} onChange={setDate} min={days[0]} max={days[days.length - 1]} required />
          <TextField label="Heure (facultatif)" type="time" value={time} onChange={setTime} />
        </div>
        <TextField label="Adresse (facultatif)" value={address} onChange={setAddress} maxLength={100} placeholder="Ex. Rua Augusta 12" />
        <TextField label="Note (facultatif)" value={note} onChange={setNote} maxLength={120} />
        <div className="mt-1 flex gap-3">
          {item && (
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
