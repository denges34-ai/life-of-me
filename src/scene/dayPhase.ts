// Cycle jour / nuit de l'open space, selon l'heure réelle.

export interface DayPhase {
  name: 'morning' | 'day' | 'evening' | 'night'
  /** Couleur du ciel (fond de la scène). */
  sky: string
  ambientColor: string
  ambient: number
  sunColor: string
  sun: number
  sunPosition: [number, number, number]
  /** Les lampes de bureau sont allumées. */
  lampsOn: boolean
}

const PHASES: Record<DayPhase['name'], DayPhase> = {
  // Lumière douce et chaude le matin.
  morning: { name: 'morning', sky: '#ffeedd', ambientColor: '#fff1e0', ambient: 2.1, sunColor: '#ffd9a8', sun: 2.4, sunPosition: [-5, 8, 6], lampsOn: false },
  day: { name: 'day', sky: '#e3f3ff', ambientColor: '#ffffff', ambient: 2.4, sunColor: '#ffffff', sun: 2.8, sunPosition: [4, 11, 5], lampsOn: false },
  // Fin de journée orangée : les lampes s'allument.
  evening: { name: 'evening', sky: '#eda982', ambientColor: '#ffd9b8', ambient: 1.8, sunColor: '#ff9d5c', sun: 2.0, sunPosition: [8, 4, 2], lampsOn: true },
  night: { name: 'night', sky: '#1d1d3d', ambientColor: '#8f97e8', ambient: 1.5, sunColor: '#9fb1ff', sun: 0.7, sunPosition: [-4, 9, 5], lampsOn: true },
}

/** Ambiance lumineuse pour une heure donnée (0 à 23). */
export function getDayPhase(hour: number): DayPhase {
  if (hour >= 6 && hour < 10) return PHASES.morning
  if (hour >= 10 && hour < 17) return PHASES.day
  if (hour >= 17 && hour < 21) return PHASES.evening
  return PHASES.night
}
