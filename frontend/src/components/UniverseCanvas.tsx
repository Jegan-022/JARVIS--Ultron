import { Canvas } from '@react-three/fiber'
import { UniverseScene } from '../scenes/UniverseScene'
import { useUniverseStore } from '../stores/universeStore'

export function UniverseCanvas() {
  return (
    <Canvas
      className="universe-canvas"
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      }}
      dpr={[1, 1.75]}
      camera={{ position: [0, 8, 42], fov: 55, near: 0.1, far: 280 }}
      onPointerMissed={() => {
        useUniverseStore.getState().selectObject(null)
      }}
    >
      <color attach="background" args={['#02040a']} />
      <fog attach="fog" args={['#02040a', 48, 150]} />
      <UniverseScene />
    </Canvas>
  )
}
