import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { DraggableObject } from './DraggableObject'

const REGIONS = [
  {
    id: 'region-tokyo',
    name: 'Tokyo Hub',
    lat: 35.6762,
    lon: 139.6503,
    description: 'Asia-Pacific Primary Quantum Data Node.',
    actions: ['select', 'information', 'connect'],
  },
  {
    id: 'region-london',
    name: 'London Terminal',
    lat: 51.5074,
    lon: -0.1278,
    description: 'European Relay & Automation Gateway.',
    actions: ['select', 'information', 'connect'],
  },
  {
    id: 'region-newyork',
    name: 'New York Matrix',
    lat: 40.7128,
    lon: -74.006,
    description: 'North American High-Speed Neural Exchange.',
    actions: ['select', 'information', 'connect'],
  },
  {
    id: 'region-bengaluru',
    name: 'Bengaluru Tech Node',
    lat: 12.9716,
    lon: 77.5946,
    description: 'South Asia Core Computational Cluster.',
    actions: ['select', 'information', 'connect'],
  },
  {
    id: 'region-sydney',
    name: 'Sydney Terminal',
    lat: -33.8688,
    lon: 151.2093,
    description: 'Oceania Deep-Space Sensor Station.',
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
  const issOrbitRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.04
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.055
    }
    if (issOrbitRef.current) {
      issOrbitRef.current.rotation.y += delta * 0.2
      issOrbitRef.current.rotation.x = Math.sin(Date.now() * 0.0005) * 0.4
    }
  })

  return (
    <group>
      {/* Primary directional sun simulation light */}
      <directionalLight position={[20, 10, 15]} intensity={2.0} color="#ffffff" />
      <ambientLight intensity={0.12} />

      {/* Earth Body */}
      <group ref={earthRef}>
        {/* Ocean / Land Sphere */}
        <mesh>
          <sphereGeometry args={[5, 64, 64]} />
          <meshStandardMaterial
            color="#1e3a8a"
            emissive="#0284c7"
            emissiveIntensity={0.15}
            roughness={0.5}
            metalness={0.1}
          />
        </mesh>

        {/* Cloud Layer */}
        <mesh ref={cloudsRef} scale={1.02}>
          <sphereGeometry args={[5, 48, 48]} />
          <meshStandardMaterial
            color="#ffffff"
            transparent
            opacity={0.35}
            roughness={0.9}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Atmosphere Halo */}
        <mesh scale={1.08}>
          <sphereGeometry args={[5, 32, 32]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.12} side={THREE.BackSide} />
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
              scale={0.22}
            >
              <mesh>
                <sphereGeometry args={[1, 16, 16]} />
                <meshBasicMaterial color="#00ffaa" />
              </mesh>
              {/* Pulsing Beacon Light */}
              <pointLight color="#00ffaa" intensity={1.2} distance={3} />
            </DraggableObject>
          )
        })}
      </group>

      {/* Orbiting Space Station ISS */}
      <group ref={issOrbitRef}>
        <DraggableObject
          meta={{
            id: 'iss-station',
            name: 'Orbital Station Alpha',
            type: 'satellite',
            description: 'Low-Earth orbit relay satellite and sensor array.',
            actions: ['select', 'information', 'zoom'],
          }}
          initialPosition={[7.5, 0, 0]}
          scale={0.35}
        >
          <mesh>
            <boxGeometry args={[1.2, 0.4, 0.4]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Solar Panels */}
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
    </group>
  )
}
