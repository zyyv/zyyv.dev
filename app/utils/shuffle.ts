export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  let state = Math.floor(seed * 0xffffffff) || 1
  const result = [...items]

  function random() {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }

  for (let index = result.length - 1; index > 0; index--) {
    const target = Math.floor(random() * (index + 1))
    ;[result[index], result[target]] = [result[target]!, result[index]!]
  }

  return result
}

export function hashFraction(value: string, salt = 0): number {
  let hash = 2166136261 ^ salt
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) / 4294967295
}
