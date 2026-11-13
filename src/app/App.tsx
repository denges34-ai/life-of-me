import { Suspense, useEffect, type ReactNode } from 'react'
import { HashRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { useSettings } from '../core/company'
import { toISODate } from '../core/format'
import { getOffice, startOffices } from '../offices/registry'
import { CeoRoom } from './screens/CeoRoom'
import { Home } from './screens/Home'
import { OfficePlaceholder } from './screens/OfficePlaceholder'
import { Onboarding } from './screens/Onboarding'
import { Settings } from './screens/Settings'

/** Écran d'attente très court (lecture de la base locale, chargement d'un bureau). */
export function Splash() {
  return (
    <div className="grid h-full place-items-center">
      <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" className="h-20 w-20 animate-pulse rounded-3xl" />
    </div>
  )
}

/** Ouvre l'écran d'un bureau à partir du registre. Le routage ne connaît aucun bureau en particulier. */
function OfficeRoute() {
  const { officeId } = useParams()
  const office = getOffice(officeId)
  if (!office) return <Navigate to="/" replace />
  if (!office.Screen) return <OfficePlaceholder office={office} />
  return (
    <Suspense fallback={<Splash />}>
      <office.Screen />
    </Suspense>
  )
}

export function App() {
  const settings = useSettings()
  const ready = settings?.onboardingDone === true

  // À l'ouverture, et à chaque retour sur l'appli : chaque bureau fait ses tâches du jour
  // (par exemple, Finances ajoute les récurrents arrivés à échéance).
  useEffect(() => {
    if (!ready) return
    const run = () => {
      if (document.visibilityState === 'visible') void startOffices(toISODate())
    }
    run()
    document.addEventListener('visibilitychange', run)
    return () => document.removeEventListener('visibilitychange', run)
  }, [ready])

  if (settings === undefined) return <Splash />

  // Tant que l'entreprise n'existe pas, tout mène à l'onboarding.
  const guarded = (element: ReactNode) => (ready ? element : <Navigate to="/bienvenue" replace />)

  return (
    // Routage par « # » : compatible GitHub Pages et hors ligne, sans configuration serveur.
    <HashRouter>
      <Routes>
        <Route path="/bienvenue" element={ready ? <Navigate to="/" replace /> : <Onboarding />} />
        <Route path="/" element={guarded(<Home />)} />
        <Route path="/pdg" element={guarded(<CeoRoom />)} />
        <Route path="/bureau/:officeId/*" element={guarded(<OfficeRoute />)} />
        <Route path="/reglages" element={guarded(<Settings />)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
