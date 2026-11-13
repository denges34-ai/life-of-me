// Bus d'événements de l'appli.
// Les bureaux annoncent ce qui se passe (« une dépense a été ajoutée ») sans savoir qui écoute.
// En phase 2, la gamification s'y branchera pour distribuer l'XP.

export type AppEventType =
  | 'transaction.added'
  | 'savings.contributed'
  | 'trip.created'
  | 'trip.packingItemChecked'
  | 'trip.itineraryItemAdded'

export interface AppEvent {
  type: AppEventType
  at: string
}

type Listener = (event: AppEvent) => void

const listeners = new Set<Listener>()

export function emitEvent(type: AppEventType): void {
  const event: AppEvent = { type, at: new Date().toISOString() }
  listeners.forEach((listener) => listener(event))
}

/** S'abonne aux événements. Renvoie la fonction de désabonnement. */
export function onEvent(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
