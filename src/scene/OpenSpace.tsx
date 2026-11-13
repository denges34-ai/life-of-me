import { OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, useState, type ComponentRef, type RefObject } from 'react'
import { Vector3, type Group, type OrthographicCamera } from 'three'
import type { OfficeModule } from '../core/offices/types'
import { useOfficeSummary } from '../core/offices/useOfficeSummary'
import { getDayPhase, type DayPhase } from './dayPhase'
import { Plant } from './Decor'
import { Desk } from './Desk'
import { deskSlots, floorSize, type Slot } from './layout'

export interface OpenSpaceOffice {
  office: OfficeModule
  name: string
}

interface OpenSpaceProps {
  offices: OpenSpaceOffice[]
  /** Appelé quand le PDG est arrivé au bureau : `'pdg'` ou l'identifiant du bureau. */
  onOpen: (target: string) => void
}

/** Vitesse de marche de l'avatar (unités par seconde). */
const WALK_SPEED = 9
/** Direction de la caméra : vue isométrique, en hauteur dans le coin. */
const CAMERA_OFFSET = new Vector3(12, 13, 12)
/** Angle horizontal de base de la caméra, et marge de rotation autorisée de chaque côté. */
const BASE_AZIMUTH = Math.PI / 4
const AZIMUTH_RANGE = 0.75

/** L'avatar se souvient d'où il était entre deux visites de l'open space. */
let lastAvatarPosition: [number, number] = [1.6, 1.4]

/** Ambiance lumineuse du moment, réévaluée toutes les 5 minutes. */
function useDayPhase(): DayPhase {
  const [phase, setPhase] = useState(() => getDayPhase(new Date().getHours()))
  useEffect(() => {
    const timer = window.setInterval(() => setPhase(getDayPhase(new Date().getHours())), 5 * 60_000)
    return () => window.clearInterval(timer)
  }, [])
  return phase
}

/** Bureau relié au résumé « vivant » de son module (badge, état, compte à rebours). */
function OfficeDesk({
  entry,
  slot,
  lampsOn,
  showName,
  onSelect,
}: {
  entry: OpenSpaceOffice
  slot: Slot
  lampsOn: boolean
  showName: boolean
  onSelect: () => void
}) {
  const summary = useOfficeSummary(entry.office)
  return (
    <Desk
      position={[slot[0], 0, slot[1]]}
      name={entry.name}
      icon={entry.office.icon}
      color={entry.office.color}
      decor={entry.office.decor}
      state={summary.state}
      badge={summary.badge}
      deskLabel={summary.deskLabel}
      underConstruction={!entry.office.Screen}
      lampsOn={lampsOn}
      showName={showName}
      onSelect={onSelect}
    />
  )
}

/** Le PDG : un petit personnage qui marche jusqu'au bureau choisi. */
function Avatar({ groupRef }: { groupRef: RefObject<Group | null> }) {
  return (
    <group ref={groupRef} position={[lastAvatarPosition[0], 0, lastAvatarPosition[1]]}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <capsuleGeometry args={[0.2, 0.42, 3, 8]} />
        <meshLambertMaterial color="#6d5ae6" flatShading />
      </mesh>
      <mesh position={[0, 1.02, 0]} castShadow>
        <icosahedronGeometry args={[0.2, 1]} />
        <meshLambertMaterial color="#f2c9a0" flatShading />
      </mesh>
      {/* Cravate : on reconnaît le patron */}
      <mesh position={[0, 0.62, 0.2]}>
        <boxGeometry args={[0.07, 0.24, 0.03]} />
        <meshLambertMaterial color="#e03131" />
      </mesh>
    </group>
  )
}

interface Focus {
  id: string
  center: Vector3
  startedAt: number
  opened: boolean
}

function Scene({ offices, onOpen }: OpenSpaceProps) {
  const phase = useDayPhase()
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null)
  const avatar = useRef<Group>(null)
  const avatarTarget = useRef(new Vector3(lastAvatarPosition[0], 0, lastAvatarPosition[1]))
  const focus = useRef<Focus | null>(null)
  // Les noms des bureaux n'apparaissent qu'une fois zoomé : sinon ils se chevauchent sur un petit écran.
  const [showNames, setShowNames] = useState(false)
  const camera = useThree((state) => state.camera) as OrthographicCamera
  const size = useThree((state) => state.size)
  const clock = useThree((state) => state.clock)

  const slots = deskSlots(offices.length)
  const floor = floorSize(offices.length)
  // Zoom de base : tout le plateau tient dans l'écran, quelle que soit sa taille.
  const baseZoom = Math.min(size.width / (floor * 1.32), size.height / (floor * 1.3))

  useEffect(() => {
    camera.zoom = baseZoom
    camera.updateProjectionMatrix()
  }, [camera, baseZoom])

  function select(id: string, x: number, z: number) {
    if (focus.current) return
    focus.current = { id, center: new Vector3(x, 0.6, z), startedAt: clock.elapsedTime, opened: false }
    // L'avatar se place devant le bureau, à côté de la chaise.
    avatarTarget.current.set(x + 1.05, 0, z + 1.1)
  }

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1)
    const zoomedIn = camera.zoom > baseZoom * 1.3
    if (zoomedIn !== showNames) setShowNames(zoomedIn)
    const body = avatar.current
    let distance = 0

    // Marche de l'avatar vers sa destination.
    if (body) {
      const to = avatarTarget.current
      const dx = to.x - body.position.x
      const dz = to.z - body.position.z
      distance = Math.hypot(dx, dz)
      if (distance > 0.03) {
        const step = Math.min(distance, WALK_SPEED * dt)
        body.position.x += (dx / distance) * step
        body.position.z += (dz / distance) * step
        body.rotation.y = Math.atan2(dx, dz)
        body.position.y = Math.abs(Math.sin(state.clock.elapsedTime * 12)) * 0.07
      } else {
        body.position.y = 0
      }
    }

    // Caméra : glisse vers le bureau choisi en zoomant, puis on ouvre son écran.
    const current = focus.current
    const orbit = controls.current
    if (current && orbit) {
      const k = 1 - Math.exp(-5 * dt)
      const shift = current.center.clone().sub(orbit.target).multiplyScalar(k)
      orbit.target.add(shift)
      camera.position.add(shift)
      camera.zoom += (baseZoom * 1.8 - camera.zoom) * k
      camera.updateProjectionMatrix()
      orbit.update()

      const elapsed = state.clock.elapsedTime - current.startedAt
      if (!current.opened && ((distance <= 0.05 && elapsed > 0.45) || elapsed > 1.3)) {
        current.opened = true
        if (body) lastAvatarPosition = [body.position.x, body.position.z]
        onOpen(current.id)
      }
    }
  })

  const half = floor / 2

  return (
    <>
      <color attach="background" args={[phase.sky]} />
      <ambientLight color={phase.ambientColor} intensity={phase.ambient} />
      <directionalLight
        color={phase.sunColor}
        intensity={phase.sun}
        position={phase.sunPosition}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-half - 1}
        shadow-camera-right={half + 1}
        shadow-camera-top={half + 1}
        shadow-camera-bottom={-half - 1}
        shadow-camera-near={0.5}
        shadow-camera-far={40}
      />
      {/* Le soir, une lumière chaude au-dessus du bureau du PDG */}
      {phase.lampsOn && <pointLight color="#ffc97a" intensity={30} distance={half * 2.2} position={[0, 3.2, 0]} />}

      {/* Plateau de l'open space */}
      <mesh position={[0, -0.15, 0]} receiveShadow>
        <boxGeometry args={[floor, 0.3, floor]} />
        <meshLambertMaterial color="#f4ead9" />
      </mesh>
      <mesh position={[0, -0.45, 0]}>
        <boxGeometry args={[floor + 0.3, 0.3, floor + 0.3]} />
        <meshLambertMaterial color="#d9c6a8" />
      </mesh>

      {/* Deux murs du fond (côtés opposés à la caméra) */}
      <mesh position={[-half + 0.1, 1.1, 0]} receiveShadow>
        <boxGeometry args={[0.2, 2.2, floor]} />
        <meshLambertMaterial color="#efe2cf" />
      </mesh>
      <mesh position={[0, 1.1, -half + 0.1]} receiveShadow>
        <boxGeometry args={[floor, 2.2, 0.2]} />
        <meshLambertMaterial color="#e9dac4" />
      </mesh>

      {/* Plantes dans les coins du fond */}
      <Plant position={[-half + 0.8, 0, -half + 0.8]} scale={1.5} />
      <Plant position={[half - 0.8, 0, -half + 0.8]} scale={1.1} />

      {/* Bureau du PDG, au centre */}
      <Desk
        position={[0, 0, 0]}
        name="Salle du PDG"
        icon="👔"
        color="#f2b632"
        state="ok"
        badge={null}
        deskLabel={null}
        ceo
        lampsOn={phase.lampsOn}
        showName={showNames}
        onSelect={() => select('pdg', 0, 0)}
      />

      {offices.map((entry, index) => (
        <OfficeDesk
          key={entry.office.id}
          entry={entry}
          slot={slots[index]}
          lampsOn={phase.lampsOn}
          showName={showNames}
          onSelect={() => select(entry.office.id, slots[index][0], slots[index][1])}
        />
      ))}

      <Avatar groupRef={avatar} />

      {/* Glisser pour tourner, pincer pour zoomer : pas de déplacement libre, on ne peut pas se perdre. */}
      <OrbitControls
        ref={controls}
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.12}
        rotateSpeed={0.6}
        zoomSpeed={0.8}
        minZoom={baseZoom * 0.75}
        maxZoom={baseZoom * 2.6}
        minPolarAngle={Math.PI / 5}
        maxPolarAngle={Math.PI / 2.7}
        minAzimuthAngle={BASE_AZIMUTH - AZIMUTH_RANGE}
        maxAzimuthAngle={BASE_AZIMUTH + AZIMUTH_RANGE}
      />
    </>
  )
}

/** L'open space 3D : écran principal de l'appli. */
export default function OpenSpace(props: OpenSpaceProps) {
  return (
    <Canvas
      orthographic
      flat
      shadows
      dpr={[1, 2]}
      camera={{ position: CAMERA_OFFSET.toArray(), zoom: 40, near: 0.1, far: 100 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      style={{ touchAction: 'none' }}
    >
      <Scene {...props} />
    </Canvas>
  )
}
