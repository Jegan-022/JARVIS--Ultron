import { Color } from 'three'

export function createSpiralGalaxy(count: number): {
  positions: Float32Array
  colors: Float32Array
  sizes: Float32Array
} {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const arms = 4
  const inner = new Color('#9fd4ff')
  const mid = new Color('#7aa2ff')
  const outer = new Color('#c48cff')
  const dust = new Color('#3a4a7a')

  for (let i = 0; i < count; i++) {
    const arm = i % arms
    const radius = Math.pow(Math.random(), 0.52) * 38
    const spin = radius * 0.38
    const spread = (Math.random() - 0.5) * (0.22 + radius * 0.012)
    const angle = (arm / arms) * Math.PI * 2 + spin + spread
    const height = (Math.random() - 0.5) * Math.exp(-radius * 0.09) * 3.4

    positions[i * 3] = Math.cos(angle) * radius
    positions[i * 3 + 1] = height
    positions[i * 3 + 2] = Math.sin(angle) * radius

    const t = radius / 38
    const color = inner.clone().lerp(mid, Math.min(1, t * 1.4)).lerp(outer, t)
    if (Math.random() > 0.82) {
      color.lerp(dust, 0.55)
    }
    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b
    sizes[i] = 0.6 + Math.random() * 1.8 + (1 - t) * 0.8
  }

  return { positions, colors, sizes }
}

export function createStarField(count: number): {
  positions: Float32Array
  colors: Float32Array
  sizes: Float32Array
} {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const palette = ['#d7e7ff', '#ffffff', '#b8c6ff', '#ffe8c8', '#9ad7ff']

  for (let i = 0; i < count; i++) {
    const r = 55 + Math.random() * 90
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.55
    positions[i * 3 + 2] = r * Math.cos(phi)

    const c = new Color(palette[i % palette.length])
    colors[i * 3] = c.r
    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b
    sizes[i] = 0.35 + Math.random() * 1.1
  }

  return { positions, colors, sizes }
}

export function createCluster(
  count: number,
  origin: [number, number, number],
  radius: number,
  hue: string,
): {
  positions: Float32Array
  colors: Float32Array
  sizes: Float32Array
} {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const base = new Color(hue)

  for (let i = 0; i < count; i++) {
    const u = Math.random()
    const v = Math.random()
    const theta = 2 * Math.PI * u
    const phi = Math.acos(2 * v - 1)
    const dist = radius * Math.cbrt(Math.random())
    positions[i * 3] = origin[0] + dist * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = origin[1] + dist * Math.sin(phi) * Math.sin(theta) * 0.6
    positions[i * 3 + 2] = origin[2] + dist * Math.cos(phi)
    const shade = 0.65 + Math.random() * 0.35
    colors[i * 3] = base.r * shade
    colors[i * 3 + 1] = base.g * shade
    colors[i * 3 + 2] = base.b * shade
    sizes[i] = 0.5 + Math.random() * 1.4
  }

  return { positions, colors, sizes }
}
