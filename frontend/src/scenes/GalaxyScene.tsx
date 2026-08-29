import { GalaxyCore, GalaxySpiral } from './GalaxyParticles'
import { OrbitalBodies, SpatialGrid } from './OrbitalObjects'

export function GalaxyScene() {
  return (
    <group>
      <GalaxySpiral />
      <GalaxyCore />
      <OrbitalBodies />
      <SpatialGrid />
    </group>
  )
}
