export type ArthashShape = 'dct' | 'circle' | 'triangle' | 'square' | 'rect' | 'pixel'
export type ArthashColor = 'rgb565' | 'rgb888'
export type ArthashSearchStrategy = 'primitive' | 'topk_uniform'
export type ArthashPixelSmooth = 'nearest' | 'bilinear'

export interface ArthashConfig {
  shape: ArthashShape
  n: number
  color: ArthashColor
  seed: number
  searchEnabled: boolean
  searchStrategy: ArthashSearchStrategy
  nRandom: number
  nTopk: number
  hillClimbSteps: number
  hillClimbMaxAge: number | null
  nAttempts: number
  baseSize: number
  aa: number
  pixelSmooth: ArthashPixelSmooth
  overrideAspect: number | null
  blur: number
  cornerRadius: number
}

export const DEFAULT_ARTHASH_CONFIG: ArthashConfig = {
  shape: 'rect',
  n: 64,
  color: 'rgb565',
  seed: 0,
  searchEnabled: false,
  searchStrategy: 'primitive',
  nRandom: 64,
  nTopk: 8,
  hillClimbSteps: 32,
  hillClimbMaxAge: 8,
  nAttempts: 1,
  baseSize: 512,
  aa: 1,
  pixelSmooth: 'nearest',
  overrideAspect: null,
  blur: 0,
  cornerRadius: 4,
}

const SHAPES = new Set<ArthashShape>(['dct', 'circle', 'triangle', 'square', 'rect', 'pixel'])
const COLORS = new Set<ArthashColor>(['rgb565', 'rgb888'])
const SEARCH_STRATEGIES = new Set<ArthashSearchStrategy>(['primitive', 'topk_uniform'])
const PIXEL_SMOOTH_VALUES = new Set<ArthashPixelSmooth>(['nearest', 'bilinear'])

function boundedNumber(value: unknown, fallback: number, min: number, max: number) {
  const number = typeof value === 'number' && Number.isFinite(value) ? value : fallback
  return Math.min(max, Math.max(min, number))
}

export function normalizeArthashConfig(value: unknown): ArthashConfig | undefined {
  if (!value || typeof value !== 'object') return undefined
  const input = value as Partial<ArthashConfig>
  const shape = SHAPES.has(input.shape as ArthashShape)
    ? (input.shape as ArthashShape)
    : DEFAULT_ARTHASH_CONFIG.shape
  const color = COLORS.has(input.color as ArthashColor)
    ? (input.color as ArthashColor)
    : DEFAULT_ARTHASH_CONFIG.color
  const searchStrategy = SEARCH_STRATEGIES.has(input.searchStrategy as ArthashSearchStrategy)
    ? (input.searchStrategy as ArthashSearchStrategy)
    : DEFAULT_ARTHASH_CONFIG.searchStrategy
  const pixelSmooth = PIXEL_SMOOTH_VALUES.has(input.pixelSmooth as ArthashPixelSmooth)
    ? (input.pixelSmooth as ArthashPixelSmooth)
    : DEFAULT_ARTHASH_CONFIG.pixelSmooth
  const overrideAspect =
    input.overrideAspect === null || input.overrideAspect === undefined
      ? null
      : boundedNumber(input.overrideAspect, 1, 0.1, 10)

  return {
    shape,
    n: shape === 'dct' ? 0 : Math.round(boundedNumber(input.n, DEFAULT_ARTHASH_CONFIG.n, 4, 128)),
    color,
    seed: Math.round(boundedNumber(input.seed, DEFAULT_ARTHASH_CONFIG.seed, 0, 2147483647)),
    searchEnabled: Boolean(input.searchEnabled),
    searchStrategy,
    nRandom: Math.round(boundedNumber(input.nRandom, DEFAULT_ARTHASH_CONFIG.nRandom, 1, 512)),
    nTopk: Math.round(boundedNumber(input.nTopk, DEFAULT_ARTHASH_CONFIG.nTopk, 1, 128)),
    hillClimbSteps: Math.round(
      boundedNumber(input.hillClimbSteps, DEFAULT_ARTHASH_CONFIG.hillClimbSteps, 1, 256),
    ),
    hillClimbMaxAge:
      input.hillClimbMaxAge === null
        ? null
        : Math.round(
            boundedNumber(
              input.hillClimbMaxAge,
              DEFAULT_ARTHASH_CONFIG.hillClimbMaxAge ?? 8,
              1,
              256,
            ),
          ),
    nAttempts: Math.round(boundedNumber(input.nAttempts, DEFAULT_ARTHASH_CONFIG.nAttempts, 1, 8)),
    baseSize: Math.round(boundedNumber(input.baseSize, DEFAULT_ARTHASH_CONFIG.baseSize, 32, 1024)),
    aa: Math.round(boundedNumber(input.aa, DEFAULT_ARTHASH_CONFIG.aa, 1, 4)),
    pixelSmooth,
    overrideAspect,
    blur: boundedNumber(input.blur, DEFAULT_ARTHASH_CONFIG.blur, 0, 24),
    cornerRadius: boundedNumber(input.cornerRadius, DEFAULT_ARTHASH_CONFIG.cornerRadius, 0, 24),
  }
}

export function parseArthashConfig(value: string | null | undefined) {
  if (!value) return undefined
  try {
    return normalizeArthashConfig(JSON.parse(value))
  } catch {
    return undefined
  }
}

export function serializeArthashConfig(value: unknown) {
  const normalized = normalizeArthashConfig(value)
  if (!normalized) return null
  const serialized = JSON.stringify(normalized)
  if (serialized.length > 2048) return null
  return serialized
}
