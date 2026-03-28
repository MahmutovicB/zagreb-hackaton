import { NextRequest, NextResponse } from 'next/server'
import { buildPlatformLinks } from '@/lib/apartment-platforms'

interface GooglePlace {
  name: string
  vicinity: string
  rating?: number
  place_id: string
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const neighborhood = searchParams.get('neighborhood')
  const id = searchParams.get('id') ?? ''
  const lat = parseFloat(searchParams.get('lat') ?? '45.815')
  const lng = parseFloat(searchParams.get('lng') ?? '15.982')

  if (!neighborhood) {
    return NextResponse.json({ error: 'neighborhood required' }, { status: 400 })
  }

  const platformLinks = buildPlatformLinks({
    nameCroatian: neighborhood,
    id,
    lat,
    lng,
  })

  let places: GooglePlace[] = []

  try {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (key) {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json`
          + `?location=${lat},${lng}&radius=2000&type=real_estate_agency&key=${key}`
      )
      const data = await res.json()
      places = (data.results ?? []).slice(0, 5).map((p: Record<string, unknown>) => ({
        name: p.name as string,
        vicinity: p.vicinity as string,
        rating: p.rating as number | undefined,
        place_id: p.place_id as string,
      }))
    }
  } catch {
    // supplementary — ignore errors
  }

  return NextResponse.json({ platformLinks, places })
}
