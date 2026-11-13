import { Link } from 'react-router-dom'
import { resetApp, useCeoProfile, useSettings } from '../../core/company'
import { CURRENCIES, formatDate } from '../../core/format'
import { Button } from '../../shared/ui/Button'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-4 px-4">
      <span className="text-muted">{label}</span>
      <span className="truncate font-semibold">{value}</span>
    </div>
  )
}

/** Réglages (version minimale de la phase 0). */
export function Settings() {
  const settings = useSettings()
  const profile = useCeoProfile()
  const currency = CURRENCIES.find((c) => c.code === settings?.currency)

  async function handleReset() {
    const confirmed = window.confirm(
      "Tout effacer et recommencer ? Toutes les données de l'appli sur cet appareil seront supprimées.",
    )
    if (confirmed) await resetApp()
  }

  return (
    <div className="safe-top safe-bottom mx-auto flex min-h-full max-w-md flex-col gap-5 px-5">
      <header className="flex items-center gap-3">
        <Link
          to="/"
          aria-label="Retour"
          className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-2xl shadow-sm ring-1 ring-black/10 active:bg-black/5"
        >
          ←
        </Link>
        <h1 className="text-2xl font-extrabold">Réglages</h1>
      </header>

      <section className="divide-y divide-black/5 rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
        <Row label="Entreprise" value={settings?.companyName ?? ''} />
        <Row label="PDG" value={profile?.firstName ?? ''} />
        <Row label="Devise" value={currency ? `${currency.label} (${currency.code})` : ''} />
        <Row label="Fondée le" value={settings ? formatDate(settings.createdAt) : ''} />
      </section>

      <p className="px-1 text-sm text-muted">
        🔒 Tes données restent sur cet appareil. Rien n'est envoyé ailleurs.
      </p>

      <div className="mt-auto flex flex-col gap-3">
        <Button variant="danger" onClick={() => void handleReset()}>
          Tout effacer et recommencer
        </Button>
        <p className="text-center text-xs text-muted">Life of Me · version {__APP_VERSION__}</p>
      </div>
    </div>
  )
}
