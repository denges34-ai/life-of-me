import { useState, type FormEvent } from 'react'
import { ME, type CurrencyCode } from '../../../core/db/types'
import { centsToInput, parseMoney } from '../../../core/format'
import { Button } from '../../../shared/ui/Button'
import { MoneyField, TextField } from '../../../shared/ui/Field'
import { Sheet } from '../../../shared/ui/Sheet'
import { deleteTrip, saveTrip } from '../db'
import { participantName } from '../logic'
import type { Trip } from '../types'

interface Props {
  trip?: Trip
  /** Pour une création : commencer en mode « envie » (sans dates). */
  startAsWish?: boolean
  currency: CurrencyCode
  myName: string
  color: string
  onClose: () => void
  onSaved?: (tripId: string) => void
  onDeleted?: () => void
}

/** Création / modification d'un voyage ou d'une envie. */
export function TripSheet({ trip, startAsWish = false, currency, myName, color, onClose, onSaved, onDeleted }: Props) {
  const [destination, setDestination] = useState(trip?.destination ?? '')
  const [emoji, setEmoji] = useState(trip?.emoji ?? '✈️')
  const [isWish, setIsWish] = useState(trip ? !trip.startDate : startAsWish)
  const [startDate, setStartDate] = useState(trip?.startDate ?? '')
  const [endDate, setEndDate] = useState(trip?.endDate ?? '')
  const [budget, setBudget] = useState(trip ? centsToInput(trip.budgetCents) : '')
  const [participants, setParticipants] = useState<string[]>(trip?.participants ?? [ME])
  const [newParticipant, setNewParticipant] = useState('')

  const budgetCents = budget.trim() === '' ? 0 : parseMoney(budget)
  const datesValid = isWish || (startDate !== '' && (endDate === '' || endDate >= startDate))
  const valid = destination.trim().length > 0 && budgetCents !== null && datesValid

  function addParticipant() {
    const name = newParticipant.trim()
    if (name && !participants.some((p) => participantName(p, myName).toLowerCase() === name.toLowerCase())) {
      setParticipants([...participants, name])
    }
    setNewParticipant('')
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!valid) return
    const id = await saveTrip(
      {
        destination: destination.trim(),
        emoji: emoji.trim() || '✈️',
        startDate: isWish ? null : startDate,
        endDate: isWish ? null : endDate || startDate,
        participants,
        budgetCents,
        notes: trip?.notes ?? '',
      },
      trip?.id,
    )
    onSaved?.(id)
    onClose()
  }

  async function handleDelete() {
    if (!trip || !window.confirm(`Supprimer « ${trip.destination} » ? Les dépenses déjà notées restent dans tes finances.`)) return
    await deleteTrip(trip.id)
    onClose()
    onDeleted?.()
  }

  return (
    <Sheet title={trip ? 'Modifier le voyage' : 'Nouveau voyage'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 pb-2">
        <div className="grid grid-cols-[5rem_1fr] gap-3">
          <TextField label="Icône" value={emoji} onChange={setEmoji} maxLength={4} className="text-center text-2xl" />
          <TextField label="Destination" value={destination} onChange={setDestination} maxLength={40} placeholder="Ex. Lisbonne" autoFocus={!trip} required />
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-black/5 p-1" role="radiogroup" aria-label="Type de voyage">
          {[
            { wish: false, label: '🗓️ Dates prévues' },
            { wish: true, label: '💭 Une envie' },
          ].map((option) => (
            <button
              key={option.label}
              type="button"
              role="radio"
              aria-checked={isWish === option.wish}
              onClick={() => setIsWish(option.wish)}
              className={`min-h-11 rounded-xl text-sm font-bold transition ${isWish === option.wish ? 'bg-white shadow-sm' : 'text-muted'}`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {!isWish && (
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Départ" type="date" value={startDate} onChange={setStartDate} required />
            <TextField label="Retour" type="date" value={endDate} onChange={setEndDate} min={startDate || undefined} />
          </div>
        )}

        <MoneyField label="Budget prévu (facultatif)" value={budget} onChange={setBudget} currency={currency} />

        <div>
          <span className="mb-1.5 block text-sm font-semibold text-muted">Participants</span>
          <div className="flex flex-wrap gap-2">
            {participants.map((participant) => (
              <span key={participant} className="flex min-h-11 items-center gap-1 rounded-full bg-white pl-3.5 pr-1.5 text-sm font-semibold ring-1 ring-black/10">
                {participantName(participant, myName)}
                {participant === ME ? (
                  <span className="pr-2 text-xs text-muted">(moi)</span>
                ) : (
                  <button
                    type="button"
                    aria-label={`Retirer ${participant}`}
                    onClick={() => setParticipants(participants.filter((p) => p !== participant))}
                    className="grid h-8 w-8 place-items-center rounded-full active:bg-black/10"
                  >
                    ✕
                  </button>
                )}
              </span>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              className="min-h-12 w-full rounded-2xl bg-white px-4 text-base font-semibold ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-brand-500"
              value={newParticipant}
              onChange={(event) => setNewParticipant(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  addParticipant()
                }
              }}
              placeholder="Ajouter un prénom"
              maxLength={30}
              aria-label="Ajouter un participant"
            />
            <Button variant="ghost" onClick={addParticipant} disabled={newParticipant.trim() === ''}>
              Ajouter
            </Button>
          </div>
        </div>

        <div className="mt-1 flex gap-3">
          {trip && (
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
