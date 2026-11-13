import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { KeyFigure } from '../../core/offices/types'

export interface TabDef<T extends string> {
  id: T
  label: string
}

interface OfficeLayoutProps<T extends string> {
  color: string
  icon: string
  title: string
  subtitle?: string
  /** Où mène le bouton retour (par défaut : l'open space). */
  backTo?: string
  figures?: KeyFigure[]
  tabs?: TabDef<T>[]
  activeTab?: T
  onTabChange?: (tab: T) => void
  /** Action du bouton « + » flottant. Absent = pas de bouton. */
  onAdd?: () => void
  addLabel?: string
  children: ReactNode
}

/**
 * Gabarit commun à tous les bureaux : en-tête coloré avec chiffres clés,
 * onglets, contenu, bouton « + » flottant en bas à droite (à portée de pouce).
 */
export function OfficeLayout<T extends string>({
  color,
  icon,
  title,
  subtitle,
  backTo = '/',
  figures = [],
  tabs,
  activeTab,
  onTabChange,
  onAdd,
  addLabel = 'Ajouter',
  children,
}: OfficeLayoutProps<T>) {
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col">
      <header className="safe-top rounded-b-[2rem] px-5 pb-5 text-white" style={{ backgroundColor: color }}>
        <div className="flex items-center gap-3">
          <Link
            to={backTo}
            aria-label="Retour"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/20 text-2xl active:bg-white/30"
          >
            ←
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-extrabold">
              <span className="mr-2">{icon}</span>
              {title}
            </h1>
            {subtitle && <p className="truncate text-sm text-white/85">{subtitle}</p>}
          </div>
        </div>

        {figures.length > 0 && (
          <dl className="mt-4 grid gap-2" style={{ gridTemplateColumns: `repeat(${figures.length}, minmax(0, 1fr))` }}>
            {figures.map((figure) => (
              <div key={figure.label} className="rounded-2xl bg-white/15 px-3 py-2">
                <dt className="truncate text-xs text-white/80">{figure.label}</dt>
                <dd className="truncate text-base font-extrabold">{figure.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </header>

      {tabs && (
        <nav className="sticky top-0 z-10 bg-cream/95 px-3 py-2 backdrop-blur" aria-label="Sections">
          <div className="flex gap-1 overflow-x-auto" role="tablist">
            {tabs.map((tab) => {
              const active = tab.id === activeTab
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onTabChange?.(tab.id)}
                  className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-bold transition ${active ? 'text-white' : 'text-muted active:bg-black/5'}`}
                  style={active ? { backgroundColor: color } : undefined}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </nav>
      )}

      <main className="flex flex-1 flex-col gap-4 px-5 pb-28 pt-3">{children}</main>

      {onAdd && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-md justify-end px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onAdd}
            aria-label={addLabel}
            className="pointer-events-auto grid h-16 w-16 place-items-center rounded-full text-4xl font-light text-white shadow-xl transition active:scale-90"
            style={{ backgroundColor: color }}
          >
            +
          </button>
        </div>
      )}
    </div>
  )
}
