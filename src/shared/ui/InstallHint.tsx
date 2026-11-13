import { isIOS, useInstallStore } from '../../core/pwa/install'
import { Button } from './Button'

/** Carte qui explique comment installer l'appli. Disparaît une fois l'appli installée. */
export function InstallHint() {
  const { installed, promptEvent, install } = useInstallStore()
  if (installed) return null

  return (
    <section className="rounded-3xl bg-brand-100 p-5">
      <h2 className="text-base font-bold">📲 Installer l'appli</h2>
      {promptEvent ? (
        <>
          <p className="mt-1 text-sm text-muted">Ajoute Life of Me à ton écran d'accueil, en plein écran.</p>
          <Button className="mt-3 w-full" onClick={() => void install()}>
            Installer
          </Button>
        </>
      ) : isIOS() ? (
        <p className="mt-1 text-sm text-muted">
          Dans <strong>Safari</strong> : touche le bouton <strong>Partager</strong>, puis{' '}
          <strong>« Sur l'écran d'accueil »</strong>.
        </p>
      ) : (
        <p className="mt-1 text-sm text-muted">
          Ouvre le menu <strong>⋮</strong> du navigateur, puis <strong>« Installer l'application »</strong> ou{' '}
          <strong>« Ajouter à l'écran d'accueil »</strong>.
        </p>
      )}
    </section>
  )
}
