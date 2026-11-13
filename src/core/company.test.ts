import { describe, expect, it } from 'vitest'
import { buildCompanySeed, DEFAULT_COMPANY_NAME, SETTINGS_ID } from './company'
import { newEntity, touchEntity } from './db/entity'
import type { Profile } from './db/types'

const NOW = new Date('2026-11-13T08:00:00.000Z')
const ALL_OFFICES = ['finances', 'voyages', 'travail']

describe('newEntity / touchEntity', () => {
  it('remplit tous les champs communs', () => {
    const profile = newEntity<Profile>({ firstName: 'Alex', role: 'ceo' }, { owner: 'me', now: NOW })
    expect(profile.id).toBeTruthy()
    expect(profile.createdAt).toBe(NOW.toISOString())
    expect(profile.updatedAt).toBe(NOW.toISOString())
    expect(profile.deletedAt).toBeNull()
    expect(profile.owner).toBe('me')
    expect(profile.visibility).toBe('private')
  })

  it('met à jour updatedAt sans toucher à createdAt', () => {
    const profile = newEntity<Profile>({ firstName: 'Alex', role: 'ceo' }, { owner: 'me', now: NOW })
    const later = new Date('2026-12-01T10:00:00.000Z')
    const updated = touchEntity(profile, { firstName: 'Alex B.' }, later)
    expect(updated.firstName).toBe('Alex B.')
    expect(updated.createdAt).toBe(NOW.toISOString())
    expect(updated.updatedAt).toBe(later.toISOString())
  })
})

describe('buildCompanySeed', () => {
  const draft = {
    companyName: '  Ma Boîte  ',
    firstName: ' Alex ',
    currency: 'CHF' as const,
    enabledOfficeIds: ['finances', 'travail'],
  }

  it("crée le profil du PDG, propriétaire de toutes les données", () => {
    const seed = buildCompanySeed(draft, ALL_OFFICES, NOW)
    expect(seed.profile.firstName).toBe('Alex')
    expect(seed.profile.role).toBe('ceo')
    expect(seed.profile.owner).toBe(seed.profile.id)
    expect(seed.settings.owner).toBe(seed.profile.id)
    expect(seed.officeConfigs.every((c) => c.owner === seed.profile.id)).toBe(true)
  })

  it('enregistre les réglages avec un identifiant fixe', () => {
    const seed = buildCompanySeed(draft, ALL_OFFICES, NOW)
    expect(seed.settings.id).toBe(SETTINGS_ID)
    expect(seed.settings.companyName).toBe('Ma Boîte')
    expect(seed.settings.currency).toBe('CHF')
    expect(seed.settings.onboardingDone).toBe(true)
  })

  it('utilise le nom par défaut si le nom est vide', () => {
    const seed = buildCompanySeed({ ...draft, companyName: '   ' }, ALL_OFFICES, NOW)
    expect(seed.settings.companyName).toBe(DEFAULT_COMPANY_NAME)
  })

  it('crée tous les bureaux, dans l\'ordre, activés ou non selon le choix', () => {
    const seed = buildCompanySeed(draft, ALL_OFFICES, NOW)
    expect(seed.officeConfigs.map((c) => [c.officeId, c.enabled, c.order])).toEqual([
      ['finances', true, 0],
      ['voyages', false, 1],
      ['travail', true, 2],
    ])
  })
})
