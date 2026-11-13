import type { OfficeModule } from '../core/offices/types'
import { financesOffice } from './finances'
import { voyagesOffice } from './voyages'
import { travailOffice } from './travail'
import { emotionsOffice } from './emotions'
import { sportOffice } from './sport'
import { projetsOffice } from './projets'
import { organisationOffice } from './organisation'

/**
 * Registre central des bureaux.
 * Ajouter un bureau = créer son dossier dans `src/offices/` + l'ajouter à cette liste.
 * L'ordre ici est l'ordre par défaut dans l'open space.
 */
export const officeRegistry: OfficeModule[] = [
  financesOffice,
  voyagesOffice,
  travailOffice,
  emotionsOffice,
  sportOffice,
  projetsOffice,
  organisationOffice,
]

export function getOffice(officeId: string | undefined): OfficeModule | undefined {
  return officeRegistry.find((office) => office.id === officeId)
}
