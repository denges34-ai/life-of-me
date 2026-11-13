import type { EntityTable, Table } from 'dexie'
import { db, SETTINGS_ID } from './db'
import { newEntity, type EntityData } from './entity'
import type { BaseEntity, Visibility } from './types'

// Fonctions communes d'écriture : tous les bureaux passent par ici, ce qui garantit
// que chaque ligne porte bien id, dates, propriétaire et visibilité.

type AnyTable<T extends BaseEntity> = EntityTable<T, 'id'>
const raw = <T extends BaseEntity>(table: AnyTable<T>) => table as unknown as Table<BaseEntity, string>

/** Identifiant du PDG, propriétaire des données créées sur cet appareil. */
export async function getOwnerId(): Promise<string> {
  const settings = await db.settings.get(SETTINGS_ID)
  if (!settings) throw new Error("L'entreprise n'est pas encore créée.")
  return settings.owner
}

export async function createIn<T extends BaseEntity>(
  table: AnyTable<T>,
  data: EntityData<T>,
  visibility: Visibility = 'private',
): Promise<T> {
  const entity = newEntity<T>(data, { owner: await getOwnerId(), visibility })
  await raw(table).add(entity)
  return entity
}

export async function updateIn<T extends BaseEntity>(
  table: AnyTable<T>,
  id: string,
  changes: Partial<EntityData<T>>,
): Promise<void> {
  await raw(table).update(id, { ...changes, updatedAt: new Date().toISOString() })
}

/** Suppression douce : la ligne est marquée supprimée (utile pour la synchro de la phase 3). */
export async function removeIn<T extends BaseEntity>(table: AnyTable<T>, id: string): Promise<void> {
  const now = new Date().toISOString()
  await raw(table).update(id, { deletedAt: now, updatedAt: now })
}

/** Ne garde que les lignes non supprimées. */
export function alive<T extends BaseEntity>(rows: T[]): T[] {
  return rows.filter((row) => !row.deletedAt)
}
