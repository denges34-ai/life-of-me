import { create } from 'zustand'
import { DEFAULT_COMPANY_NAME, type OnboardingDraft } from '../core/company'
import type { CurrencyCode } from '../core/db/types'
import { officeRegistry } from '../offices/registry'

export const ONBOARDING_STEPS = 4

interface OnboardingState extends OnboardingDraft {
  step: number
  setCompanyName: (value: string) => void
  setFirstName: (value: string) => void
  setCurrency: (value: CurrencyCode) => void
  toggleOffice: (officeId: string) => void
  next: () => void
  back: () => void
  reset: () => void
}

const initialDraft = (): OnboardingDraft & { step: number } => ({
  step: 0,
  companyName: DEFAULT_COMPANY_NAME,
  firstName: '',
  currency: 'CHF',
  // Tous les bureaux sont cochés par défaut.
  enabledOfficeIds: officeRegistry.map((office) => office.id),
})

/** Brouillon de l'onboarding : rien n'est écrit en base avant la dernière étape. */
export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initialDraft(),
  setCompanyName: (companyName) => set({ companyName }),
  setFirstName: (firstName) => set({ firstName }),
  setCurrency: (currency) => set({ currency }),
  toggleOffice: (officeId) =>
    set((state) => ({
      enabledOfficeIds: state.enabledOfficeIds.includes(officeId)
        ? state.enabledOfficeIds.filter((id) => id !== officeId)
        : [...state.enabledOfficeIds, officeId],
    })),
  next: () => set((state) => ({ step: Math.min(state.step + 1, ONBOARDING_STEPS - 1) })),
  back: () => set((state) => ({ step: Math.max(state.step - 1, 0) })),
  reset: () => set(initialDraft()),
}))
