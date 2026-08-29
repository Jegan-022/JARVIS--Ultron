import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { DraggableObject } from './DraggableObject'

const PLANETS = [
  {
    id: 'sun',
    name: 'The Sun',
    type: 'star',
    radius: 2.4,
    orbitRadius: 0,
    color: '#ffaa00',
    emissive: '#ff7700',
    speed: 0,
    description: 'Yellow dwarf star at the center of the Solar System.',
    actions: ['select', 'zoom', 'information'],
  },
  {
    id: 'mercury',
    name: 'Mercury',
    type: 'planet',
    radius: 0.35,
    orbitRadius: 5.5,
    color: '#a8a29e',
    speed: 1.2,
    description: 'Smallest planet in the Solar System and closest to the Sun.',
    actions: ['select', 'zoom', 'information'],
  },
  {
    id: 'venus',
    name: 'Venus',
    type: 'planet',
    radius: 0.55,
    orbitRadius: 8.5,
    color: '#fbbf24',
    speed: 0.9,
    description: 'Second planet from the Sun with a dense toxic atmosphere.',
    actions: ['select', 'zoom', 'information'],
  },
  {
    id: 'earth',
    name: 'Earth',
    type: 'planet',
    radius: 0.65,
    orbitRadius: 12.0,
    color: '#38bdf8',
    speed: 0.6,
    description: 'Our home planet — the only known world to harbor life.',
    actions: ['select', 'zoom', 'rotate', 'information'],
  },
  {
    id: 'mars',
    name: 'Mars',
    type: 'planet',
    radius: 0.45,
    orbitRadius: 16.0,
    color: '#f87171',
    speed: 0.45,
    description: 'The Red Planet — dusty, cold world with a thin atmosphere.',
    actions: ['select', 'zoom', 'information'],
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    type: 'planet',
    radius: 1.4,
    orbitRadius: 22.0,
    color: '#fed7aa',
    speed: 0.25,
    description: 'Gas giant and largest planet in the Solar System.',
    actions: ['select', 'zoom', 'information'],
  },
  {
    id: 'saturn',
    name: 'Saturn',
    type: 'planet',
    radius: 1.1,
    orbitRadius: 28.0,
    color: '#fef08a',
    hasRings: true,
    speed: 0.18,
    description: 'Ringed gas giant adorned with thousands of icy ringlets.',
    actions: ['select', 'zoom', 'information'],
  },
]

function OrbitRing({ radius }: { radius: number }) {
  if (radius <= 0) return null
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius - 0.04, radius + 0.04, 64]} />
      <meshBasicMaterial color="#38bdf8" transparent opacity={0.18} side={THREE.DoubleSide} />
    </mesh>
  )
}

function OrbitingBody({ planet }: { planet: (typeof PLANETS)[number] }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (!meshRef.current) return
    meshRef.current.rotation.y += 0.015
  })

  const isSun = planet.id === 'sun'

  return (
    <DraggableObject
      meta={{
        id: planet.id,
        name: planet.name,
        type: planet.type,
        description: planet.description,
        actions: planet.actions,
      }}
      initialPosition={[planet.orbitRadius, 0, 0]}
      scale={planet.radius}
    >
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 32, 32]} />
        {isSun ? (
          <meshBasicMaterial color={planet.color} />
        ) : (
          <meshStandardMaterial
            color={planet.color}
            roughness={0.6}
            metalness={0.2}
            emissive={planet.color}
            emissiveIntensity={0.15}
          />
        )}
      </mesh>

      {/* Sun glow & light */}
      {isSun && (
        <>
          <pointLight color="#ffaa00" intensity={4.5} distance={70} />
          <mesh scale={1.25}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshBasicMaterial color="#ff7700" transparent opacity={0.25} />
          </mesh>
        </>
      )}

      {/* Saturn rings */}
      {'hasRings' in planet && planet.hasRings && (
        <mesh rotation={[Math.PI / 2.6, 0, 0]}>
          <ringGeometry args={[1.4, 2.2, 32]} />
          <meshStandardMaterial
            color="#e2e8f0"
            roughness={0.8}
            transparent
            opacity={0.7}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </DraggableObject>
  )
}

export function SolarSystemScene() {
  return (
    <group>
      {PLANETS.map((planet) => (
        <React.Fragment key={planet.id}>
          <OrbitRing radius={planet.orbitRadius} />
          <OrbitingBody planet={planet} />
        </React.Fragment>
      ))}
    </group>
  )
}
