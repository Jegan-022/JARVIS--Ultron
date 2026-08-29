import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { DraggableObject } from './DraggableObject'

const REGIONS = [
  {
    id: 'region-malibu',
    name: 'Stark Malibu Point',
    lat: 34.0259,
    lon: -118.7798,
    description: 'Primary J.A.R.V.I.S. Core Datacenter & Workshop.',
    actions: ['select', 'information', 'connect'],
  },
  {
    id: 'region-newyork',
    name: 'Stark Tower NYC',
    lat: 40.7128,
    lon: -74.006,
    description: 'Stark Industries Global Headquarters & Arc Reactor Node.',
    actions: ['select', 'information', 'connect'],
  },
  {
    id: 'region-london',
    name: 'London Relay Hub',
    lat: 51.5074,
    lon: -0.1278,
    description: 'European Neural Telemetry & Automation Gateway.',
    actions: ['select', 'information', 'connect'],
  },
  {
    id: 'region-tokyo',
    name: 'Tokyo Quantum Matrix',
    lat: 35.6762,
    lon: 139.6503,
    description: 'Asia-Pacific High-Speed Optical Computing Cluster.',
    actions: ['select', 'information', 'connect'],
  },
  {
    id: 'region-bengaluru',
    name: 'Bengaluru Tech Node',
    lat: 12.9716,
    lon: 77.5946,
    description: 'South Asia Core Computational Array.',
    actions: ['select', 'information', 'connect'],
  },
]

function latLonToVector3(lat: number, lon: number, radius: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  const x = -(radius * Math.sin(phi) * Math.cos(theta))
  const z = radius * Math.sin(phi) * Math.sin(theta)
  const y = radius * Math.cos(phi)
  return [x, y, z]
}

export function EarthScene() {
  const earthRef = useRef<THREE.Group>(null)
  const cloudsRef = useRef<THREE.Mesh>(null)
  const moonPivotRef = useRef<THREE.Group>(null)
  const issOrbitRef = useRef<THREE.Group>(null)
  const satOrbitRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.04
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.055
    }
    if (moonPivotRef.current) {
      moonPivotRef.current.rotation.y += delta * 0.02
    }
    if (issOrbitRef.current) {
      issOrbitRef.current.rotation.y += delta * 0.18
      issOrbitRef.current.rotation.x = Math.sin(Date.now() * 0.0005) * 0.35
    }
    if (satOrbitRef.current) {
      satOrbitRef.current.rotation.y -= delta * 0.12
    }
  })

  return (
    <group>
      {/* Primary directional sun simulation light */}
      <directionalLight position={[25, 12, 18]} intensity={2.5} color="#ffffff" />
      <ambientLight intensity={0.15} />

      {/* Earth Body */}
      <group ref={earthRef}>
        {/* Ocean / Land Sphere */}
        <mesh>
          <sphereGeometry args={[5, 64, 64]} />
          <meshStandardMaterial
            color="#0c4a6e"
            emissive="#0284c7"
            emissiveIntensity={0.12}
            roughness={0.4}
            metalness={0.2}
          />
        </mesh>

        {/* Night Lights Simulation */}
        <mesh scale={1.002}>
          <sphereGeometry args={[5, 48, 48]} />
          <meshBasicMaterial
            color="#f59e0b"
            transparent
            opacity={0.18}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Cloud Layer */}
        <mesh ref={cloudsRef} scale={1.025}>
          <sphereGeometry args={[5, 48, 48]} />
          <meshStandardMaterial
            color="#ffffff"
            transparent
            opacity={0.32}
            roughness={0.9}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Outer Atmospheric Halo (Fresnel effect) */}
        <mesh scale={1.09}>
          <sphereGeometry args={[5, 32, 32]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.14} side={THREE.BackSide} />
        </mesh>

        {/* Region Command Pins */}
        {REGIONS.map((region) => {
          const pos = latLonToVector3(region.lat, region.lon, 5.15)
          return (
            <DraggableObject
              key={region.id}
              meta={{
                id: region.id,
                name: region.name,
                type: 'beacon',
                description: region.description,
                actions: region.actions,
              }}
              initialPosition={pos}
              scale={0.24}
            >
              <mesh>
                <sphereGeometry args={[1, 16, 16]} />
                <meshBasicMaterial color="#f59e0b" />
              </mesh>
              <pointLight color="#f59e0b" intensity={1.8} distance={3.5} />
            </DraggableObject>
          )
        })}
      </group>

      {/* Orbiting Moon */}
      <group ref={moonPivotRef}>
        <DraggableObject
          meta={{
            id: 'moon',
            name: 'The Moon',
            type: 'satellite',
            description: "Earth's sole natural satellite. Mean radius: 1,737 km. Tidally locked in synchronous rotation.",
            actions: ['select', 'information', 'zoom'],
          }}
          initialPosition={[11.5, 0.5, 0]}
          scale={0.55}
        >
          <mesh>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.9} metalness={0.05} />
          </mesh>
        </DraggableObject>
        {/* Moon orbit line */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[11.46, 11.54, 96]} />
          <meshBasicMaterial color="#94a3b8" transparent opacity={0.12} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* ISS / Space Station Alpha */}
      <group ref={issOrbitRef}>
        <DraggableObject
          meta={{
            id: 'iss-station',
            name: 'Orbital Station Alpha',
            type: 'satellite',
            description: 'Low-Earth orbit relay station and Stark sensor array at 408 km altitude.',
            actions: ['select', 'information', 'zoom'],
          }}
          initialPosition={[7.2, 0, 0]}
          scale={0.35}
        >
          <mesh>
            <boxGeometry args={[1.2, 0.4, 0.4]} />
            <meshStandardMaterial color="#f1f5f9" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0, 0.8]} rotation={[Math.PI / 4, 0, 0]}>
            <boxGeometry args={[0.8, 0.05, 1.2]} />
            <meshBasicMaterial color="#0284c7" />
          </mesh>
          <mesh position={[0, 0, -0.8]} rotation={[Math.PI / 4, 0, 0]}>
            <boxGeometry args={[0.8, 0.05, 1.2]} />
            <meshBasicMaterial color="#0284c7" />
          </mesh>
        </DraggableObject>
      </group>

      {/* Satellite Constellation */}
      <group ref={satOrbitRef}>
        {[0, 1, 2].map((idx) => {
          const angle = (idx * Math.PI * 2) / 3
          const r = 8.5
          return (
            <mesh key={idx} position={[Math.cos(angle) * r, Math.sin(angle) * 1.5, Math.sin(angle) * r]} scale={0.12}>
              <octahedronGeometry args={[1, 0]} />
              <meshBasicMaterial color="#38bdf8" />
            </mesh>
          )
        })}
      </group>
    </group>
  )
}
