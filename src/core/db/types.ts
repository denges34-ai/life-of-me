// Types communs à toutes les données de l'appli.

/** Qui peut voir une donnée : moi seul, ou nous deux (mode associée, phase 3). */
export type Visibility = 'private' | 'shared'

/** Champs présents sur CHAQUE entité enregistrée. */
export interface BaseEntity {
  id: string
  /** Dates au format ISO complet (ex. 2026-11-13T08:30:00.000Z). */
  createdAt: string
  updatedAt: string
  /** Suppression douce : on garde la ligne pour pouvoir synchroniser plus tard. */
  deletedAt: string | null
  /** Identifiant du profil propriétaire. */
  owner: string
  visibility: Visibility
}

/** Dans les données, « me » désigne le PDG (participant d'un voyage, payeur d'une dépense). */
export const ME = 'me'

export type CurrencyCode = 'CHF' | 'EUR' | 'USD' | 'GBP' | 'CAD'

/** Une personne de l'entreprise : le PDG, puis l'associée en phase 3. */
export interface Profile extends BaseEntity {
  firstName: string
  role: 'ceo' | 'partner'
}

/** Réglages de l'appli (une seule ligne, id = "app"). */
export interface AppSettings extends BaseEntity {
  companyName: string
  currency: CurrencyCode
  onboardingDone: boolean
  /** Open space en 3D ou liste de cartes (mode de secours). */
  sceneMode: '3d' | '2d'
  lastBackupAt: string | null
}

/** Configuration d'un bureau : activé ou non, renommé, position dans l'open space. */
export interface OfficeConfig extends BaseEntity {
  officeId: string
  enabled: boolean
  customName: string | null
  order: number
}
