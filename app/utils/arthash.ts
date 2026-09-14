import { codec, decode, encodeRgba } from 'arthash'

// arthash hashes do not carry their codec configuration, so this must remain
// shared by both the encoder and every decoder in the app.
export const ARTHASH_CODEC = codec.triangle({ n: 12 })

function bytesToBase64(bytes: Uint8Array) {
  let binary = ''
  const chunkSize = 0x8000
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize))
  }
  return btoa(binary)
}

function base64ToBytes(value: string) {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

export async function encodeArthash(rgba: Uint8Array, width: number, height: number) {
  const hash = await encodeRgba(rgba, width, height, ARTHASH_CODEC)
  return bytesToBase64(hash)
}

export async function decodeArthash(value: string, baseSize = 64) {
  return decode(base64ToBytes(value), ARTHASH_CODEC, { baseSize })
}
