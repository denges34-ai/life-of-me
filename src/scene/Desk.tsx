import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useRef } from 'react'
import type { Mesh } from 'three'
import type { DeskDecor, OfficeState } from '../core/offices/types'
import { Decor } from './Decor'

export interface DeskProps {
  position: [number, number, number]
  color: string
  decor?: DeskDecor
  state: OfficeState
  /** Bureau pas encore construit (phase suivante). */
  underConstruction?: boolean
  /** Bureau du PDG : plus grand, au centre. */
  ceo?: boolean
  lampsOn: boolean
  onSelect: () => void
}

const WOOD = '#e6c59a'
const WOOD_DARK = '#c49f73'
const PAPER = '#fffdf7'

/** Papiers en désordre : positions fixes (pas de hasard, pour un rendu stable). */
const MESSY_PAPERS: { position: [number, number, number]; rotation: number }[] = [
  { position: [-0.55, 0.83, 0.2], rotation: 0.5 },
  { position: [0.1, 0.83, 0.25], rotation: -0.4 },
  { position: [0.15, 0.845, 0.18], rotation: 0.9 },
  { position: [-0.2, 0.83, 0.3], rotation: 1.3 },
  { position: [-1.05, 0.05, 0.75], rotation: 0.3 },
  { position: [1.0, 0.05, 0.95], rotation: -0.8 },
]

/** Voyant rouge qui pulse au-dessus de l'écran. */
function Beacon() {
  const ref = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    if (ref.current) ref.current.scale.setScalar(1 + 0.25 * Math.sin(clock.elapsedTime * 5))
  })
  return (
    <mesh ref={ref} position={[-0.3, 1.5, -0.2]}>
      <sphereGeometry args={[0.11, 10, 8]} />
      <meshBasicMaterial color="#ff3b30" />
    </mesh>
  )
}

/** Un bureau de l'open space : meuble, écran, chaise, lampe et objet décoratif. Son étiquette est dans Labels.tsx. */
export function Desk({ position, color, decor, state, underConstruction, ceo, lampsOn, onSelect }: DeskProps) {
  const scale = ceo ? 1.25 : 1

  function handleClick(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation()
    // Si le doigt a glissé, c'était une rotation de caméra, pas un tap.
    if (event.delta > 8) return
    onSelect()
  }

  return (
    <group position={position}>
      {/* Tapis à la couleur du bureau */}
      <mesh position={[0, 0.025, 0.1]} receiveShadow>
        <boxGeometry args={[2.9 * scale, 0.05, 2.7 * scale]} />
        <meshLambertMaterial color={color} />
      </mesh>

      <group scale={scale}>
        {/* Plateau et pieds */}
        <mesh position={[0, 0.78, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.8, 0.08, 0.9]} />
          <meshLambertMaterial color={ceo ? '#7a5234' : WOOD} flatShading />
        </mesh>
        {[-0.82, 0.82].map((x) => (
          <mesh key={x} position={[x, 0.38, 0]} castShadow>
            <boxGeometry args={[0.08, 0.74, 0.8]} />
            <meshLambertMaterial color={ceo ? '#5c3d26' : WOOD_DARK} flatShading />
          </mesh>
        ))}

        {/* Écran */}
        <mesh position={[-0.3, 1.14, -0.2]} castShadow>
          <boxGeometry args={[0.62, 0.42, 0.05]} />
          <meshLambertMaterial color="#2b2540" flatShading />
        </mesh>
        <mesh position={[-0.3, 1.14, -0.172]}>
          <boxGeometry args={[0.54, 0.34, 0.01]} />
          <meshBasicMaterial color={underConstruction ? '#4a4560' : color} />
        </mesh>
        <mesh position={[-0.3, 0.88, -0.2]}>
          <boxGeometry args={[0.1, 0.14, 0.05]} />
          <meshLambertMaterial color="#2b2540" />
        </mesh>

        {/* Chaise */}
        <mesh position={[0, 0.46, 0.85]} castShadow>
          <boxGeometry args={[0.52, 0.08, 0.5]} />
          <meshLambertMaterial color={color} flatShading />
        </mesh>
        <mesh position={[0, 0.8, 1.08]} castShadow>
          <boxGeometry args={[0.52, 0.6, 0.08]} />
          <meshLambertMaterial color={color} flatShading />
        </mesh>
        <mesh position={[0, 0.22, 0.85]}>
          <cylinderGeometry args={[0.05, 0.16, 0.44, 6]} />
          <meshLambertMaterial color="#5c6370" />
        </mesh>

        {/* Lampe de bureau : allumée le soir */}
        <mesh position={[0.72, 1.0, -0.28]}>
          <cylinderGeometry args={[0.02, 0.02, 0.36, 6]} />
          <meshLambertMaterial color="#5c6370" />
        </mesh>
        <mesh position={[0.72, 1.22, -0.28]}>
          <coneGeometry args={[0.14, 0.16, 8]} />
          {lampsOn ? <meshBasicMaterial color="#ffe08a" /> : <meshLambertMaterial color="#f1f3f5" flatShading />}
        </mesh>

        {/* État du bureau : rangé (une pile nette) ou papiers en désordre */}
        {state === 'ok' ? (
          <mesh position={[-0.6, 0.845, 0.22]}>
            <boxGeometry args={[0.24, 0.05, 0.32]} />
            <meshLambertMaterial color={PAPER} />
          </mesh>
        ) : (
          MESSY_PAPERS.map((paper, index) => (
            <mesh key={index} position={paper.position} rotation={[0, paper.rotation, 0]}>
              <boxGeometry args={[0.24, 0.012, 0.32]} />
              <meshLambertMaterial color={PAPER} />
            </mesh>
          ))
        )}
        {state === 'alert' && <Beacon />}

        {decor && <Decor kind={decor} />}
      </group>

      {/* Zone de tap, plus large que le meuble (invisible) */}
      <mesh position={[0, 0.95, 0.1]} onClick={handleClick}>
        <boxGeometry args={[2.9 * scale, 1.9, 2.7 * scale]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}
