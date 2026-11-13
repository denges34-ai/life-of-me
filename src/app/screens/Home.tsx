import { Component, lazy, Suspense, useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCeoProfile, useEnabledOfficeConfigs, useSettings } from '../../core/company'
import type { OfficeModule } from '../../core/offices/types'
import { useOfficeSummary } from '../../core/offices/useOfficeSummary'
import { useInstallStore } from '../../core/pwa/install'
import { getOffice } from '../../offices/registry'
import { InstallHint } from '../../shared/ui/InstallHint'
import { Splash } from '../App'

// La 3D est chargée à la demande : l'appli démarre vite, même sur un téléphone modeste.
const OpenSpace = lazy(() => import('../../scene/OpenSpace'))

interface HomeOffice {
  office: OfficeModule
  name: string
}

/** Si la 3D plante (vieux téléphone, WebGL indisponible), on bascule sur les cartes sans rien casser. */
class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onError()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

function webglAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

const iconButtonClass =
  'grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/90 text-xl shadow-md ring-1 ring-black/10 backdrop-blur active:bg-white'

/** Accueil : l'open space 3D, ou la liste de cartes en mode 2D de secours. */
export function Home() {
  const settings = useSettings()
  const profile = useCeoProfile()
  const configs = useEnabledOfficeConfigs()
  const navigate = useNavigate()
  const installed = useInstallStore((state) => state.installed)
  const [sceneFailed, setSceneFailed] = useState(false)
  const canRender3D = useMemo(webglAvailable, [])

  const offices: HomeOffice[] = useMemo(
    () =>
      (configs ?? []).flatMap((config) => {
        const office = getOffice(config.officeId)
        return office ? [{ office, name: config.customName ?? office.defaultName }] : []
      }),
    [configs],
  )

  if (!settings || !configs) return <Splash />

  const use3D = settings.sceneMode === '3d' && canRender3D && !sceneFailed
  const open = (target: string) => navigate(target === 'pdg' ? '/pdg' : `/bureau/${target}`)

  const header = (
    <header className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-muted">Bonjour {profile?.firstName ?? ''} 👋</p>
        <h1 className="truncate text-2xl font-extrabold">{settings.companyName}</h1>
        <p className="mt-1 inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-600">🌱 Start-up</p>
      </div>
      <Link to="/reglages" aria-label="Réglages" className={iconButtonClass}>
        ⚙️
      </Link>
    </header>
  )

  if (use3D) {
    return (
      <div className="relative h-full overflow-hidden">
        <SceneBoundary onError={() => setSceneFailed(true)}>
          <Suspense fallback={<Splash />}>
            <OpenSpace offices={offices} onOpen={open} />
          </Suspense>
        </SceneBoundary>

        {/* Interface posée par-dessus la scène : elle ne bloque pas les gestes sur la 3D. */}
        <div className="safe-top pointer-events-none absolute inset-x-0 top-0 mx-auto max-w-md px-5">
          <div className="pointer-events-auto rounded-3xl bg-cream/85 p-3 shadow-sm backdrop-blur">{header}</div>
          {!installed && (
            <Link
              to="/reglages"
              className="pointer-events-auto mt-2 inline-flex min-h-11 items-center rounded-full bg-white/90 px-4 text-sm font-bold shadow-md ring-1 ring-black/10"
            >
              📲 Installer l'appli
            </Link>
          )}
        </div>

        <div className="safe-bottom pointer-events-none absolute inset-x-0 bottom-0 mx-auto flex max-w-md flex-col items-center gap-2 px-5">
          <p className="rounded-full bg-black/35 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            Touche un bureau · glisse pour tourner · pince pour zoomer
          </p>
          <Link
            to="/pdg"
            className="pointer-events-auto flex min-h-14 w-full items-center justify-center rounded-2xl bg-ink text-base font-bold text-white shadow-xl active:scale-[0.98]"
          >
            👔 Salle du PDG
          </Link>
        </div>
      </div>
    )
  }

  // Mode 2D : les mêmes bureaux, sous forme de cartes.
  return (
    <div className="safe-top safe-bottom mx-auto flex min-h-full max-w-md flex-col gap-5 px-5">
      {header}
      <InstallHint />

      <Link to="/pdg" className="flex min-h-16 items-center gap-3 rounded-3xl bg-ink px-5 text-white shadow-md active:scale-[0.98]">
        <span className="text-3xl">👔</span>
        <span>
          <span className="block font-bold">Salle du PDG</span>
          <span className="block text-xs text-white/75">Réunion du matin et chiffres clés</span>
        </span>
      </Link>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Tes bureaux</h2>
        <div className="grid grid-cols-2 gap-3">
          {offices.map((entry) => (
            <OfficeCard key={entry.office.id} entry={entry} />
          ))}
        </div>
      </section>
    </div>
  )
}

/** Carte d'un bureau en mode 2D, avec son badge et son texte court (compte à rebours, montant). */
function OfficeCard({ entry: { office, name } }: { entry: HomeOffice }) {
  const summary = useOfficeSummary(office)
  return (
    <Link
      to={`/bureau/${office.id}`}
      className="pop-in relative min-h-28 rounded-3xl p-4 text-white shadow-md transition active:scale-[0.97]"
      style={{ backgroundColor: office.color }}
    >
      {summary.badge && (
        <span className="absolute right-3 top-3 grid h-6 min-w-6 place-items-center rounded-full bg-white px-1.5 text-xs font-extrabold text-red-600">
          {summary.badge}
        </span>
      )}
      <div className="text-3xl">{office.icon}</div>
      <div className="mt-2 font-bold">{name}</div>
      <div className="text-xs text-white/80">{summary.deskLabel ?? (office.Screen ? office.tagline : '🚧 En travaux')}</div>
    </Link>
  )
}
