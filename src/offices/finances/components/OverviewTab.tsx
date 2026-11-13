import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatMonthShort, lastMonths, monthOf } from '../../../core/dates'
import type { CurrencyCode } from '../../../core/db/types'
import { formatMoney, formatMoneyRounded } from '../../../core/format'
import { Card, EmptyState } from '../../../shared/ui/bits'
import { monthlySeries, percent, type FinanceData, type MonthView } from '../logic'
import { CHART_INK, OTHER_COLOR } from '../palette'

interface Props {
  data: FinanceData
  view: MonthView
  month: string
  today: string
  currency: CurrencyCode
}

interface Slice {
  id: string
  name: string
  cents: number
  color: string
}

/**
 * Parts du donut : une par catégorie colorée, dans l'ordre fixe des catégories.
 * Les catégories grises et les dépenses sans catégorie sont regroupées dans « Autres ».
 */
function buildSlices(view: MonthView): Slice[] {
  const slices: Slice[] = []
  let otherCents = view.totals.expenseCents - view.budgets.reduce((sum, row) => sum + row.spentCents, 0)
  for (const row of view.budgets) {
    if (row.spentCents <= 0) continue
    if (row.category.color === OTHER_COLOR) otherCents += row.spentCents
    else slices.push({ id: row.category.id, name: `${row.category.icon} ${row.category.name}`, cents: row.spentCents, color: row.category.color })
  }
  if (otherCents > 0) slices.push({ id: 'other', name: '📦 Autres', cents: otherCents, color: OTHER_COLOR })
  return slices
}

const tooltipStyle = { borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', fontSize: 13 }

export function OverviewTab({ data, view, month, today, currency }: Props) {
  const isCurrentMonth = month === monthOf(today)
  const slices = buildSlices(view)
  const series = monthlySeries(data.transactions, lastMonths(month, 6)).map((point) => ({
    label: formatMonthShort(point.month),
    expense: point.expenseCents / 100,
  }))
  const hasHistory = series.some((point) => point.expense > 0)
  const upcomingNet = view.upcoming.expenseCents - view.upcoming.incomeCents

  return (
    <>
      {/* Reste à vivre : LE chiffre du mois */}
      <Card>
        <p className="text-sm font-semibold text-muted">{isCurrentMonth ? 'Reste à vivre ce mois-ci' : 'Solde du mois'}</p>
        <p className={`mt-1 text-4xl font-extrabold tabular-nums ${view.remainingCents < 0 ? 'text-red-600' : ''}`}>
          {formatMoney(view.remainingCents, currency)}
        </p>
        <dl className="mt-3 grid gap-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Revenus</dt>
            <dd className="font-semibold tabular-nums">+ {formatMoney(view.totals.incomeCents, currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Dépenses</dt>
            <dd className="font-semibold tabular-nums">− {formatMoney(view.totals.expenseCents, currency)}</dd>
          </div>
          {isCurrentMonth && upcomingNet !== 0 && (
            <div className="flex justify-between">
              <dt className="text-muted">Récurrents encore à venir</dt>
              <dd className="font-semibold tabular-nums">
                {upcomingNet > 0 ? '−' : '+'} {formatMoney(Math.abs(upcomingNet), currency)}
              </dd>
            </div>
          )}
        </dl>
      </Card>

      {/* Répartition des dépenses du mois */}
      <Card>
        <h2 className="font-bold">Dépenses par catégorie</h2>
        {slices.length === 0 ? (
          <EmptyState icon="🍩" title="Rien à afficher pour l'instant" hint="Ajoute une dépense avec le bouton + pour voir la répartition." />
        ) : (
          <>
            <div className="relative mx-auto h-52 w-full max-w-xs">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={slices}
                    dataKey="cents"
                    nameKey="name"
                    innerRadius="62%"
                    outerRadius="92%"
                    paddingAngle={slices.length > 1 ? 2 : 0}
                    stroke="#ffffff"
                    strokeWidth={2}
                    startAngle={90}
                    endAngle={-270}
                    isAnimationActive={false}
                  >
                    {slices.map((slice) => (
                      <Cell key={slice.id} fill={slice.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatMoney(Number(value), currency)} contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                <div>
                  <div className="text-xs text-muted">Total</div>
                  <div className="text-lg font-extrabold tabular-nums">{formatMoneyRounded(view.totals.expenseCents, currency)}</div>
                </div>
              </div>
            </div>

            {/* Légende : toujours présente, avec nom et montant (jamais la couleur seule) */}
            <ul className="mt-3 grid gap-1.5 text-sm">
              {slices.map((slice) => (
                <li key={slice.id} className="flex items-center gap-2">
                  <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: slice.color }} />
                  <span className="min-w-0 flex-1 truncate">{slice.name}</span>
                  <span className="text-muted tabular-nums">{percent(slice.cents, view.totals.expenseCents)} %</span>
                  <span className="w-24 text-right font-semibold tabular-nums">{formatMoney(slice.cents, currency)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      {/* Évolution sur 6 mois */}
      <Card>
        <h2 className="font-bold">Dépenses sur 6 mois</h2>
        {!hasHistory ? (
          <EmptyState icon="📊" title="Pas encore d'historique" hint="Le graphique se remplira au fil des mois." />
        ) : (
          <div className="mt-3 h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke={CHART_INK.grid} />
                <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: CHART_INK.axis }} tick={{ fontSize: 12, fill: CHART_INK.muted }} />
                <YAxis width={44} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: CHART_INK.muted }} tickCount={4} />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                  formatter={(value) => [formatMoney(Number(value) * 100, currency), 'Dépenses']}
                  contentStyle={tooltipStyle}
                />
                <Bar dataKey="expense" fill={CHART_INK.series} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </>
  )
}
