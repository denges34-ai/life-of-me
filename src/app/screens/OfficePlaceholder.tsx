import type { OfficeModule } from '../../core/offices/types'
import { OfficeLayout } from '../../shared/ui/OfficeLayout'

/** Écran d'un bureau pas encore construit : « en travaux ». */
export function OfficePlaceholder({ office }: { office: OfficeModule }) {
  return (
    <OfficeLayout color={office.color} icon={office.icon} title={office.defaultName} subtitle={office.tagline}>
      <div className="grid flex-1 place-items-center px-6 py-16 text-center">
        <div>
          <div className="text-5xl">🚧</div>
          <h2 className="mt-3 text-xl font-bold">Bureau en travaux</h2>
          <p className="mt-1 text-muted">Les ouvriers arrivent : ce bureau ouvre à la phase {office.phase}.</p>
        </div>
      </div>
    </OfficeLayout>
  )
}
