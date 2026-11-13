// Disposition des bureaux dans l'open space.
// Le bureau du PDG est au centre ; les autres se placent autour, en anneaux successifs.

/** Distance entre deux bureaux voisins. */
export const DESK_SPACING = 3.7

export type Slot = [x: number, z: number]

/** Nombre d'anneaux nécessaires pour `count` bureaux (1 anneau = 8 places, 2 = 24…). */
export function ringsFor(count: number): number {
  let rings = 1
  while ((2 * rings + 1) ** 2 - 1 < count) rings++
  return rings
}

/**
 * Positions des `count` bureaux autour du centre.
 * Dans chaque anneau, on remplit d'abord les places les plus proches du centre
 * (la croix), puis les coins : même avec deux bureaux, l'espace reste équilibré.
 */
export function deskSlots(count: number): Slot[] {
  const slots: Slot[] = []
  for (let ring = 1; ring <= ringsFor(count); ring++) {
    const cells: Slot[] = []
    for (let z = -ring; z <= ring; z++) {
      for (let x = -ring; x <= ring; x++) {
        if (Math.max(Math.abs(x), Math.abs(z)) === ring) cells.push([x, z])
      }
    }
    cells.sort((a, b) => Math.abs(a[0]) + Math.abs(a[1]) - (Math.abs(b[0]) + Math.abs(b[1])))
    slots.push(...cells)
  }
  return slots.slice(0, count).map(([x, z]) => [x * DESK_SPACING, z * DESK_SPACING])
}

/** Côté du plateau carré qui contient tous les bureaux. */
export function floorSize(count: number): number {
  return (2 * ringsFor(count) + 1) * DESK_SPACING + 0.6
}
