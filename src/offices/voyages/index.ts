import { lazy } from 'react'
import type { OfficeModule } from '../../core/offices/types'
import { getVoyagesSummary } from './summary'

export const voyagesOffice: OfficeModule = {
  id: 'voyages',
  defaultName: 'Voyages',
  icon: '✈️',
  color: '#1098ad',
  tagline: 'Itinéraires, valises et envies',
  decor: 'globe',
  phase: 1,
  Screen: lazy(() => import('./Screen')),
  getSummary: getVoyagesSummary,
}
