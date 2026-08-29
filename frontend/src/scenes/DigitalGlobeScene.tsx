import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { DraggableObject } from './DraggableObject'

const DATA_HUBS = [
  { id: 'hub-alpha', name: 'Global Gateway Alpha', pos: [3.5, 2.5, 2.0] as [number, number, number], color: '#00f0ff' },
  { id: 'hub-beta', name: 'Quantum Core Beta', pos: [-3.8, 1.2, 2.8] as [number, number, number], color: '#38bdf8' },
  { id: 'hub-gamma', name: 'Orbital Uplink Gamma', pos: [1.2, -4.0, 2.2] as [number, number, number], color: '#a855f7' },
  { id: 'hub-delta', name: 'Cyber Sentinel Delta', pos: [-2.5, -2.5, -3.5] as [number, number, number], color: '#00ffaa' },
]

export function DigitalGlobeScene() {
  const globeRef = useRef<THREE.Group>(null)
  const ring1Ref = useRef<THREE.Mesh>(null)
  const ring2Ref = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (globeRef.current) {
      globeRef.current.rotation.y += delta * 0.08
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z += delta * 0.15
      ring1Ref.current.rotation.x += delta * 0.05
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z -= delta * 0.12
      ring2Ref.current.rotation.y += delta * 0.08
    }
  })

  return (
    <group>
      <ambientLight intensity={0.2} />

      {/* Outer Holographic Rings */}
      <mesh ref={ring1Ref} rotation={[Math.PI / 3, 0, 0]}>
        <ringGeometry args={[6.8, 7.0, 64]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>

      <mesh ref={ring2Ref} rotation={[-Math.PI / 4, 0, 0]}>
        <ringGeometry args={[7.4, 7.55, 64]} />
        <meshBasicMaterial color="#818cf8" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>

      {/* Cyber Wireframe Globe */}
      <group ref={globeRef}>
        {/* Wireframe Sphere */}
        <mesh>
          <sphereGeometry args={[5, 32, 32]} />
          <meshBasicMaterial color="#0284c7" wireframe transparent opacity={0.25} />
        </mesh>

        {/* Inner Luminous Core */}
        <mesh scale={0.7}>
          <sphereGeometry args={[5, 16, 16]} />
          <meshBasicMaterial color="#0369a1" transparent opacity={0.15} />
        </mesh>

        {/* Data Hub Nodes */}
        {DATA_HUBS.map((hub) => (
          <DraggableObject
            key={hub.id}
            meta={{
              id: hub.id,
              name: hub.name,
              type: 'data_hub',
              description: `Global high-capacity cyber data hub with real-time throughput of 12.4 Tbps.`,
              actions: ['select', 'information', 'ping'],
            }}
            initialPosition={hub.pos}
            scale={0.4}
          >
            <mesh>
              <octahedronGeometry args={[1, 0]} />
              <meshStandardMaterial
                color={hub.color}
                emissive={hub.color}
                emissiveIntensity={0.8}
                roughness={0.2}
              />
            </mesh>
            <pointLight color={hub.color} intensity={1.5} distance={4} />
          </DraggableObject>
        ))}
      </group>
    </group>
  )
}
