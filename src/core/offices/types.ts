import type { ComponentType, LazyExoticComponent } from 'react'
import type { CurrencyCode } from '../db/types'

/** État visuel d'un bureau dans l'open space. */
export type OfficeState =
  /** Tout va bien : bureau rangé. */
  | 'ok'
  /** Des choses s'accumulent : papiers en désordre. */
  | 'busy'
  /** Il faut regarder : voyant rouge. */
  | 'alert'

export interface KeyFigure {
  label: string
  value: string
}

/** Ce qu'un bureau raconte au reste de l'appli (open space, Salle du PDG). */
export interface OfficeSummary {
  state: OfficeState
  /** Petit badge au-dessus du bureau quand il y a quelque chose à faire (ex. « 2 »). */
  badge: string | null
  /** Texte court affiché sur le bureau 3D (ex. compte à rebours « J-12 »). */
  deskLabel: string | null
  /** 2-3 chiffres clés. */
  keyFigures: KeyFigure[]
  /** Lignes pour la « réunion du matin ». */
  briefing: string[]
}

export interface SummaryContext {
  /** Date du jour, AAAA-MM-JJ. */
  today: string
  currency: CurrencyCode
}

/** Objet décoratif qui rend le bureau reconnaissable en 3D. */
export type DeskDecor = 'safe' | 'globe' | 'plant' | 'dumbbell' | 'briefcase' | 'target' | 'calendar'

/**
 * Contrat d'un bureau. Chaque bureau est un module autonome dans `src/offices/<id>/`
 * qui exporte un objet de ce type, puis s'ajoute à `officeRegistry`.
 * L'open space, la Salle du PDG et le routage ne connaissent que ce contrat.
 */
export interface OfficeModule {
  /** Identifiant stable, utilisé dans les URL et en base de données. */
  id: string
  defaultName: string
  /** Emoji affiché sur la carte et au-dessus du bureau 3D. */
  icon: string
  /** Couleur du bureau (hex), reprise dans son écran 2D. */
  color: string
  tagline: string
  decor: DeskDecor
  /** Phase du projet à laquelle le bureau ouvre. */
  phase: 1 | 2
  /** Écran 2D du bureau (chargé à la demande). Absent tant que le bureau est « en travaux ». */
  Screen?: LazyExoticComponent<ComponentType>
  /**
   * Résumé du bureau. Lit la base de données : appelé dans une requête « live »,
   * il se recalcule tout seul quand les données changent.
   */
  getSummary?: (context: SummaryContext) => Promise<OfficeSummary>
  /**
   * Tâches du bureau à l'ouverture de l'appli (données par défaut, échéances du jour…).
   * Doit pouvoir être relancé sans risque.
   */
  onStart?: (today: string) => Promise<void>
}

export const EMPTY_SUMMARY: OfficeSummary = {
  state: 'ok',
  badge: null,
  deskLabel: null,
  keyFigures: [],
  briefing: [],
}
