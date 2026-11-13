import type { ReactNode } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useSettings } from '../core/company'
import { Home } from './screens/Home'
import { OfficePlaceholder } from './screens/OfficePlaceholder'
import { Onboarding } from './screens/Onboarding'
import { Settings } from './screens/Settings'

/** Écran d'attente très court, le temps de lire la base locale. */
function Splash() {
  return (
    <div className="grid h-full place-items-center">
      <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" className="h-20 w-20 animate-pulse rounded-3xl" />
    </div>
  )
}

export function App() {
  const settings = useSettings()
  if (settings === undefined) return <Splash />

  const ready = settings?.onboardingDone === true
  // Tant que l'entreprise n'existe pas, tout mène à l'onboarding.
  const guarded = (element: ReactNode) => (ready ? element : <Navigate to="/bienvenue" replace />)

  return (
    // Routage par « # » : compatible GitHub Pages et hors ligne, sans configuration serveur.
    <HashRouter>
      <Routes>
        <Route path="/bienvenue" element={ready ? <Navigate to="/" replace /> : <Onboarding />} />
        <Route path="/" element={guarded(<Home />)} />
        <Route path="/bureau/:officeId" element={guarded(<OfficePlaceholder />)} />
        <Route path="/reglages" element={guarded(<Settings />)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
