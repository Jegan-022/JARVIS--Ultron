import React, { useRef, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useUniverseStore } from '../stores/universeStore'
import { useGestureStore } from '../stores/gestureStore'
import type { InteractiveObjectMeta } from '../types/scene'

interface DraggableObjectProps {
  meta: InteractiveObjectMeta
  initialPosition: [number, number, number]
  children: React.ReactNode
  scale?: number
}

export function DraggableObject({ meta, initialPosition, children, scale = 1 }: DraggableObjectProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [pos, setPos] = useState<[number, number, number]>(initialPosition)
  const [hovered, setHovered] = useState(false)
  const [isGrabbed, setIsGrabbed] = useState(false)

  const selectedObjectId = useUniverseStore((s) => s.selectedObjectId)
  const selectObject = useUniverseStore((s) => s.selectObject)
  const registerObject = useUniverseStore((s) => s.registerObject)

  const cursor = useGestureStore((s) => s.cursor)
  const { camera } = useThree()

  // Register object in store metadata list on mount
  useEffect(() => {
    registerObject(meta)
  }, [meta, registerObject])

  const isSelected = selectedObjectId === meta.id

  useFrame(() => {
    if (!groupRef.current) return

    // Pinch-grab spatial collision detection
    if (cursor.active && cursor.visible) {
      // Unproject cursor to screen space vs object world position projected
      const objWorldPos = new THREE.Vector3()
      groupRef.current.getWorldPosition(objWorldPos)
      const screenPos = objWorldPos.clone().project(camera)

      const screenX = (screenPos.x + 1) / 2
      const screenY = (-screenPos.y + 1) / 2

      const dist = Math.hypot(cursor.x - screenX, cursor.y - screenY)

      if (dist < 0.08) {
        if (cursor.isPinching || cursor.isGrabbing) {
          if (!isGrabbed) {
            setIsGrabbed(true)
            selectObject(meta.id)
          }
        }
      }

      if (isGrabbed) {
        if (!cursor.isPinching && !cursor.isGrabbing) {
          setIsGrabbed(false)
        } else {
          // Object follows cursor in 3D world space
          const ndcX = (cursor.x - 0.5) * 2
          const ndcY = -(cursor.y - 0.5) * 2
          const planeDist = camera.position.distanceTo(groupRef.current.position)
          const targetVec = new THREE.Vector3(ndcX, ndcY, 0.5).unproject(camera)
          const dir = targetVec.sub(camera.position).normalize()
          const newWorldPos = camera.position.clone().add(dir.multiplyScalar(planeDist))

          if (groupRef.current.parent) {
            groupRef.current.parent.worldToLocal(newWorldPos)
          }

          groupRef.current.position.lerp(newWorldPos, 0.25)
          setPos([groupRef.current.position.x, groupRef.current.position.y, groupRef.current.position.z])
        }
      }
    } else if (isGrabbed) {
      setIsGrabbed(false)
    }
  })

  return (
    <group
      ref={groupRef}
      position={pos}
      scale={scale * (isGrabbed ? 1.25 : hovered || isSelected ? 1.15 : 1)}
      onClick={(e) => {
        e.stopPropagation()
        selectObject(meta.id)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHovered(false)
        document.body.style.cursor = 'default'
      }}
    >
      {children}

      {/* Futuristic Target / Selection Ring */}
      {(isSelected || hovered || isGrabbed) && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[scale * 1.3, scale * 1.4, 32]} />
          <meshBasicMaterial
            color={isGrabbed ? '#ffaa00' : isSelected ? '#00ffaa' : '#00f0ff'}
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  )
}
