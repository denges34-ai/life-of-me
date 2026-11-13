import { create } from 'zustand'

/** Événement d'installation fourni par Chrome/Android (absent des types standards). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface InstallState {
  /** Présent uniquement si le navigateur propose l'installation en un clic. */
  promptEvent: BeforeInstallPromptEvent | null
  installed: boolean
  install: () => Promise<void>
}

/** Vrai si l'appli tourne déjà en plein écran depuis l'écran d'accueil. */
export function isStandalone(): boolean {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true
  return iosStandalone || window.matchMedia('(display-mode: standalone)').matches
}

/** iPhone / iPad : pas d'installation en un clic, il faut passer par le menu Partager. */
export function isIOS(): boolean {
  const ua = navigator.userAgent
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1)
}

export const useInstallStore = create<InstallState>((set, get) => ({
  promptEvent: null,
  installed: isStandalone(),
  install: async () => {
    const event = get().promptEvent
    if (!event) return
    await event.prompt()
    const choice = await event.userChoice
    set({ promptEvent: null, installed: choice.outcome === 'accepted' })
  },
}))

window.addEventListener('beforeinstallprompt', (event) => {
  // On garde l'événement pour afficher notre propre bouton « Installer ».
  event.preventDefault()
  useInstallStore.setState({ promptEvent: event as BeforeInstallPromptEvent })
})

window.addEventListener('appinstalled', () => {
  useInstallStore.setState({ promptEvent: null, installed: true })
})
