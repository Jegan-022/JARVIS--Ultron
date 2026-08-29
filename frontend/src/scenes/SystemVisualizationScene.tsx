import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { DraggableObject } from './DraggableObject'

const SUBSYSTEMS = [
  {
    id: 'sys-vision',
    name: 'Neural Vision Array',
    pos: [5.8, 2.2, 0] as [number, number, number],
    color: '#38bdf8',
    desc: 'Real-time 21-landmark 3D spatial hand topology recognition running at 60 FPS.',
  },
  {
    id: 'sys-voice',
    name: 'Speech Synthesis Engine',
    pos: [-5.8, 2.2, 0] as [number, number, number],
    color: '#f59e0b',
    desc: 'Bi-directional STT & priority TTS queue with natural British voice synthesis.',
  },
  {
    id: 'sys-ai',
    name: 'Cognitive Reasoning Matrix',
    pos: [0, 5.2, 3.2] as [number, number, number],
    color: '#10b981',
    desc: 'Multi-turn LLM agent orchestrating whitelisted tool calling and spatial context.',
  },
  {
    id: 'sys-devices',
    name: 'Stark IoT Automation',
    pos: [0, -5.2, 3.2] as [number, number, number],
    color: '#eab308',
    desc: 'Home Assistant REST integration and ESP32 MQTT hardware telemetry broker.',
  },
  {
    id: 'sys-security',
    name: 'Security Barrier Layer',
    pos: [0, 0, -5.8] as [number, number, number],
    color: '#ef4444',
    desc: 'Zero-trust tool execution whitelist and sensitive action confirmation barriers.',
  },
]

export function SystemVisualizationScene() {
  const coreRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Group>(null)
  const outerRingRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (coreRef.current) {
      coreRef.current.rotation.x += delta * 0.45
      coreRef.current.rotation.y += delta * 0.65
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.25
    }
    if (outerRingRef.current) {
      outerRingRef.current.rotation.x -= delta * 0.18
      outerRingRef.current.rotation.y += delta * 0.15
    }
  })

  return (
    <group>
      <ambientLight intensity={0.25} />
      <pointLight position={[0, 0, 0]} color="#f59e0b" intensity={4.0} distance={25} />

      {/* Central J.A.R.V.I.S. Arc Quantum Core */}
      <DraggableObject
        meta={{
          id: 'jarvis-qpu',
          name: 'J.A.R.V.I.S. Arc Quantum Core',
          type: 'core',
          description: 'High-throughput multimodal spatial synthesis & autonomous action dispatch engine.',
          actions: ['select', 'information', 'status'],
        }}
        initialPosition={[0, 0, 0]}
        scale={1.8}
      >
        <mesh ref={coreRef}>
          <octahedronGeometry args={[1.2, 0]} />
          <meshStandardMaterial
            color="#f59e0b"
            emissive="#fbbf24"
            emissiveIntensity={0.85}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
        {/* Outer glowing cage */}
        <mesh scale={1.35}>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.45} />
        </mesh>
      </DraggableObject>

      {/* Rotating Conduit Rings */}
      <group ref={ringRef}>
        <mesh rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[4.4, 0.05, 16, 64]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.45} />
        </mesh>
        <mesh rotation={[-Math.PI / 4, Math.PI / 4, 0]}>
          <torusGeometry args={[5.4, 0.04, 16, 64]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.4} />
        </mesh>
      </group>

      {/* Outer Telemetry Shell Ring */}
      <group ref={outerRingRef}>
        <mesh rotation={[0, Math.PI / 6, 0]}>
          <torusGeometry args={[6.4, 0.03, 16, 64]} />
          <meshBasicMaterial color="#10b981" transparent opacity={0.3} />
        </mesh>
      </group>

      {/* Subsystem Nodes */}
      {SUBSYSTEMS.map((sub) => (
        <DraggableObject
          key={sub.id}
          meta={{
            id: sub.id,
            name: sub.name,
            type: 'subsystem',
            description: sub.desc,
            actions: ['select', 'information', 'diagnostics'],
          }}
          initialPosition={sub.pos}
          scale={0.85}
        >
          <mesh>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color={sub.color}
              emissive={sub.color}
              emissiveIntensity={0.75}
              roughness={0.25}
            />
          </mesh>
          <pointLight color={sub.color} intensity={1.5} distance={6} />
        </DraggableObject>
      ))}
    </group>
  )
}
