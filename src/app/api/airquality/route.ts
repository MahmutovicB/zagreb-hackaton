import { NextResponse } from 'next/server'
import { fetchAirQuality } from '@/lib/datasets'

export const revalidate = 1800

export async function GET() {
  try {
    const stations = await fetchAirQuality()
    return NextResponse.json({ stations, lastUpdated: new Date().toISOString() })
  } catch {
    return NextResponse.json({ stations: [], lastUpdated: new Date().toISOString() }, { status: 500 })
  }
}
