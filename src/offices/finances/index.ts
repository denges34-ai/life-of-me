import { lazy } from 'react'
import type { OfficeModule } from '../../core/offices/types'
import { ensureFinanceDefaults, generateRecurring } from './db'
import { getFinancesSummary } from './summary'

export const financesOffice: OfficeModule = {
  id: 'finances',
  defaultName: 'Finances',
  icon: '💰',
  color: '#1f9d6b',
  tagline: 'Budgets, dépenses et tirelires',
  decor: 'safe',
  phase: 1,
  Screen: lazy(() => import('./Screen')),
  getSummary: getFinancesSummary,
  // À l'ouverture : catégories et comptes de départ, puis récurrents arrivés à échéance.
  onStart: async (today) => {
    await ensureFinanceDefaults()
    await generateRecurring(today)
  },
}
