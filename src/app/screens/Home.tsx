import { Link } from 'react-router-dom'
import { useCeoProfile, useEnabledOfficeConfigs, useSettings } from '../../core/company'
import { getOffice } from '../../offices/registry'
import { InstallHint } from '../../shared/ui/InstallHint'

/**
 * Accueil provisoire (phase 0) : les bureaux sous forme de cartes.
 * L'open space 3D le remplacera en phase 1 ; cette liste deviendra le mode 2D de secours.
 */
export function Home() {
  const settings = useSettings()
  const profile = useCeoProfile()
  const officeConfigs = useEnabledOfficeConfigs()

  return (
    <div className="safe-top safe-bottom mx-auto flex min-h-full max-w-md flex-col gap-5 px-5">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-muted">Bonjour {profile?.firstName ?? ''} 👋</p>
          <h1 className="truncate text-2xl font-extrabold">{settings?.companyName}</h1>
          <p className="mt-1 inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-600">
            🌱 Start-up
          </p>
        </div>
        <Link
          to="/reglages"
          aria-label="Réglages"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-xl shadow-sm ring-1 ring-black/10 active:bg-black/5"
        >
          ⚙️
        </Link>
      </header>

      <InstallHint />

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Tes bureaux</h2>
        <div className="grid grid-cols-2 gap-3">
          {officeConfigs?.map((config) => {
            const office = getOffice(config.officeId)
            if (!office) return null
            return (
              <Link
                key={config.id}
                to={`/bureau/${office.id}`}
                className="pop-in min-h-28 rounded-3xl p-4 text-white shadow-md transition active:scale-[0.97]"
                style={{ backgroundColor: office.color }}
              >
                <div className="text-3xl">{office.icon}</div>
                <div className="mt-2 font-bold">{config.customName ?? office.defaultName}</div>
                <div className="text-xs text-white/80">{office.tagline}</div>
              </Link>
            )
          })}
        </div>
      </section>

      <p className="mt-auto text-center text-xs text-muted">
        🚧 L'open space 3D arrive à la prochaine étape.
      </p>
    </div>
  )
}
