// Couleurs des graphiques du bureau Finances.
// Palette catégorielle fixe de 8 teintes, dans un ordre validé pour rester distinguable
// par les personnes daltoniennes. On n'en invente jamais une 9e : au-delà, les catégories
// sont regroupées dans « Autres » (gris neutre).

export const CATEGORY_COLORS = [
  '#2a78d6', // bleu
  '#eb6834', // orange
  '#1baf7a', // vert d'eau
  '#eda100', // jaune
  '#e87ba4', // rose
  '#008300', // vert
  '#6250d6', // violet
  '#e34948', // rouge
]

/** Gris neutre : catégorie « Autre » et regroupement « Autres ». */
export const OTHER_COLOR = '#898781'

/** Couleurs d'état des budgets. Toujours accompagnées d'une icône et d'un texte. */
export const STATUS_COLORS = {
  ok: '#0ca30c',
  warning: '#fab219',
  over: '#d03b3b',
} as const

/** Habillage discret des graphiques (grille, axes, libellés). */
export const CHART_INK = {
  grid: '#e1e0d9',
  axis: '#c3c2b7',
  muted: '#898781',
  series: '#2a78d6',
}
