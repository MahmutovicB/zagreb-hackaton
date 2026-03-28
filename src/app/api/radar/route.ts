import { NextResponse } from 'next/server'
import { fetchKomunalneAktivnosti } from '@/lib/datasets'
import { geocodeAddress } from '@/lib/geocoding'

export const revalidate = 300

export async function GET() {
  try {
    const allWorks = await fetchKomunalneAktivnosti()
    const today = new Date()
    const sevenDaysAgo = new Date(today.getTime() - 7 * 86400000)

    const active = allWorks.filter(w => {
      if (w.status === 'završeno') {
        const end = new Date(w.endDate)
        return end > sevenDaysAgo
      }
      return true
    })

    // Geocode entries missing coordinates
    const geocoded = await Promise.all(
      active.map(async w => {
        if (w.lat && w.lng) return w
        if (!w.address) return w
        const coords = await geocodeAddress(w.address + ', Zagreb')
        if (coords) return { ...w, lat: coords.lat, lng: coords.lng }
        return w
      })
    )

    return NextResponse.json({
      works: geocoded,
      lastUpdated: new Date().toISOString(),
    })
  } catch (err) {
    console.error('/api/radar error:', err)
    return NextResponse.json({ works: [], lastUpdated: new Date().toISOString() }, { status: 500 })
  }
}
