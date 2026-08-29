import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { DraggableObject } from './DraggableObject'

const SUBSYSTEMS = [
  {
    id: 'sys-vision',
    name: 'Vision Perception Array',
    pos: [5.5, 2.0, 0] as [number, number, number],
    color: '#00f0ff',
    desc: 'Processes MediaPipe 21-landmark 3D spatial hand topology at 60 FPS.',
  },
  {
    id: 'sys-voice',
    name: 'Acoustic / Speech Core',
    pos: [-5.5, 2.0, 0] as [number, number, number],
    color: '#a855f7',
    desc: 'Handles continuous wake-word detection ("Ultron") and bi-directional STT/TTS.',
  },
  {
    id: 'sys-ai',
    name: 'AI Reasoning Engine',
    pos: [0, 5.0, 3.0] as [number, number, number],
    color: '#3b82f6',
    desc: 'Provider-agnostic LLM agent executing whitelisted tools and multimodal reasoning.',
  },
  {
    id: 'sys-devices',
    name: 'IoT & Device Automation',
    pos: [0, -5.0, 3.0] as [number, number, number],
    color: '#10b981',
    desc: 'Home Assistant REST/WebSocket integration and ESP32 MQTT telemetry broker.',
  },
  {
    id: 'sys-security',
    name: 'Security Matrix Layer',
    pos: [0, 0, -5.5] as [number, number, number],
    color: '#f59e0b',
    desc: 'Whitelists safe actions, enforces confirmation barriers, and blocks shell access.',
  },
]

export function SystemVisualizationScene() {
  const coreRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (coreRef.current) {
      coreRef.current.rotation.x += delta * 0.4
      coreRef.current.rotation.y += delta * 0.6
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.2
    }
  })

  return (
    <group>
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 0, 0]} color="#00f0ff" intensity={3.0} distance={20} />

      {/* Central ULTRON Processor Cube */}
      <DraggableObject
        meta={{
          id: 'ultron-qpu',
          name: 'ULTRON Quantum Processing Unit',
          type: 'core',
          description: 'High-throughput multimodal spatial synthesis & action dispatch engine.',
          actions: ['select', 'information', 'status'],
        }}
        initialPosition={[0, 0, 0]}
        scale={1.8}
      >
        <mesh ref={coreRef}>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <meshStandardMaterial
            color="#0ea5e9"
            emissive="#0284c7"
            emissiveIntensity={0.8}
            wireframe={false}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
        {/* Holographic outer cage */}
        <mesh scale={1.3}>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.4} />
        </mesh>
      </DraggableObject>

      {/* Rotating Conduit Rings */}
      <group ref={ringRef}>
        <mesh rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[4.2, 0.05, 16, 64]} />
          <meshBasicMaterial color="#00f0ff" transparent opacity={0.4} />
        </mesh>
        <mesh rotation={[-Math.PI / 4, Math.PI / 4, 0]}>
          <torusGeometry args={[5.2, 0.04, 16, 64]} />
          <meshBasicMaterial color="#a855f7" transparent opacity={0.35} />
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
          scale={0.8}
        >
          <mesh>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color={sub.color}
              emissive={sub.color}
              emissiveIntensity={0.7}
              roughness={0.3}
            />
          </mesh>
          <pointLight color={sub.color} intensity={1.2} distance={5} />
        </DraggableObject>
      ))}
    </group>
  )
}
