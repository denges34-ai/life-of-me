import Dexie, { type EntityTable } from 'dexie'
import type { AppSettings, OfficeConfig, Profile } from './types'

/**
 * Base de données locale (IndexedDB).
 *
 * RÈGLE D'OR : ne jamais modifier une version existante. Pour changer le schéma,
 * ajouter un nouveau bloc `this.version(n + 1)` (avec `.upgrade()` si besoin) :
 * c'est ce qui garantit qu'aucune donnée n'est perdue lors d'une mise à jour.
 */
export class LifeOfMeDB extends Dexie {
  profiles!: EntityTable<Profile, 'id'>
  settings!: EntityTable<AppSettings, 'id'>
  officeConfigs!: EntityTable<OfficeConfig, 'id'>

  constructor() {
    super('life-of-me')

    // v1 — phase 0 : profil, réglages, configuration des bureaux.
    this.version(1).stores({
      profiles: 'id',
      settings: 'id',
      officeConfigs: 'id, officeId, order',
    })
  }
}

export const db = new LifeOfMeDB()
