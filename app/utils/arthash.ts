import { codec, decode, encodeRgba, init, toSvgSync } from 'arthash'
import arthashWasmUrl from 'arthash/wasm/pkg/arthash_wasm_bg.wasm?url'
import { shallowRef } from 'vue'

// New hashes use the same codec as Liora. The old codec remains available so
// photos generated before this migration keep rendering correctly.
export const ARTHASH_CODEC = codec.rect({ n: 64 })
const LEGACY_ARTHASH_CODEC = codec.triangle({ n: 12 })
const LEGACY_HASH_MAX_BYTES = 160

// Match the playground's default Gallery pipeline. The hash bytes are
// independent from render size; this only controls the SVG viewBox scale and
// keeps cornerRadius visually identical to the reference implementation.
const SVG_BASE_SIZE = 512
const SVG_STYLE = { cornerRadius: 4 } as const

export const arthashReady = shallowRef(false)
let initPromise: Promise<void> | null = null

export function ensureArthashReady(): Promise<void> {
  if (!initPromise) {
    initPromise = init(arthashWasmUrl)
      .then(() => {
        arthashReady.value = true
      })
      .catch((error) => {
        console.warn('Failed to initialize arthash:', error)
      })
  }
  return initPromise
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunkSize = 0x8000
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize))
  }
  return btoa(binary)
}

function base64ToBytes(value: string): Uint8Array {
  if (typeof atob === 'function') {
    const binary = atob(value)
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.codePointAt(index) || 0
    }
    return bytes
  }

  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(value, 'base64'))
  }

  throw new Error('No base64 decoder available.')
}

function isLegacyHash(bytes: Uint8Array): boolean {
  return bytes.length <= LEGACY_HASH_MAX_BYTES
}

function renderSvg(bytes: Uint8Array): string {
  if (isLegacyHash(bytes)) {
    return toSvgSync(bytes, LEGACY_ARTHASH_CODEC, { baseSize: SVG_BASE_SIZE })
  }

  return toSvgSync(bytes, ARTHASH_CODEC, {
    baseSize: SVG_BASE_SIZE,
    style: SVG_STYLE,
  })
}

export async function encodeArthash(
  rgba: Uint8Array,
  width: number,
  height: number,
): Promise<string> {
  const hash = await encodeRgba(rgba, width, height, ARTHASH_CODEC)
  return bytesToBase64(hash)
}

export async function decodeArthash(value: string, baseSize = 64) {
  const bytes = base64ToBytes(value)
  await ensureArthashReady()

  if (isLegacyHash(bytes)) {
    return decode(bytes, LEGACY_ARTHASH_CODEC, { baseSize })
  }

  return decode(bytes, ARTHASH_CODEC, { baseSize })
}

export function decodeArthashToDataUrl(value: string | undefined): string | null {
  if (!value || !arthashReady.value) {
    return null
  }

  try {
    const svg = renderSvg(base64ToBytes(value))
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  } catch (error) {
    console.warn('Failed to decode arthash:', error)
    return null
  }
}

export function decodeArthashToSvg(value: string | undefined): string | null {
  if (!value || !arthashReady.value) {
    return null
  }

  try {
    const svg = renderSvg(base64ToBytes(value))
    return svg.replace(/<svg\b([^>]*)>/, '<svg$1 preserveAspectRatio="none">')
  } catch (error) {
    console.warn('Failed to decode arthash:', error)
    return null
  }
}
