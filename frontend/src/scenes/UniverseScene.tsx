import { useEffect, useRef } from 'react'
import { AdaptiveDpr } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import type { Group } from 'three'
import { SceneId } from '../types/scene'
import { GalaxyScene } from './GalaxyScene'
import { SolarSystemScene } from './SolarSystemScene'
import { EarthScene } from './EarthScene'
import { NeuralNetworkScene } from './NeuralNetworkScene'
import { DigitalGlobeScene } from './DigitalGlobeScene'
import { SystemVisualizationScene } from './SystemVisualizationScene'
import { StarField } from './GalaxyParticles'
import { VirtualCursor } from '../components/VirtualCursor'
import { spatialEngine } from '../gestures/SpatialInteractionEngine'
import { useUniverseStore } from '../stores/universeStore'

function FpsSampler() {
  const frames = useRef(0)
  const acc = useRef(0)

  useFrame((_, dt) => {
    frames.current += 1
    acc.current += dt
    if (acc.current >= 0.4) {
      useUniverseStore.getState().setFps(Math.round(frames.current / acc.current))
      frames.current = 0
      acc.current = 0
    }
  })

  return null
}

function PointerBridge() {
  const { gl, camera } = useThree()
  const dragging = useRef(false)
  const last = useRef({ x: 0, y: 0 })
  const lastHud = useRef(0)

  useEffect(() => {
    const el = gl.domElement

    const onDown = (event: PointerEvent) => {
      dragging.current = true
      last.current = { x: event.clientX, y: event.clientY }
      try {
        el.setPointerCapture(event.pointerId)
      } catch {
        /* capture is optional */
      }
    }
    const onMove = (event: PointerEvent) => {
      if (!dragging.current) return
      const dxPx = event.clientX - last.current.x
      const dyPx = event.clientY - last.current.y
      if (Math.abs(dxPx) < 2 && Math.abs(dyPx) < 2) return
      last.current = { x: event.clientX, y: event.clientY }
      spatialEngine.ingestPointerDelta(dxPx / window.innerWidth, dyPx / window.innerHeight)
    }
    const onUp = (event: PointerEvent) => {
      dragging.current = false
      try {
        el.releasePointerCapture(event.pointerId)
      } catch {
        /* ignore */
      }
    }
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      spatialEngine.ingestZoomDelta(event.deltaY)
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointerleave', onUp)
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointerleave', onUp)
      el.removeEventListener('wheel', onWheel)
    }
  }, [gl])

  useFrame((_, dt) => {
    const transform = spatialEngine.tick(dt)
    camera.position.set(0, transform.zoom * 0.18, transform.zoom)
    camera.lookAt(0, 0, 0)
    const now = performance.now()
    if (now - lastHud.current > 120) {
      lastHud.current = now
      useUniverseStore.getState().setInteractionState(spatialEngine.getState())
      useUniverseStore.getState().setCameraPosition([
        camera.position.x,
        camera.position.y,
        camera.position.z,
      ])
    }
  })

  return null
}

function SceneRenderer() {
  const group = useRef<Group>(null)
  const autoSpin = useRef(0)
  const sceneId = useUniverseStore((s) => s.sceneId)

  useFrame((_, dt) => {
    if (!group.current) return
    const transform = spatialEngine.peek()
    if (!useUniverseStore.getState().paused) {
      autoSpin.current += dt * 0.012
    }
    group.current.rotation.x = transform.rotationX
    group.current.rotation.y = transform.rotationY + autoSpin.current
  })

  return (
    <group ref={group}>
      {sceneId === SceneId.GALAXY && <GalaxyScene />}
      {sceneId === SceneId.SOLAR_SYSTEM && <SolarSystemScene />}
      {sceneId === SceneId.EARTH && <EarthScene />}
      {sceneId === SceneId.NEURAL_NETWORK && <NeuralNetworkScene />}
      {sceneId === SceneId.DIGITAL_GLOBE && <DigitalGlobeScene />}
      {sceneId === SceneId.SYSTEM_VISUALIZATION && <SystemVisualizationScene />}
    </group>
  )
}

export function UniverseScene() {
  return (
    <>
      <ambientLight intensity={0.18} />
      <hemisphereLight args={['#9bb8ff', '#05070e', 0.35]} />
      <directionalLight position={[12, 18, 8]} intensity={0.35} color="#d7e8ff" />
      <AdaptiveDpr pixelated />
      <StarField />
      <SceneRenderer />
      <VirtualCursor />
      <PointerBridge />
      <FpsSampler />
    </>
  )
}
