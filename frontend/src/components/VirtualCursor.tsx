import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useGestureStore } from '../stores/gestureStore'
import { useUniverseStore } from '../stores/universeStore'
import { InteractionState } from '../types/gestures'

export function VirtualCursor() {
  const groupRef = useRef<THREE.Group>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const coreRef = useRef<THREE.Mesh>(null)
  const targetRingRef = useRef<THREE.Mesh>(null)

  const cursor = useGestureStore((s) => s.cursor)
  const interactionState = useGestureStore((s) => s.interactionState)
  const selectedObjectId = useUniverseStore((s) => s.selectedObjectId)
  const { camera } = useThree()

  // Target vector in 3D world space
  const targetVec = useRef(new THREE.Vector3())
  const currentPos = useRef(new THREE.Vector3())

  useFrame((_, delta) => {
    if (!groupRef.current) return

    if (!cursor.visible && !cursor.active) {
      groupRef.current.visible = false
      return
    }

    groupRef.current.visible = true

    // Map normalized 0..1 to NDC (-1..1)
    const ndcX = (cursor.x - 0.5) * 2
    const ndcY = -(cursor.y - 0.5) * 2

    // Unproject to camera plane at fixed distance (e.g. 15 units ahead of camera)
    const planeDist = 15
    targetVec.current.set(ndcX, ndcY, 0.5).unproject(camera)
    const dir = targetVec.current.sub(camera.position).normalize()
    const worldDest = camera.position.clone().add(dir.multiplyScalar(planeDist))

    // Exponential smoothing in world space
    currentPos.current.lerp(worldDest, 1 - Math.exp(-20 * delta))
    groupRef.current.position.copy(currentPos.current)
    groupRef.current.quaternion.copy(camera.quaternion)

    // Dynamic scale and animation based on interaction state
    if (ringRef.current) {
      let targetScale = 1.0
      let ringColor = '#00f0ff'

      switch (interactionState) {
        case InteractionState.PINCHING:
          targetScale = 0.55 + Math.min(1.0, cursor.pinchDistance * 5) * 0.45
          ringColor = '#00ffaa'
          break
        case InteractionState.GRABBING:
          targetScale = 1.45
          ringColor = '#ffaa00'
          break
        case InteractionState.POINTING:
        case InteractionState.ROTATING:
          targetScale = 1.0
          ringColor = '#38bdf8'
          break
        case InteractionState.ZOOMING:
          targetScale = 1.25
          ringColor = '#a855f7'
          break
        default:
          targetScale = 1.0
          ringColor = '#00f0ff'
      }

      ringRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 15)
      ringRef.current.rotation.z += delta * 1.5

      const mat = ringRef.current.material as THREE.MeshBasicMaterial
      if (mat) {
        mat.color.set(ringColor)
      }
    }

    if (coreRef.current) {
      const pulse = 1.0 + Math.sin(Date.now() * 0.008) * 0.2
      coreRef.current.scale.set(pulse, pulse, pulse)
    }

    if (targetRingRef.current) {
      targetRingRef.current.visible = !!selectedObjectId
      targetRingRef.current.rotation.z -= delta * 2.0
    }
  })

  return (
    <group ref={groupRef} visible={false}>
      {/* Central glowing core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
      </mesh>

      {/* Primary HUD reticle ring */}
      <mesh ref={ringRef}>
        <ringGeometry args={[0.22, 0.26, 32]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>

      {/* Outer corner marks / brackets */}
      <mesh rotation={[0, 0, Math.PI / 4]}>
        <ringGeometry args={[0.34, 0.36, 4]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>

      {/* Selected object lock-on ring */}
      <mesh ref={targetRingRef} visible={false}>
        <ringGeometry args={[0.42, 0.46, 6]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.9} side={THREE.DoubleSide} />
      </mesh>

      {/* Point light attached to cursor for atmospheric glow on nearby 3D objects */}
      <pointLight color="#00f0ff" intensity={1.5} distance={5} />
    </group>
  )
}
