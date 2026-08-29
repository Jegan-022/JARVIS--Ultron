import { Color } from 'three'

// Morgan-Keenan spectral classification colors
const STELLAR_COLORS = [
  new Color('#9bb0ff'), // O/B: Hot blue stars (5%)
  new Color('#aabfff'), // B: Blue-white (10%)
  new Color('#cad8ff'), // A: White (15%)
  new Color('#fbf8ff'), // F: Yellow-white (20%)
  new Color('#fff4e8'), // G: Yellow / Sun-like (25%)
  new Color('#ffd2a1'), // K: Orange (15%)
  new Color('#ff9f68'), // M: Red dwarf (10%)
]

export function createSpiralGalaxy(count: number): {
  positions: Float32Array
  colors: Float32Array
  sizes: Float32Array
} {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const arms = 4
  const dustColor = new Color('#0f172a')

  for (let i = 0; i < count; i++) {
    const arm = i % arms
    // Logarithmic spiral distribution
    const radius = Math.pow(Math.random(), 0.48) * 42
    const spin = radius * 0.32
    // Thicker arms near center, tapered spread
    const spread = (Math.random() - 0.5) * (0.2 + radius * 0.015)
    const angle = (arm / arms) * Math.PI * 2 + spin + spread
    // Flatter galactic disk with exponential vertical scale height
    const height = (Math.random() - 0.5) * Math.exp(-radius * 0.07) * 2.8

    positions[i * 3] = Math.cos(angle) * radius
    positions[i * 3 + 1] = height
    positions[i * 3 + 2] = Math.sin(angle) * radius

    // Distance normalized ratio
    const normR = radius / 42

    // Stellar spectral distribution: older yellow/red in core, young blue in spiral arms
    let starColor: Color
    if (normR < 0.25) {
      // Core: predominantly yellow/orange/white stars
      const colorIdx = 3 + Math.floor(Math.random() * 4) // F, G, K, M
      starColor = STELLAR_COLORS[colorIdx].clone()
    } else {
      // Arms: mixture of hot blue/white young stars and intermediate stars
      const rand = Math.random()
      const colorIdx = rand < 0.35 ? 0 : rand < 0.65 ? 1 : rand < 0.85 ? 2 : 4
      starColor = STELLAR_COLORS[colorIdx].clone()
    }

    // 12% dust absorption lanes along inner edges of spiral arms
    if (Math.random() < 0.12 && normR > 0.2) {
      starColor.lerp(dustColor, 0.75)
    }

    colors[i * 3] = starColor.r
    colors[i * 3 + 1] = starColor.g
    colors[i * 3 + 2] = starColor.b

    // Brighter, denser stars in core
    sizes[i] = 0.5 + Math.random() * 1.8 + (1 - normR) * 0.9
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

  for (let i = 0; i < count; i++) {
    const r = 60 + Math.random() * 120
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6
    positions[i * 3 + 2] = r * Math.cos(phi)

    const c = STELLAR_COLORS[Math.floor(Math.random() * STELLAR_COLORS.length)]
    colors[i * 3] = c.r
    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b
    sizes[i] = 0.3 + Math.random() * 1.2
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
