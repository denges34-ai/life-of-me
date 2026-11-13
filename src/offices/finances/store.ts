import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { monthOf } from '../../core/dates'
import { toISODate } from '../../core/format'

export type FinanceTab = 'apercu' | 'mouvements' | 'budgets' | 'comptes' | 'objectifs'

interface FinanceUiState {
  tab: FinanceTab
  /** Mois affiché (AAAA-MM). */
  month: string
  /** Derniers choix, proposés par défaut à la prochaine saisie. */
  lastExpenseCategoryId: string | null
  lastIncomeCategoryId: string | null
  lastAccountId: string | null
  setTab: (tab: FinanceTab) => void
  setMonth: (month: string) => void
  rememberChoice: (choice: { type: 'expense' | 'income'; categoryId: string | null; accountId: string | null }) => void
}

/** État d'interface du bureau Finances. Seuls les « derniers choix » sont conservés entre deux ouvertures. */
export const useFinanceStore = create<FinanceUiState>()(
  persist(
    (set) => ({
      tab: 'apercu',
      month: monthOf(toISODate()),
      lastExpenseCategoryId: null,
      lastIncomeCategoryId: null,
      lastAccountId: null,
      setTab: (tab) => set({ tab }),
      setMonth: (month) => set({ month }),
      rememberChoice: ({ type, categoryId, accountId }) =>
        set(
          type === 'expense'
            ? { lastExpenseCategoryId: categoryId, lastAccountId: accountId }
            : { lastIncomeCategoryId: categoryId, lastAccountId: accountId },
        ),
    }),
    {
      name: 'lom-finances',
      partialize: (state) => ({
        lastExpenseCategoryId: state.lastExpenseCategoryId,
        lastIncomeCategoryId: state.lastIncomeCategoryId,
        lastAccountId: state.lastAccountId,
      }),
    },
  ),
)
