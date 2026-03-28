import { NextRequest, NextResponse } from 'next/server'

interface GooglePlace {
  name: string
  vicinity: string
  rating?: number
  place_id: string
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const neighborhood = searchParams.get('neighborhood')
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')

  if (!neighborhood) {
    return NextResponse.json({ error: 'neighborhood required' }, { status: 400 })
  }

  // Build Njuškalo search URL for this neighborhood
  const njuskalSlug = neighborhood
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[čć]/g, 'c')
    .replace(/[šđž]/g, s => ({ š: 's', đ: 'd', ž: 'z' }[s] ?? s))
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')

  const njuskalUrl = `https://www.njuskalo.hr/iznajmljivanje-stanova/zagreb-${njuskalSlug}`

  let places: GooglePlace[] = []

  // Fetch nearby real estate agencies from Google Places
  if (lat && lng) {
    try {
      const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      if (key) {
        const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json`
          + `?location=${lat},${lng}`
          + `&radius=2000`
          + `&type=real_estate_agency`
          + `&key=${key}`
        const res = await fetch(placesUrl)
        const data = await res.json()
        places = (data.results ?? []).slice(0, 5).map((p: Record<string, unknown>) => ({
          name: p.name as string,
          vicinity: p.vicinity as string,
          rating: p.rating as number | undefined,
          place_id: p.place_id as string,
        }))
      }
    } catch {
      // ignore
    }
  }

  return NextResponse.json({
    njuskalUrl,
    places,
    listings: [], // Scraping not implemented — use njuskalUrl direct link
  })
}
