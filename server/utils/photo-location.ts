import type { PhotoExif, PhotoLocation } from '~/types'

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse'
const NOMINATIM_USER_AGENT = 'zyyv.dev-photo-location/1.0 (+https://zyyv.dev)'
const NOMINATIM_MIN_INTERVAL_MS = 1100

let lastNominatimRequestAt = 0
let requestQueue = Promise.resolve()

interface NominatimResponse {
  display_name?: string
  osm_type?: string
  osm_id?: number
  address?: Record<string, string | undefined>
}

function validCoordinate(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max
}

function firstAddressValue(address: Record<string, string | undefined>, keys: string[]) {
  return keys.map((key) => address[key]?.trim()).find(Boolean)
}

function toOsmUrl(type: string | undefined, id: number | undefined) {
  if (!type || typeof id !== 'number' || !Number.isInteger(id) || id <= 0) return undefined
  return `https://www.openstreetmap.org/${type}/${id}`
}

function waitForRateLimit() {
  const delay = Math.max(0, NOMINATIM_MIN_INTERVAL_MS - (Date.now() - lastNominatimRequestAt))
  return new Promise<void>((resolve) => setTimeout(resolve, delay))
}

async function requestNominatim(latitude: number, longitude: number) {
  const request = requestQueue.then(async () => {
    await waitForRateLimit()
    lastNominatimRequestAt = Date.now()

    const params = new URLSearchParams({
      format: 'jsonv2',
      addressdetails: '1',
      zoom: '18',
      'accept-language': 'zh-CN,zh;q=0.9,en',
      lat: String(latitude),
      lon: String(longitude),
    })
    const response = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': NOMINATIM_USER_AGENT,
      },
    })
    if (!response.ok) return undefined
    return (await response.json()) as NominatimResponse
  })

  requestQueue = request.then(
    () => undefined,
    () => undefined,
  )
  return request
}

function compactLocation(result: NominatimResponse | undefined): PhotoLocation | undefined {
  if (!result) return undefined
  const displayName = result.display_name?.trim()
  if (!displayName) return undefined

  const address = result.address || {}
  const road = firstAddressValue(address, ['road', 'pedestrian', 'footway', 'path', 'residential'])
  const city = firstAddressValue(address, ['city', 'town', 'village', 'municipality'])

  return {
    provider: 'nominatim',
    displayName: displayName.slice(0, 500),
    ...(road ? { road } : {}),
    ...(city ? { city } : {}),
    ...(address.state?.trim() ? { state: address.state.trim() } : {}),
    ...(address.country?.trim() ? { country: address.country.trim() } : {}),
    ...(result.osm_type ? { osmType: result.osm_type } : {}),
    ...(Number.isInteger(result.osm_id) ? { osmId: result.osm_id } : {}),
    ...(toOsmUrl(result.osm_type, result.osm_id)
      ? { osmUrl: toOsmUrl(result.osm_type, result.osm_id) }
      : {}),
  }
}

export async function reverseGeocodePhotoLocation(
  gps: PhotoExif['gps'],
): Promise<PhotoLocation | undefined> {
  const latitude = gps?.latitude
  const longitude = gps?.longitude
  if (!validCoordinate(latitude, -90, 90) || !validCoordinate(longitude, -180, 180)) {
    return undefined
  }

  try {
    return compactLocation(await requestNominatim(latitude, longitude))
  } catch {
    return undefined
  }
}

export async function enrichPhotoExif(exif: PhotoExif | undefined): Promise<PhotoExif | undefined> {
  if (!exif?.gps || exif.location) return exif
  const location = await reverseGeocodePhotoLocation(exif.gps)
  return location ? { ...exif, location } : exif
}
