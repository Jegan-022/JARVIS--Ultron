import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { DraggableObject } from './DraggableObject'

interface NodeData {
  id: string
  layer: number
  index: number
  position: [number, number, number]
  color: string
}

export function NeuralNetworkScene() {
  const pulsesRef = useRef<THREE.Points>(null)

  // Generate 4 layers of neurons: Input (Sensor Input), Hidden 1 (Pattern Recognition), Hidden 2 (Semantic Reasoning), Output (Action Dispatch)
  const { nodes, connections } = useMemo(() => {
    const layers = [5, 7, 7, 4]
    const nodeList: NodeData[] = []
    const connList: [number, number][] = []

    const layerDist = 6.2

    layers.forEach((count, lIdx) => {
      const x = (lIdx - (layers.length - 1) / 2) * layerDist
      const colors = ['#f59e0b', '#38bdf8', '#818cf8', '#10b981']

      for (let i = 0; i < count; i++) {
        const y = (i - (count - 1) / 2) * 2.6
        const z = Math.sin((i + lIdx) * 1.5) * 1.8
        nodeList.push({
          id: `neuron-L${lIdx}-N${i}`,
          layer: lIdx,
          index: i,
          position: [x, y, z],
          color: colors[lIdx],
        })
      }
    })

    // Connect adjacent layers
    let prevLayerStart = 0
    let currLayerStart = layers[0]

    for (let l = 1; l < layers.length; l++) {
      const prevCount = layers[l - 1]
      const currCount = layers[l]

      for (let p = 0; p < prevCount; p++) {
        for (let c = 0; c < currCount; c++) {
          connList.push([prevLayerStart + p, currLayerStart + c])
        }
      }

      prevLayerStart = currLayerStart
      currLayerStart += currCount
    }

    return { nodes: nodeList, connections: connList }
  }, [])

  // Line segments geometry
  const linePositions = useMemo(() => {
    const pos = new Float32Array(connections.length * 6)
    connections.forEach(([fromIdx, toIdx], i) => {
      const from = nodes[fromIdx].position
      const to = nodes[toIdx].position
      pos[i * 6] = from[0]
      pos[i * 6 + 1] = from[1]
      pos[i * 6 + 2] = from[2]
      pos[i * 6 + 3] = to[0]
      pos[i * 6 + 4] = to[1]
      pos[i * 6 + 5] = to[2]
    })
    return pos
  }, [nodes, connections])

  // Synaptic firing pulses (80 active traveling pulses)
  const pulseCount = 80
  const pulseData = useMemo(() => {
    const data = []
    for (let i = 0; i < pulseCount; i++) {
      const connIdx = Math.floor(Math.random() * connections.length)
      data.push({
        connIdx,
        progress: Math.random(),
        speed: 0.5 + Math.random() * 0.9,
      })
    }
    return data
  }, [connections, pulseCount])

  const pulsePositions = useMemo(() => new Float32Array(pulseCount * 3), [pulseCount])

  useFrame((_, delta) => {
    if (!pulsesRef.current) return
    const posAttr = pulsesRef.current.geometry.attributes.position as THREE.BufferAttribute

    pulseData.forEach((pulse, i) => {
      pulse.progress += pulse.speed * delta
      if (pulse.progress > 1) {
        pulse.progress = 0
        pulse.connIdx = Math.floor(Math.random() * connections.length)
      }

      const [fromIdx, toIdx] = connections[pulse.connIdx]
      const from = nodes[fromIdx].position
      const to = nodes[toIdx].position

      const x = from[0] + (to[0] - from[0]) * pulse.progress
      const y = from[1] + (to[1] - from[1]) * pulse.progress
      const z = from[2] + (to[2] - from[2]) * pulse.progress

      posAttr.setXYZ(i, x, y, z)
    })

    posAttr.needsUpdate = true
  })

  return (
    <group>
      <ambientLight intensity={0.25} />

      {/* Axon Connection Lines */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[linePositions, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#f59e0b" transparent opacity={0.22} blending={THREE.AdditiveBlending} />
      </lineSegments>

      {/* Synaptic Electrical Firing Pulses */}
      <points ref={pulsesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[pulsePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial color="#38bdf8" size={0.4} transparent opacity={0.95} blending={THREE.AdditiveBlending} />
      </points>

      {/* Interactive Neural Nodes */}
      {nodes.map((node) => (
        <DraggableObject
          key={node.id}
          meta={{
            id: node.id,
            name: `J.A.R.V.I.S. Synapse L${node.layer}-${node.index}`,
            type: 'neuron',
            description: `Cognitive activation node in Layer ${node.layer + 1}. Firing frequency: ${(node.layer + 1) * 44} Hz.`,
            actions: ['select', 'information', 'activate'],
          }}
          initialPosition={node.position}
          scale={0.45}
        >
          <mesh>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial
              color={node.color}
              emissive={node.color}
              emissiveIntensity={0.65}
              roughness={0.25}
            />
          </mesh>
          <pointLight color={node.color} intensity={0.9} distance={3.0} />
        </DraggableObject>
      ))}
    </group>
  )
}
