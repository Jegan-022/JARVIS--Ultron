import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { DraggableObject } from './DraggableObject'

const PLANETS = [
  {
    id: 'sun',
    name: 'The Sun',
    type: 'star',
    radius: 2.6,
    orbitRadius: 0,
    color: '#ffb703',
    emissive: '#fb8500',
    speed: 0,
    description: 'G-type main-sequence star. Gravitational anchor containing 99.86% of total system mass.',
    actions: ['select', 'zoom', 'information'],
  },
  {
    id: 'mercury',
    name: 'Mercury',
    type: 'planet',
    radius: 0.38,
    orbitRadius: 5.2,
    color: '#94a3b8',
    speed: 1.6,
    description: 'Innermost rocky world with extreme diurnal temperature variations (-180°C to +430°C).',
    actions: ['select', 'zoom', 'information'],
  },
  {
    id: 'venus',
    name: 'Venus',
    type: 'planet',
    radius: 0.62,
    orbitRadius: 7.8,
    color: '#fbbf24',
    speed: 1.15,
    description: 'Terrestrial world shrouded in dense sulfuric acid clouds with a runaway greenhouse climate.',
    actions: ['select', 'zoom', 'information'],
  },
  {
    id: 'earth',
    name: 'Earth',
    type: 'planet',
    radius: 0.72,
    orbitRadius: 11.2,
    color: '#38bdf8',
    speed: 0.95,
    description: 'Third orbital world. Rich liquid oceans, protective magnetosphere, cradle of civilization.',
    actions: ['select', 'zoom', 'rotate', 'information'],
  },
  {
    id: 'mars',
    name: 'Mars',
    type: 'planet',
    radius: 0.48,
    orbitRadius: 15.0,
    color: '#f87171',
    speed: 0.78,
    description: 'The Red Planet. Iron-oxide surface crust, Olympus Mons shield volcano, polar CO2 ice caps.',
    actions: ['select', 'zoom', 'information'],
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    type: 'planet',
    radius: 1.55,
    orbitRadius: 21.5,
    color: '#fed7aa',
    speed: 0.42,
    description: 'Gas giant behemoth. Houses the Great Red Spot anticyclone and 95 known natural satellites.',
    actions: ['select', 'zoom', 'information'],
  },
  {
    id: 'saturn',
    name: 'Saturn',
    type: 'planet',
    radius: 1.25,
    orbitRadius: 27.5,
    color: '#fef08a',
    hasRings: true,
    speed: 0.32,
    description: 'Magnificent ring system extending 282,000 km comprised of ice, rock, and tholin dust.',
    actions: ['select', 'zoom', 'information'],
  },
  {
    id: 'uranus',
    name: 'Uranus',
    type: 'planet',
    radius: 0.85,
    orbitRadius: 33.5,
    color: '#67e8f9',
    hasUranusRings: true,
    speed: 0.22,
    description: 'Ice giant with unique 97.77° axial tilt. Methane-rich upper atmosphere yielding cyan coloration.',
    actions: ['select', 'zoom', 'information'],
  },
  {
    id: 'neptune',
    name: 'Neptune',
    type: 'planet',
    radius: 0.82,
    orbitRadius: 39.0,
    color: '#3b82f6',
    speed: 0.16,
    description: 'Outermost ice giant. Supersonic wind speeds reaching 2,100 km/h with active Great Dark Spots.',
    actions: ['select', 'zoom', 'information'],
  },
  {
    id: 'pluto',
    name: 'Pluto',
    type: 'dwarf_planet',
    radius: 0.28,
    orbitRadius: 44.0,
    color: '#cbd5e1',
    speed: 0.11,
    description: 'Kuiper Belt dwarf world featuring nitrogen ice glaciers and heart-shaped Tombaugh Regio.',
    actions: ['select', 'zoom', 'information'],
  },
]

function AsteroidBelt() {
  const count = 900
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const radius = 17.2 + Math.random() * 2.8
      const angle = Math.random() * Math.PI * 2
      const height = (Math.random() - 0.5) * 0.8
      pos[i * 3] = Math.cos(angle) * radius
      pos[i * 3 + 1] = height
      pos[i * 3 + 2] = Math.sin(angle) * radius
    }
    return pos
  }, [])

  const groupRef = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += dt * 0.02
    }
  })

  return (
    <group ref={groupRef}>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.12}
          color="#94a3b8"
          transparent
          opacity={0.65}
          sizeAttenuation
        />
      </points>
    </group>
  )
}

function OrbitRing({ radius }: { radius: number }) {
  if (radius <= 0) return null
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius - 0.03, radius + 0.03, 96]} />
      <meshBasicMaterial color="#f59e0b" transparent opacity={0.14} side={THREE.DoubleSide} />
    </mesh>
  )
}

function OrbitingBody({ planet }: { planet: (typeof PLANETS)[number] }) {
  const orbitAngle = useRef(Math.random() * Math.PI * 2)
  const pivotRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((_, dt) => {
    if (planet.speed > 0) {
      orbitAngle.current += dt * planet.speed * 0.08
      const x = Math.cos(orbitAngle.current) * planet.orbitRadius
      const z = Math.sin(orbitAngle.current) * planet.orbitRadius
      if (pivotRef.current) {
        pivotRef.current.position.set(x, 0, z)
      }
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += dt * 0.4
    }
  })

  const isSun = planet.id === 'sun'

  return (
    <group ref={pivotRef} position={[planet.orbitRadius, 0, 0]}>
      <DraggableObject
        meta={{
          id: planet.id,
          name: planet.name,
          type: planet.type,
          description: planet.description,
          actions: planet.actions,
        }}
        initialPosition={[0, 0, 0]}
        scale={planet.radius}
      >
        <mesh ref={meshRef}>
          <sphereGeometry args={[1, 32, 32]} />
          {isSun ? (
            <meshBasicMaterial color={planet.color} />
          ) : (
            <meshStandardMaterial
              color={planet.color}
              roughness={0.65}
              metalness={0.15}
              emissive={planet.color}
              emissiveIntensity={0.12}
            />
          )}
        </mesh>

        {/* Sun volumetric corona & glow */}
        {isSun && (
          <>
            <pointLight color="#fbbf24" intensity={5.5} distance={90} decay={1.5} />
            <mesh scale={1.22}>
              <sphereGeometry args={[1, 32, 32]} />
              <meshBasicMaterial color="#fb8500" transparent opacity={0.3} />
            </mesh>
            <mesh scale={1.5}>
              <sphereGeometry args={[1, 32, 32]} />
              <meshBasicMaterial color="#ffb703" transparent opacity={0.1} />
            </mesh>
          </>
        )}

        {/* Atmosphere haze for planets */}
        {!isSun && (
          <mesh scale={1.08}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshBasicMaterial color={planet.color} transparent opacity={0.1} side={THREE.BackSide} />
          </mesh>
        )}

        {/* Saturn Rings */}
        {'hasRings' in planet && planet.hasRings && (
          <mesh rotation={[Math.PI / 2.5, 0, 0]}>
            <ringGeometry args={[1.35, 2.3, 48]} />
            <meshStandardMaterial
              color="#fef08a"
              roughness={0.7}
              transparent
              opacity={0.75}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}

        {/* Uranus Rings */}
        {'hasUranusRings' in planet && planet.hasUranusRings && (
          <mesh rotation={[Math.PI / 1.15, 0, 0]}>
            <ringGeometry args={[1.3, 1.8, 36]} />
            <meshStandardMaterial
              color="#a5f3fc"
              roughness={0.8}
              transparent
              opacity={0.45}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
      </DraggableObject>
    </group>
  )
}

export function SolarSystemScene() {
  return (
    <group>
      <AsteroidBelt />
      {PLANETS.map((planet) => (
        <React.Fragment key={planet.id}>
          <OrbitRing radius={planet.orbitRadius} />
          <OrbitingBody planet={planet} />
        </React.Fragment>
      ))}
    </group>
  )
}
