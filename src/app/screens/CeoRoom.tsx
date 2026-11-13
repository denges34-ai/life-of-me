import { Link } from 'react-router-dom'
import { useCeoProfile, useEnabledOfficeConfigs, useSettings } from '../../core/company'
import { formatDayLong } from '../../core/dates'
import { toISODate } from '../../core/format'
import type { OfficeModule } from '../../core/offices/types'
import { useOfficeSummary } from '../../core/offices/useOfficeSummary'
import { getOffice } from '../../offices/registry'
import { Card, SectionTitle } from '../../shared/ui/bits'
import { OfficeLayout } from '../../shared/ui/OfficeLayout'

const COLOR = '#2b2540'

/** Lignes d'un bureau dans la réunion du matin. */
function BriefingLines({ office }: { office: OfficeModule }) {
  const summary = useOfficeSummary(office)
  return (
    <>
      {summary.briefing.map((line) => (
        <li key={line} className="flex gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-base" style={{ backgroundColor: `${office.color}22` }}>
            {office.icon}
          </span>
          <span className="pt-1 text-sm font-semibold">{line}</span>
        </li>
      ))}
    </>
  )
}

/** Chiffres clés d'un bureau, avec un lien pour y entrer. */
function OfficeFigures({ office, name }: { office: OfficeModule; name: string }) {
  const summary = useOfficeSummary(office)
  return (
    <Link to={`/bureau/${office.id}`} className="block rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5 active:bg-black/5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-bold">
          <span className="mr-2">{office.icon}</span>
          {name}
        </h3>
        <span className="text-muted" aria-hidden>
          ›
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-2">
        {summary.keyFigures.map((figure) => (
          <div key={figure.label} className="min-w-0">
            <dt className="truncate text-xs text-muted">{figure.label}</dt>
            <dd className="truncate font-extrabold" style={{ color: office.color }}>
              {figure.value}
            </dd>
          </div>
        ))}
      </dl>
    </Link>
  )
}

/** Salle du PDG : la réunion du matin et les chiffres clés de chaque bureau. */
export function CeoRoom() {
  const settings = useSettings()
  const profile = useCeoProfile()
  const configs = useEnabledOfficeConfigs() ?? []

  const offices = configs
    .map((config) => ({ office: getOffice(config.officeId), name: config.customName }))
    .filter((entry): entry is { office: OfficeModule; name: string | null } => entry.office !== undefined)
  const open = offices.filter(({ office }) => office.getSummary)
  const underConstruction = offices.length - open.length

  return (
    <OfficeLayout color={COLOR} icon="👔" title="Salle du PDG" subtitle={settings?.companyName}>
      <Card>
        <p className="text-xs font-bold uppercase tracking-wide text-muted">☕ Réunion du matin</p>
        <h2 className="mt-1 text-xl font-extrabold">Bonjour {profile?.firstName}</h2>
        <p className="text-sm capitalize text-muted">{formatDayLong(toISODate())}</p>
        {open.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Aucun bureau ouvert pour l'instant. Active Finances ou Voyages dans les réglages.</p>
        ) : (
          <ul className="mt-4 grid gap-3">
            {open.map(({ office }) => (
              <BriefingLines key={office.id} office={office} />
            ))}
          </ul>
        )}
      </Card>

      {open.length > 0 && <SectionTitle>Chiffres clés</SectionTitle>}
      {open.map(({ office, name }) => (
        <OfficeFigures key={office.id} office={office} name={name ?? office.defaultName} />
      ))}

      {underConstruction > 0 && (
        <p className="px-1 text-center text-xs text-muted">
          🚧 {underConstruction} bureau{underConstruction > 1 ? 'x' : ''} encore en travaux : {underConstruction > 1 ? 'ils rejoindront' : 'il rejoindra'} la
          réunion à la phase 2.
        </p>
      )}
    </OfficeLayout>
  )
}
