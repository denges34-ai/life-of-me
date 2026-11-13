import { useLiveQuery } from 'dexie-react-hooks'
import { useSettings } from '../company'
import { toISODate } from '../format'
import { EMPTY_SUMMARY, type OfficeModule, type OfficeSummary } from './types'

/** Résumé « vivant » d'un bureau : se met à jour dès que ses données changent. */
export function useOfficeSummary(office: OfficeModule): OfficeSummary {
  const currency = useSettings()?.currency ?? 'CHF'
  const summary = useLiveQuery(
    async () => (office.getSummary ? office.getSummary({ today: toISODate(), currency }) : EMPTY_SUMMARY),
    [office.id, currency],
  )
  return summary ?? EMPTY_SUMMARY
}
