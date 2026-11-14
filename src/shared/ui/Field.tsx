import type { InputHTMLAttributes, ReactNode } from 'react'

const INPUT_BASE = 'w-full rounded-2xl bg-white px-4 ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-brand-500'
const INPUT_CLASS = `${INPUT_BASE} min-h-12 text-base font-semibold`
const INPUT_LARGE_CLASS = `${INPUT_BASE} min-h-16 text-3xl font-extrabold`

/** Étiquette + contenu d'un champ de formulaire. */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-muted">{label}</span>
      {children}
    </label>
  )
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label: string
  value: string
  onChange: (value: string) => void
}

export function TextField({ label, value, onChange, className = '', ...props }: TextFieldProps) {
  return (
    <Field label={label}>
      <input
        className={`${INPUT_CLASS} ${className}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        {...props}
      />
    </Field>
  )
}

interface MoneyFieldProps {
  label: string
  /** Texte saisi (converti en centimes avec parseMoney au moment d'enregistrer). */
  value: string
  onChange: (value: string) => void
  currency: string
  autoFocus?: boolean
  large?: boolean
}

/** Champ de montant : ouvre le pavé numérique sur téléphone. */
export function MoneyField({ label, value, onChange, currency, autoFocus, large }: MoneyFieldProps) {
  return (
    <Field label={label}>
      <div className="relative">
        <input
          className={`${large ? INPUT_LARGE_CLASS : INPUT_CLASS} pr-16`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          inputMode="decimal"
          placeholder="0"
          autoFocus={autoFocus}
          autoComplete="off"
          enterKeyHint="done"
        />
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted">
          {currency}
        </span>
      </div>
    </Field>
  )
}

export interface ChoiceOption<T extends string> {
  value: T
  label: string
  icon?: string
}

interface ChoiceProps<T extends string> {
  label: string
  options: ChoiceOption<T>[]
  value: T | null
  onChange: (value: T) => void
  /** Couleur de la pastille sélectionnée. */
  color?: string
}

/** Choix unique sous forme de pastilles (catégorie, compte…) : un seul tap. */
export function ChoiceChips<T extends string>({ label, options, value, onChange, color }: ChoiceProps<T>) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-semibold text-muted">{label}</span>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((option) => {
          const selected = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.value)}
              className={`min-h-11 rounded-full px-3.5 text-sm font-semibold transition active:scale-95 ${selected ? 'text-white shadow-sm' : 'bg-white ring-1 ring-black/10'}`}
              style={selected ? { backgroundColor: color ?? 'var(--color-brand-500)' } : undefined}
            >
              {option.icon && <span className="mr-1.5">{option.icon}</span>}
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface MultiChoiceProps<T extends string> {
  label: string
  options: ChoiceOption<T>[]
  values: T[]
  onChange: (values: T[]) => void
  color?: string
}

/** Choix multiple sous forme de pastilles (ex. entre qui partager une dépense). */
export function MultiChoiceChips<T extends string>({ label, options, values, onChange, color }: MultiChoiceProps<T>) {
  const toggle = (value: T) =>
    onChange(values.includes(value) ? values.filter((v) => v !== value) : [...values, value])
  return (
    <div>
      <span className="mb-1.5 block text-sm font-semibold text-muted">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = values.includes(option.value)
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => toggle(option.value)}
              className={`min-h-11 rounded-full px-3.5 text-sm font-semibold transition active:scale-95 ${selected ? 'text-white shadow-sm' : 'bg-white ring-1 ring-black/10'}`}
              style={selected ? { backgroundColor: color ?? 'var(--color-brand-500)' } : undefined}
            >
              {selected ? '✓ ' : ''}
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
