import type { Ref } from 'vue'
import type { Photo } from '~/types'

export interface BackgroundPhotoSource {
  url: string
  aspect: number
  center: readonly [number, number]
  halfSize: readonly [number, number]
  angle: number
  depth: number
  drift: readonly [number, number]
}

const PHOTO_COUNT = 5
const EDGE_ZONES = [
  { x: [0.07, 0.23], y: [0.08, 0.28] },
  { x: [0.78, 0.94], y: [0.07, 0.28] },
  { x: [0.04, 0.15], y: [0.38, 0.64] },
  { x: [0.07, 0.24], y: [0.73, 0.93] },
  { x: [0.77, 0.94], y: [0.7, 0.92] },
] as const

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function shuffled<T>(items: readonly T[]) {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index--) {
    const target = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[target]] = [result[target]!, result[index]!]
  }
  return result
}

function selectBackgroundPhotos(photos: Photo[]) {
  const selected = shuffled(photos).slice(0, PHOTO_COUNT)
  const zones = shuffled(EDGE_ZONES)

  return selected.map((photo, index) => {
    const zone = zones[index]!
    const width = randomBetween(0.105, 0.175)

    return {
      url: `/api/photo-assets/${encodeURIComponent(photo.id)}/thumbnail`,
      aspect: photo.width / Math.max(photo.height, 1),
      center: [randomBetween(zone.x[0], zone.x[1]), randomBetween(zone.y[0], zone.y[1])] as const,
      halfSize: [width, randomBetween(0.16, 0.255)] as [number, number],
      angle: randomBetween(-0.12, 0.12),
      depth: randomBetween(0.6, 1.45),
      drift: [randomBetween(-0.009, 0.009), randomBetween(-0.008, 0.008)] as const,
    }
  })
}

export function useBackgroundPhotos(routeKey: Readonly<Ref<string>>) {
  const photoSources = shallowRef<BackgroundPhotoSource[]>([])
  const { data } = usePublicPhotos({ lazy: true })

  watch(
    [() => data.value.photos, routeKey],
    ([photos]) => {
      photoSources.value = selectBackgroundPhotos(photos)
    },
    { immediate: true },
  )

  return {
    photoSources: readonly(photoSources),
  }
}
