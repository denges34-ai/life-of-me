import { Link, Navigate, useParams } from 'react-router-dom'
import { getOffice } from '../../offices/registry'

/** Écran d'un bureau pas encore construit : « en travaux ». */
export function OfficePlaceholder() {
  const { officeId } = useParams()
  const office = getOffice(officeId)
  if (!office) return <Navigate to="/" replace />

  return (
    <div className="flex min-h-full flex-col">
      <header className="safe-top rounded-b-[2rem] px-5 pb-8 text-white" style={{ backgroundColor: office.color }}>
        <Link
          to="/"
          aria-label="Retour à l'open space"
          className="grid h-12 w-12 place-items-center rounded-2xl bg-white/20 text-2xl active:bg-white/30"
        >
          ←
        </Link>
        <div className="mt-4 text-5xl">{office.icon}</div>
        <h1 className="mt-2 text-3xl font-extrabold">{office.defaultName}</h1>
        <p className="text-white/85">{office.tagline}</p>
      </header>

      <main className="safe-bottom grid flex-1 place-items-center px-8 text-center">
        <div>
          <div className="text-5xl">🚧</div>
          <h2 className="mt-3 text-xl font-bold">Bureau en travaux</h2>
          <p className="mt-1 text-muted">Les ouvriers arrivent : ce bureau ouvre à la phase {office.phase}.</p>
        </div>
      </main>
    </div>
  )
}
