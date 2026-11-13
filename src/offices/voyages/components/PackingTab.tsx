import { useState, type FormEvent } from 'react'
import { Button } from '../../../shared/ui/Button'
import { Card, EmptyState, ProgressBar } from '../../../shared/ui/bits'
import { addPackingItems, deletePackingItem, togglePacked, type TripBundle } from '../db'
import { PACKING_TEMPLATES } from '../templates'

interface Props {
  bundle: TripBundle
  color: string
}

/** Checklist de valise : modèles en un tap, puis liste personnalisable. */
export function PackingTab({ bundle, color }: Props) {
  const { trip, packing } = bundle
  const [label, setLabel] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const packed = packing.filter((item) => item.packed).length

  async function handleAdd(event: FormEvent) {
    event.preventDefault()
    await addPackingItems(trip.id, [label], packing)
    setLabel('')
  }

  async function applyTemplate(templateId: string) {
    const template = PACKING_TEMPLATES.find((t) => t.id === templateId)
    if (!template) return
    const added = await addPackingItems(trip.id, template.items, packing)
    setMessage(added > 0 ? `${added} objet${added > 1 ? 's' : ''} ajouté${added > 1 ? 's' : ''} (${template.label})` : 'Tout y était déjà.')
  }

  return (
    <>
      {packing.length > 0 && (
        <Card>
          <div className="flex items-baseline justify-between">
            <p className="font-bold">{packed === packing.length ? '🎉 Valise prête !' : 'Valise'}</p>
            <p className="text-sm font-semibold tabular-nums text-muted">
              {packed} / {packing.length}
            </p>
          </div>
          <div className="mt-2">
            <ProgressBar percent={(packed / packing.length) * 100} color={color} />
          </div>
        </Card>
      )}

      <div>
        <p className="mb-1.5 px-1 text-sm font-semibold text-muted">Partir d'un modèle</p>
        <div className="flex flex-wrap gap-2">
          {PACKING_TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => void applyTemplate(template.id)}
              className="min-h-11 rounded-full bg-white px-3.5 text-sm font-semibold ring-1 ring-black/10 active:scale-95"
            >
              <span className="mr-1.5">{template.icon}</span>
              {template.label}
            </button>
          ))}
        </div>
        {message && (
          <p className="mt-2 px-1 text-xs text-muted" role="status">
            {message}
          </p>
        )}
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          className="min-h-12 w-full rounded-2xl bg-white px-4 text-base font-semibold ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-brand-500"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="Ajouter un objet"
          maxLength={50}
          aria-label="Ajouter un objet à la valise"
          enterKeyHint="done"
        />
        <Button type="submit" disabled={label.trim() === ''} style={{ backgroundColor: color }}>
          Ajouter
        </Button>
      </form>

      {packing.length === 0 ? (
        <EmptyState icon="🧳" title="Valise vide" hint="Choisis un modèle ci-dessus ou ajoute tes objets un par un." />
      ) : (
        <Card className="!p-2">
          {packing.map((item) => (
            <div key={item.id} className="flex min-h-12 items-center">
              <label className="flex min-h-12 min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-2xl px-2 active:bg-black/5">
                <input
                  type="checkbox"
                  className="h-6 w-6 shrink-0"
                  style={{ accentColor: color }}
                  checked={item.packed}
                  onChange={() => void togglePacked(item)}
                />
                <span className={`truncate font-semibold ${item.packed ? 'text-muted line-through' : ''}`}>{item.label}</span>
              </label>
              <button
                type="button"
                aria-label={`Retirer ${item.label}`}
                onClick={() => void deletePackingItem(item.id)}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted active:bg-black/10"
              >
                ✕
              </button>
            </div>
          ))}
        </Card>
      )}
    </>
  )
}
