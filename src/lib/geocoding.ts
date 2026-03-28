interface LatLng {
  lat: number
  lng: number
}

export async function geocodeAddress(address: string): Promise<LatLng | null> {
  try {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!key) return null
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`
    const res = await fetch(url)
    const data = await res.json()
    if (data.results?.[0]?.geometry?.location) {
      return data.results[0].geometry.location as LatLng
    }
    return null
  } catch {
    return null
  }
}

export async function getCommuteMinutes(
  origin: LatLng,
  destination: string,
  mode: 'transit' | 'bicycling' | 'walking' = 'transit'
): Promise<number | null> {
  try {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!key) return null
    const url = `https://maps.googleapis.com/maps/api/directions/json`
      + `?origin=${origin.lat},${origin.lng}`
      + `&destination=${encodeURIComponent(destination)}`
      + `&mode=${mode}`
      + `&key=${key}`
    const res = await fetch(url)
    const data = await res.json()
    const duration = data.routes?.[0]?.legs?.[0]?.duration?.value
    return duration ? Math.round(duration / 60) : null
  } catch {
    return null
  }
}

export function distanceMeters(a: LatLng, b: LatLng): number {
  const R = 6371000
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLng = (b.lng - a.lng) * Math.PI / 180
  const sinLat = Math.sin(dLat / 2)
  const sinLng = Math.sin(dLng / 2)
  const aVal = sinLat * sinLat + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * sinLng * sinLng
  return R * 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal))
}
