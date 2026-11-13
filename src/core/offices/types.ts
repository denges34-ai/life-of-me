import type { ComponentType, LazyExoticComponent } from 'react'

/**
 * Contrat d'un bureau. Chaque bureau est un module autonome dans `src/offices/<id>/`
 * qui exporte un objet de ce type, puis s'ajoute à `officeRegistry`.
 *
 * Le contrat s'étoffera en phase 1 (décor 3D, badge, chiffres clés, échéances),
 * sans changer ce qui existe déjà.
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
  /** Phase du projet à laquelle le bureau ouvre. */
  phase: 1 | 2
  /** Écran 2D du bureau. Absent tant que le bureau est « en travaux ». */
  Screen?: LazyExoticComponent<ComponentType>
}
