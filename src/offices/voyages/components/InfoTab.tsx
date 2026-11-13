import { useState, type FormEvent } from 'react'
import type { CurrencyCode } from '../../../core/db/types'
import { formatMoney } from '../../../core/format'
import { Button } from '../../../shared/ui/Button'
import { Card, ProgressBar, SectionTitle, TextButton } from '../../../shared/ui/bits'
import { Field, TextField } from '../../../shared/ui/Field'
import { Sheet } from '../../../shared/ui/Sheet'
import { deleteBooking, saveBooking, saveTrip, toggleBooking, type TripBundle } from '../db'
import { participantName } from '../logic'
import type { Booking, BookingKind } from '../types'

interface Props {
  bundle: TripBundle
  currency: CurrencyCode
  myName: string
  color: string
  onEditTrip: () => void
}

const SECTIONS: { kind: BookingKind; title: string; icon: string; add: string; placeholder: string; doneLabel: string }[] = [
  { kind: 'lodging', title: 'Hébergement', icon: '🏨', add: '+ Hébergement', placeholder: 'Ex. Hôtel Alfama', doneLabel: 'Réservé' },
  { kind: 'transport', title: 'Transports', icon: '🚆', add: '+ Transport', placeholder: 'Ex. Vol Genève → Lisbonne', doneLabel: 'Réservé' },
  { kind: 'document', title: 'Documents à prévoir', icon: '📄', add: '+ Document', placeholder: 'Ex. Passeport', doneLabel: 'Prêt' },
]

/** Fiche du voyage : budget, participants, hébergement, transports, documents, notes. */
export function InfoTab({ bundle, currency, myName, color, onEditTrip }: Props) {
  const { trip, bookings, expenses } = bundle
  const [bookingSheet, setBookingSheet] = useState<{ kind: BookingKind; booking?: Booking } | null>(null)
  const [notes, setNotes] = useState(trip.notes)
  const spent = expenses.reduce((sum, expense) => sum + expense.amountCents, 0)
  const over = trip.budgetCents > 0 && spent > trip.budgetCents

  return (
    <>
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-muted">Budget</p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums">
              {formatMoney(spent, currency)}
              {trip.budgetCents > 0 && <span className="text-base font-semibold text-muted"> / {formatMoney(trip.budgetCents, currency)}</span>}
            </p>
          </div>
          <TextButton color={color} onClick={onEditTrip}>
            Modifier
          </TextButton>
        </div>
        {trip.budgetCents > 0 ? (
          <>
            <div className="mt-2">
              <ProgressBar percent={(spent / trip.budgetCents) * 100} color={over ? '#d03b3b' : color} />
            </div>
            <p className="mt-1.5 text-xs text-muted">
              {over
                ? `⛔ Dépassé de ${formatMoney(spent - trip.budgetCents, currency)}`
                : `✓ Reste ${formatMoney(trip.budgetCents - spent, currency)}`}
            </p>
          </>
        ) : (
          <p className="mt-1 text-xs text-muted">Pas de budget prévu pour l'instant.</p>
        )}
        <p className="mt-3 text-sm">
          <span className="text-muted">Avec : </span>
          <strong>{trip.participants.map((p) => participantName(p, myName)).join(', ')}</strong>
        </p>
      </Card>

      {SECTIONS.map((section) => {
        const items = bookings.filter((booking) => booking.kind === section.kind)
        return (
          <div key={section.kind} className="flex flex-col gap-2">
            <SectionTitle action={<TextButton color={color} onClick={() => setBookingSheet({ kind: section.kind })}>{section.add}</TextButton>}>
              {section.icon} {section.title}
            </SectionTitle>
            {items.length > 0 && (
              <Card className="!p-2">
                {items.map((booking) => (
                  <div key={booking.id} className="flex min-h-14 items-center gap-1">
                    <label className="grid h-12 w-12 shrink-0 cursor-pointer place-items-center" title={section.doneLabel}>
                      <input
                        type="checkbox"
                        className="h-6 w-6"
                        style={{ accentColor: color }}
                        checked={booking.done}
                        onChange={() => void toggleBooking(booking)}
                        aria-label={`${section.doneLabel} : ${booking.title}`}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setBookingSheet({ kind: section.kind, booking })}
                      className="min-w-0 flex-1 rounded-2xl px-1 py-1.5 text-left active:bg-black/5"
                    >
                      <span className={`block truncate font-semibold ${booking.done ? 'text-muted line-through' : ''}`}>{booking.title}</span>
                      {booking.details && <span className="block truncate text-xs text-muted">{booking.details}</span>}
                    </button>
                  </div>
                ))}
              </Card>
            )}
          </div>
        )
      })}

      <SectionTitle>📝 Notes</SectionTitle>
      <textarea
        className="min-h-28 w-full rounded-3xl bg-white p-4 text-base ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-brand-500"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        // Enregistré quand on quitte le champ : pas de bouton à chercher.
        onBlur={() => notes !== trip.notes && void saveTrip({ ...tripData(bundle), notes }, trip.id)}
        placeholder="Idées, adresses, numéros utiles…"
        aria-label="Notes du voyage"
      />

      {bookingSheet && (
        <BookingSheet
          tripId={trip.id}
          kind={bookingSheet.kind}
          booking={bookingSheet.booking}
          color={color}
          onClose={() => setBookingSheet(null)}
        />
      )}
    </>
  )
}

/** Champs métier du voyage (sans les champs communs), pour une mise à jour partielle. */
function tripData({ trip }: TripBundle) {
  const { destination, emoji, startDate, endDate, participants, budgetCents, notes } = trip
  return { destination, emoji, startDate, endDate, participants, budgetCents, notes }
}

function BookingSheet({
  tripId,
  kind,
  booking,
  color,
  onClose,
}: {
  tripId: string
  kind: BookingKind
  booking?: Booking
  color: string
  onClose: () => void
}) {
  const section = SECTIONS.find((s) => s.kind === kind)!
  const [title, setTitle] = useState(booking?.title ?? '')
  const [details, setDetails] = useState(booking?.details ?? '')
  const valid = title.trim().length > 0

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!valid) return
    await saveBooking({ tripId, kind, title: title.trim(), details: details.trim(), done: booking?.done ?? false }, booking?.id)
    onClose()
  }

  async function handleDelete() {
    if (!booking) return
    await deleteBooking(booking.id)
    onClose()
  }

  return (
    <Sheet title={`${section.icon} ${section.title}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 pb-2">
        <TextField label="Nom" value={title} onChange={setTitle} maxLength={60} placeholder={section.placeholder} autoFocus={!booking} required />
        <Field label="Détails (facultatif)">
          <textarea
            className="min-h-24 w-full rounded-2xl bg-white p-4 text-base ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-brand-500"
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            placeholder="Adresse, horaires, numéro de réservation…"
          />
        </Field>
        <div className="mt-1 flex gap-3">
          {booking && (
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
