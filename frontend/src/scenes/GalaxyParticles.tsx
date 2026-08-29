import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  ShaderMaterial,
} from 'three'
import { createCluster, createSpiralGalaxy, createStarField } from './galaxyGeometry'

const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColor;
  varying vec3 vColor;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uSpin;

  void main() {
    vColor = aColor;
    vec3 pos = position;
    float dist = length(pos.xz) + 0.001;
    float angle = uTime * uSpin * (1.4 / (dist * 0.06 + 1.0));
    float c = cos(angle);
    float s = sin(angle);
    float x = pos.x * c - pos.z * s;
    float z = pos.x * s + pos.z * c;
    pos.x = x;
    pos.z = z;
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * uPixelRatio * (100.0 / max(1.0, -mvPosition.z));
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float d = length(uv);
    if (d > 0.5) discard;
    float alpha = smoothstep(0.5, 0.04, d);
    gl_FragColor = vec4(vColor, alpha);
  }
`

function ParticleCloud({
  positions,
  colors,
  sizes,
  spin = 0.015,
  opacity = 0.9,
}: {
  positions: Float32Array
  colors: Float32Array
  sizes: Float32Array
  spin?: number
  opacity?: number
}) {
  const material = useRef<ShaderMaterial>(null)
  const geometry = useMemo(() => {
    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(positions, 3))
    geo.setAttribute('aColor', new BufferAttribute(colors, 3))
    geo.setAttribute('aSize', new BufferAttribute(sizes, 1))
    return geo
  }, [positions, colors, sizes])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2) },
      uSpin: { value: spin },
    }),
    [spin],
  )

  useFrame((_, dt) => {
    if (!material.current) return
    material.current.uniforms.uTime.value += dt
  })

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        opacity={opacity}
      />
    </points>
  )
}

export function StarField() {
  const data = useMemo(() => createStarField(9500), [])
  return (
    <ParticleCloud
      positions={data.positions}
      colors={data.colors}
      sizes={data.sizes}
      spin={0.0008}
    />
  )
}

export function GalaxySpiral() {
  const spiral = useMemo(() => createSpiralGalaxy(32000), [])
  const clusterA = useMemo(() => createCluster(2200, [24, 2, -18], 5.0, '#38bdf8'), [])
  const clusterB = useMemo(() => createCluster(1800, [-20, -1, 22], 4.2, '#f59e0b'), [])
  const clusterC = useMemo(() => createCluster(1500, [10, 3, 26], 3.8, '#a855f7'), [])

  return (
    <group>
      <ParticleCloud positions={spiral.positions} colors={spiral.colors} sizes={spiral.sizes} spin={0.012} />
      <ParticleCloud
        positions={clusterA.positions}
        colors={clusterA.colors}
        sizes={clusterA.sizes}
        spin={0.035}
      />
      <ParticleCloud
        positions={clusterB.positions}
        colors={clusterB.colors}
        sizes={clusterB.sizes}
        spin={0.03}
      />
      <ParticleCloud
        positions={clusterC.positions}
        colors={clusterC.colors}
        sizes={clusterC.sizes}
        spin={0.028}
      />
    </group>
  )
}

export function GalaxyCore() {
  const glow = useMemo(() => new Color('#fde68a'), [])

  return (
    <group>
      {/* Supermassive Black Hole event horizon core */}
      <mesh>
        <sphereGeometry args={[1.25, 32, 32]} />
        <meshBasicMaterial color="#fffbeb" />
      </mesh>
      {/* Golden relativistic accretion glow */}
      <mesh>
        <sphereGeometry args={[2.8, 32, 32]} />
        <meshBasicMaterial color={glow} transparent opacity={0.22} />
      </mesh>
      {/* Outer halo */}
      <mesh>
        <sphereGeometry args={[4.8, 32, 32]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.07} />
      </mesh>
      <pointLight color="#fef3c7" intensity={22} distance={55} decay={2} />
    </group>
  )
}
