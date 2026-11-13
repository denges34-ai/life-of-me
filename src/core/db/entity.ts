import type { BaseEntity, Visibility } from './types'

/** Génère un identifiant unique (avec repli si randomUUID n'est pas disponible). */
export function newId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

/** Les champs métier d'une entité, sans les champs communs. */
export type EntityData<T extends BaseEntity> = Omit<T, keyof BaseEntity>

interface NewEntityOptions {
  owner: string
  id?: string
  visibility?: Visibility
  now?: Date
}

/** Crée une entité complète en remplissant tous les champs communs. */
export function newEntity<T extends BaseEntity>(data: EntityData<T>, options: NewEntityOptions): T {
  const timestamp = (options.now ?? new Date()).toISOString()
  const base: BaseEntity = {
    id: options.id ?? newId(),
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
    owner: options.owner,
    visibility: options.visibility ?? 'private',
  }
  return { ...data, ...base } as T
}

/** Applique des changements et met à jour `updatedAt` (jamais `id`, `createdAt`, `owner`). */
export function touchEntity<T extends BaseEntity>(
  entity: T,
  changes: Partial<Omit<T, 'id' | 'createdAt' | 'owner'>>,
  now: Date = new Date(),
): T {
  return { ...entity, ...changes, updatedAt: now.toISOString() }
}
