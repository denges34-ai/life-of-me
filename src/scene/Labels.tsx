import type { OfficeModule } from '../core/offices/types'
import { useOfficeSummary } from '../core/offices/useOfficeSummary'

// Étiquettes des bureaux : du HTML ordinaire posé par-dessus la scène 3D.
// La scène (OpenSpace.tsx) déplace chaque étiquette à chaque image pour qu'elle suive son bureau.

/** Les éléments HTML des étiquettes, retrouvés par identifiant de bureau. */
export type LabelRegistry = Map<string, HTMLDivElement>

type Register = (id: string, element: HTMLDivElement | null) => void

interface DeskLabelProps {
  id: string
  name: string
  icon: string
  color: string
  badge?: string | null
  deskLabel?: string | null
  underConstruction?: boolean
  /** Afficher le nom à côté de l'icône (quand on a assez zoomé pour que ça tienne). */
  showName: boolean
  register: Register
}

/** Icône, nom, compte à rebours ou montant, et badge d'un bureau. */
export function DeskLabel({ id, name, icon, color, badge, deskLabel, underConstruction, showName, register }: DeskLabelProps) {
  return (
    <div
      ref={(element) => register(id, element)}
      // Invisible tant que la scène ne l'a pas placée (évite un flash dans le coin de l'écran).
      className="absolute left-0 top-0 opacity-0 will-change-transform"
    >
      <div className={`relative flex flex-col items-center whitespace-nowrap ${underConstruction ? 'opacity-80' : ''}`}>
        <div
          className={`flex h-8 items-center gap-1 rounded-full bg-white text-xs font-bold text-ink shadow-md ${showName ? 'px-2.5' : 'w-8 justify-center'}`}
          aria-label={name}
        >
          <span className="text-base leading-none">{icon}</span>
          {showName && name}
          {showName && underConstruction && <span>🚧</span>}
        </div>
        {deskLabel && (
          <div className="mt-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold text-white shadow" style={{ backgroundColor: color }}>
            {deskLabel}
          </div>
        )}
        {badge && (
          <div className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[11px] font-extrabold text-white shadow">
            {badge}
          </div>
        )}
      </div>
    </div>
  )
}

/** Étiquette d'un bureau, reliée au résumé « vivant » de son module. */
export function OfficeLabel({
  entry,
  showName,
  register,
}: {
  entry: { office: OfficeModule; name: string }
  showName: boolean
  register: Register
}) {
  const summary = useOfficeSummary(entry.office)
  return (
    <DeskLabel
      id={entry.office.id}
      name={entry.name}
      icon={entry.office.icon}
      color={entry.office.color}
      badge={summary.badge}
      deskLabel={summary.deskLabel}
      underConstruction={!entry.office.Screen}
      showName={showName}
      register={register}
    />
  )
}
