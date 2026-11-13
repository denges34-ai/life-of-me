import { useEffect, type ReactNode } from 'react'

interface SheetProps {
  title: string
  onClose: () => void
  children: ReactNode
}

/** Feuille qui monte du bas de l'écran : tous les formulaires de l'appli s'ouvrent dedans. */
export function Sheet({ title, onClose, children }: SheetProps) {
  // Fermeture avec la touche Échap (pratique sur ordinateur).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Fermer" className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="sheet-in safe-bottom relative mx-auto max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-[2rem] bg-cream px-5 pt-3 shadow-2xl">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-black/15" />
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-extrabold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="grid h-11 w-11 place-items-center rounded-full bg-black/5 text-lg active:bg-black/10"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
