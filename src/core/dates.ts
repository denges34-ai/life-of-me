// Outils de dates. Les jours sont stockés en texte « AAAA-MM-JJ » et les mois en « AAAA-MM » :
// pas de fuseau horaire, donc pas de surprise.

const MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]
const MONTHS_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
const WEEKDAYS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.']

const pad = (value: number) => String(value).padStart(2, '0')

function toUTC(isoDate: string): number {
  const [year, month, day] = isoDate.slice(0, 10).split('-').map(Number)
  return Date.UTC(year, month - 1, day)
}

function fromUTC(time: number): string {
  const date = new Date(time)
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

/** « 2026-11-13 » → « 2026-11 » */
export const monthOf = (isoDate: string): string => isoDate.slice(0, 7)

/** Décale un mois : addMonths('2026-11', 2) → '2027-01' */
export function addMonths(month: string, delta: number): string {
  const [year, monthNumber] = month.split('-').map(Number)
  const index = year * 12 + (monthNumber - 1) + delta
  return `${Math.floor(index / 12)}-${pad((index % 12) + 1)}`
}

/** Les `count` derniers mois, du plus ancien au plus récent, `month` inclus. */
export function lastMonths(month: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => addMonths(month, index - count + 1))
}

export function daysInMonth(month: string): number {
  const [year, monthNumber] = month.split('-').map(Number)
  return new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()
}

export function addDays(isoDate: string, delta: number): string {
  return fromUTC(toUTC(isoDate) + delta * 86_400_000)
}

/** Nombre de jours de `from` à `to` (négatif si `to` est avant). */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUTC(to) - toUTC(from)) / 86_400_000)
}

/** Tous les jours de `start` à `end` inclus. */
export function eachDay(start: string, end: string): string[] {
  const count = daysBetween(start, end)
  if (count < 0) return []
  return Array.from({ length: count + 1 }, (_, index) => addDays(start, index))
}

/** « 2026-11 » → « novembre 2026 » */
export function formatMonth(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number)
  return `${MONTHS[monthNumber - 1]} ${year}`
}

/** « 2026-11 » → « nov. » */
export function formatMonthShort(month: string): string {
  return MONTHS_SHORT[Number(month.split('-')[1]) - 1]
}

/** « 2026-11-13 » → « ven. 13 novembre » */
export function formatDayLong(isoDate: string): string {
  const date = new Date(toUTC(isoDate))
  return `${WEEKDAYS[date.getUTCDay()]} ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`
}
