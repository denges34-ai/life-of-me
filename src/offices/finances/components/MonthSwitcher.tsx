import { addMonths, formatMonth } from '../../../core/dates'

/** Navigation mois par mois : ‹ novembre 2026 › */
export function MonthSwitcher({ month, onChange }: { month: string; onChange: (month: string) => void }) {
  const buttonClass = 'grid h-11 w-11 place-items-center rounded-full bg-white text-xl ring-1 ring-black/10 active:bg-black/5'
  return (
    <div className="flex items-center justify-between gap-3">
      <button type="button" className={buttonClass} aria-label="Mois précédent" onClick={() => onChange(addMonths(month, -1))}>
        ‹
      </button>
      <span className="text-base font-bold capitalize">{formatMonth(month)}</span>
      <button type="button" className={buttonClass} aria-label="Mois suivant" onClick={() => onChange(addMonths(month, 1))}>
        ›
      </button>
    </div>
  )
}
