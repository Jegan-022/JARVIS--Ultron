import { useMemo, useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, Mesh } from 'three'
import { DoubleSide } from 'three'
import { useUniverseStore } from '../stores/universeStore'

function Selectable({
  id,
  children,
}: {
  id: string
  children: ReactNode
}) {
  const selected = useUniverseStore((s) => s.selectedObject?.id === id)

  return (
    <group
      onClick={(event) => {
        event.stopPropagation()
        useUniverseStore.getState().selectObject(id)
      }}
      onPointerMissed={undefined}
    >
      {children}
      {selected ? (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.35, 1.5, 48]} />
          <meshBasicMaterial color="#9ad0ff" transparent opacity={0.85} side={DoubleSide} />
        </mesh>
      ) : null}
    </group>
  )
}

export function OrbitalBodies() {
  const earth = useRef<Group>(null)
  const mars = useRef<Group>(null)
  const nodeA = useRef<Mesh>(null)
  const nodeB = useRef<Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (earth.current) {
      earth.current.position.set(Math.cos(t * 0.18) * 11, Math.sin(t * 0.18) * 0.6, Math.sin(t * 0.18) * 11)
    }
    if (mars.current) {
      mars.current.position.set(Math.cos(t * 0.12 + 1.2) * 16, Math.cos(t * 0.12) * 0.8, Math.sin(t * 0.12 + 1.2) * 16)
    }
    if (nodeA.current) {
      nodeA.current.rotation.y = t * 0.4
      nodeA.current.position.y = 6 + Math.sin(t * 0.7) * 0.4
    }
    if (nodeB.current) {
      nodeB.current.rotation.y = -t * 0.35
      nodeB.current.position.y = -5 + Math.cos(t * 0.6) * 0.35
    }
  })

  return (
    <group>
      <Selectable id="earth">
        <group ref={earth}>
          <mesh>
            <sphereGeometry args={[0.72, 32, 32]} />
            <meshStandardMaterial color="#3d7dff" emissive="#1a3a88" emissiveIntensity={0.4} roughness={0.45} />
          </mesh>
        </group>
      </Selectable>
      <Selectable id="mars">
        <group ref={mars}>
          <mesh>
            <sphereGeometry args={[0.48, 32, 32]} />
            <meshStandardMaterial color="#c45a32" emissive="#5a1c10" emissiveIntensity={0.35} roughness={0.55} />
          </mesh>
        </group>
      </Selectable>
      <Selectable id="node-alpha">
        <mesh ref={nodeA} position={[0, 6, 0]}>
          <octahedronGeometry args={[0.35, 0]} />
          <meshStandardMaterial color="#8ee7ff" emissive="#3aa8c8" emissiveIntensity={0.8} wireframe />
        </mesh>
      </Selectable>
      <Selectable id="node-beta">
        <mesh ref={nodeB} position={[0, -5, 0]}>
          <octahedronGeometry args={[0.3, 0]} />
          <meshStandardMaterial color="#d2a8ff" emissive="#6a3aaa" emissiveIntensity={0.8} wireframe />
        </mesh>
      </Selectable>
      <Selectable id="core">
        <mesh visible={false}>
          <sphereGeometry args={[2.2, 16, 16]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      </Selectable>
    </group>
  )
}

export function SpatialGrid() {
  const color = useMemo(() => '#1c2a48', [])
  return (
    <gridHelper args={[80, 40, color, '#10182c']} position={[0, -8, 0]} />
  )
}
