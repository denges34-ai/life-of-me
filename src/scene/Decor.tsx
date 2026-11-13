import type { ComponentType } from 'react'
import type { DeskDecor } from '../core/offices/types'

// Petits objets low-poly qui rendent chaque bureau reconnaissable.
// Uniquement des formes simples (boîtes, cylindres, sphères) : léger pour le téléphone.

const Mat = ({ color }: { color: string }) => <meshLambertMaterial color={color} flatShading />

/** Coffre-fort posé au sol (Finances). */
function Safe() {
  return (
    <group position={[1.25, 0, -0.35]}>
      <mesh position={[0, 0.36, 0]} castShadow>
        <boxGeometry args={[0.62, 0.72, 0.5]} />
        <Mat color="#5c6370" />
      </mesh>
      <mesh position={[0, 0.38, 0.26]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 0.04, 10]} />
        <Mat color="#f2c14e" />
      </mesh>
      <mesh position={[0.2, 0.38, 0.27]}>
        <boxGeometry args={[0.05, 0.2, 0.04]} />
        <Mat color="#d7dbe0" />
      </mesh>
    </group>
  )
}

/** Globe terrestre sur le bureau (Voyages). */
function Globe() {
  return (
    <group position={[0.5, 0.82, 0.05]}>
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.12, 0.15, 0.06, 8]} />
        <Mat color="#8a6a4a" />
      </mesh>
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.2, 6]} />
        <Mat color="#8a6a4a" />
      </mesh>
      <mesh position={[0, 0.38, 0]} rotation={[0, 0, 0.4]} castShadow>
        <icosahedronGeometry args={[0.22, 1]} />
        <Mat color="#3b9ae1" />
      </mesh>
      <mesh position={[0.08, 0.44, 0.14]}>
        <icosahedronGeometry args={[0.1, 0]} />
        <Mat color="#4fbf6b" />
      </mesh>
      <mesh position={[-0.12, 0.34, 0.1]}>
        <icosahedronGeometry args={[0.08, 0]} />
        <Mat color="#4fbf6b" />
      </mesh>
    </group>
  )
}

/** Plante en pot posée au sol (Émotions). */
export function Plant({ position = [1.25, 0, -0.35] as [number, number, number], scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.16, 0.4, 8]} />
        <Mat color="#d98e5f" />
      </mesh>
      <mesh position={[0, 0.62, 0]} castShadow>
        <icosahedronGeometry args={[0.32, 0]} />
        <Mat color="#3fae6a" />
      </mesh>
      <mesh position={[0.16, 0.9, 0.05]}>
        <icosahedronGeometry args={[0.2, 0]} />
        <Mat color="#56c47f" />
      </mesh>
      <mesh position={[-0.15, 0.86, -0.08]}>
        <icosahedronGeometry args={[0.17, 0]} />
        <Mat color="#4bb974" />
      </mesh>
    </group>
  )
}

/** Haltères au sol (Sport & Santé). */
function Dumbbell() {
  return (
    <group position={[1.25, 0.13, -0.2]} rotation={[0, 0.5, Math.PI / 2]}>
      <mesh>
        <cylinderGeometry args={[0.035, 0.035, 0.6, 6]} />
        <Mat color="#9aa1ab" />
      </mesh>
      {[-0.3, 0.3].map((y) => (
        <mesh key={y} position={[0, y, 0]} castShadow>
          <cylinderGeometry args={[0.13, 0.13, 0.14, 10]} />
          <Mat color="#30343b" />
        </mesh>
      ))}
    </group>
  )
}

/** Mallette posée contre le bureau (Travail). */
function Briefcase() {
  return (
    <group position={[1.2, 0, -0.1]}>
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.55, 0.4, 0.16]} />
        <Mat color="#7a4f2e" />
      </mesh>
      <mesh position={[0, 0.44, 0]}>
        <boxGeometry args={[0.2, 0.06, 0.05]} />
        <Mat color="#4d311b" />
      </mesh>
      <mesh position={[0, 0.26, 0.085]}>
        <boxGeometry args={[0.1, 0.07, 0.02]} />
        <Mat color="#f2c14e" />
      </mesh>
    </group>
  )
}

/** Cible sur pied (Projets de vie). */
function Target() {
  const rings: [number, string][] = [
    [0.3, '#ffffff'],
    [0.21, '#e03131'],
    [0.12, '#ffffff'],
    [0.05, '#e03131'],
  ]
  return (
    <group position={[1.25, 0, -0.4]}>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.7, 6]} />
        <Mat color="#8a6a4a" />
      </mesh>
      <group position={[0, 0.85, 0]} rotation={[Math.PI / 2, 0, 0]}>
        {rings.map(([radius, color], index) => (
          <mesh key={radius} position={[0, 0.02 + index * 0.012, 0]} castShadow={index === 0}>
            <cylinderGeometry args={[radius, radius, 0.03, 16]} />
            <Mat color={color} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/** Calendrier à poser sur le bureau (Organisation). */
function Calendar() {
  return (
    <group position={[0.5, 0.82, 0.05]} rotation={[-0.25, -0.2, 0]}>
      <mesh position={[0, 0.17, 0]} castShadow>
        <boxGeometry args={[0.36, 0.34, 0.04]} />
        <Mat color="#ffffff" />
      </mesh>
      <mesh position={[0, 0.3, 0.005]}>
        <boxGeometry args={[0.37, 0.09, 0.045]} />
        <Mat color="#e03131" />
      </mesh>
    </group>
  )
}

const DECORS: Record<DeskDecor, ComponentType> = {
  safe: Safe,
  globe: Globe,
  plant: Plant,
  dumbbell: Dumbbell,
  briefcase: Briefcase,
  target: Target,
  calendar: Calendar,
}

export function Decor({ kind }: { kind: DeskDecor }) {
  const Component = DECORS[kind]
  return <Component />
}
