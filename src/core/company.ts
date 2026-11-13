import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db/db'
import { newEntity } from './db/entity'
import type { AppSettings, CurrencyCode, OfficeConfig, Profile } from './db/types'

export const SETTINGS_ID = 'app'
export const DEFAULT_COMPANY_NAME = 'Life of Me'

/** Ce que l'onboarding récolte. */
export interface OnboardingDraft {
  companyName: string
  firstName: string
  currency: CurrencyCode
  enabledOfficeIds: string[]
}

export interface CompanySeed {
  profile: Profile
  settings: AppSettings
  officeConfigs: OfficeConfig[]
}

/**
 * Transforme les réponses de l'onboarding en données prêtes à enregistrer.
 * Fonction pure (pas d'accès à la base) pour être testée facilement.
 *
 * `allOfficeIds` : tous les bureaux du registre, dans l'ordre par défaut.
 * Les bureaux non choisis sont créés désactivés, pour pouvoir les activer plus tard.
 */
export function buildCompanySeed(
  draft: OnboardingDraft,
  allOfficeIds: string[],
  now: Date = new Date(),
): CompanySeed {
  const profile = newEntity<Profile>({ firstName: draft.firstName.trim(), role: 'ceo' }, { owner: '', now })
  // Le PDG est propriétaire de son propre profil.
  profile.owner = profile.id
  const owner = profile.id

  const settings = newEntity<AppSettings>(
    {
      companyName: draft.companyName.trim() || DEFAULT_COMPANY_NAME,
      currency: draft.currency,
      onboardingDone: true,
      sceneMode: '3d',
      lastBackupAt: null,
    },
    { owner, id: SETTINGS_ID, now },
  )

  const officeConfigs = allOfficeIds.map((officeId, order) =>
    newEntity<OfficeConfig>(
      { officeId, enabled: draft.enabledOfficeIds.includes(officeId), customName: null, order },
      { owner, now },
    ),
  )

  return { profile, settings, officeConfigs }
}

/** Enregistre l'entreprise à la fin de l'onboarding (tout ou rien). */
export async function completeOnboarding(draft: OnboardingDraft, allOfficeIds: string[]): Promise<void> {
  const seed = buildCompanySeed(draft, allOfficeIds)
  await db.transaction('rw', db.profiles, db.settings, db.officeConfigs, async () => {
    await db.profiles.clear()
    await db.officeConfigs.clear()
    await db.profiles.add(seed.profile)
    await db.officeConfigs.bulkAdd(seed.officeConfigs)
    await db.settings.put(seed.settings)
  })
  // Demande au navigateur de ne pas effacer les données locales s'il manque de place.
  void navigator.storage?.persist?.().catch(() => false)
}

/** Efface toutes les données locales : l'appli repart de l'onboarding. */
export async function resetApp(): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((table) => table.clear()))
  })
}

/** Réglages de l'appli. `undefined` = chargement en cours, `null` = pas encore d'entreprise. */
export function useSettings(): AppSettings | null | undefined {
  return useLiveQuery(async () => (await db.settings.get(SETTINGS_ID)) ?? null, [], undefined)
}

/** Profil du PDG. */
export function useCeoProfile(): Profile | undefined {
  return useLiveQuery(async () => (await db.profiles.toArray()).find((p) => p.role === 'ceo'), [], undefined)
}

/** Bureaux activés, dans l'ordre choisi. */
export function useEnabledOfficeConfigs(): OfficeConfig[] | undefined {
  return useLiveQuery(
    async () => (await db.officeConfigs.orderBy('order').toArray()).filter((c) => c.enabled && !c.deletedAt),
    [],
    undefined,
  )
}
