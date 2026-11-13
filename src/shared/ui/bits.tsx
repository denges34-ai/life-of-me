import type { ReactNode } from 'react'

// Petits composants d'affichage réutilisés par tous les bureaux.

/** Carte blanche arrondie. */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5 ${className}`}>{children}</section>
}

/** Titre de section en petites capitales. */
export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 px-1">
      <h2 className="text-sm font-bold uppercase tracking-wide text-muted">{children}</h2>
      {action}
    </div>
  )
}

/** Petit bouton texte (« + Compte », « Modifier »…). */
export function TextButton({ children, onClick, color }: { children: ReactNode; onClick: () => void; color?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-11 rounded-full px-3 text-sm font-bold active:bg-black/5"
      style={{ color: color ?? 'var(--color-brand-600)' }}
    >
      {children}
    </button>
  )
}

/** Message affiché quand une liste est vide : toujours bienveillant, avec la marche à suivre. */
export function EmptyState({ icon, title, hint }: { icon: string; title: string; hint: string }) {
  return (
    <div className="px-6 py-10 text-center">
      <div className="text-5xl">{icon}</div>
      <h3 className="mt-3 text-lg font-bold">{title}</h3>
      <p className="mt-1 text-sm text-muted">{hint}</p>
    </div>
  )
}

/** Barre de progression. `percent` peut dépasser 100 (la barre reste pleine). */
export function ProgressBar({ percent, color }: { percent: number; color: string }) {
  const width = Math.max(0, Math.min(100, percent))
  return (
    <div
      className="h-2.5 w-full overflow-hidden rounded-full bg-black/10"
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${width}%`, backgroundColor: color }} />
    </div>
  )
}

/** Ligne cliquable d'une liste (icône, titre, sous-titre, valeur à droite). */
export function ListRow({
  icon,
  title,
  subtitle,
  value,
  valueClassName = '',
  onClick,
}: {
  icon?: string
  title: string
  subtitle?: string
  value?: ReactNode
  valueClassName?: string
  onClick?: () => void
}) {
  const content = (
    <>
      {icon && <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-black/5 text-xl">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{title}</span>
        {subtitle && <span className="block truncate text-xs text-muted">{subtitle}</span>}
      </span>
      {value !== undefined && <span className={`shrink-0 font-bold tabular-nums ${valueClassName}`}>{value}</span>}
    </>
  )
  const className = 'flex min-h-14 w-full items-center gap-3 px-1 py-1.5 text-left'
  return onClick ? (
    <button type="button" onClick={onClick} className={`${className} rounded-2xl active:bg-black/5`}>
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  )
}
