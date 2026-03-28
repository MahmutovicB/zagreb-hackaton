import { NextRequest, NextResponse } from 'next/server'
import { extractCriteria, generateNarrative } from '@/lib/gemini'
import { fetchKomunalneAktivnosti, fetchKindergartens, fetchAirQuality } from '@/lib/datasets'
import { scoreNeighborhood } from '@/lib/scoring'
import { getCommuteMinutes } from '@/lib/geocoding'
import neighborhoods from '@/data/neighborhoods.json'
import type { NeighborhoodMeta } from '@/types'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json()
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query required' }, { status: 400 })
    }

    // Parallel: extract criteria + fetch all live data
    const [criteria, activeWorks, kindergartens, airQuality] = await Promise.all([
      extractCriteria(query),
      fetchKomunalneAktivnosti(),
      fetchKindergartens(),
      fetchAirQuality(),
    ])

    const liveData = { activeWorks, kindergartens, airQuality }

    // Score all neighborhoods (initial pass without commute)
    const initialScores = (neighborhoods as NeighborhoodMeta[]).map(neighborhood =>
      scoreNeighborhood({ neighborhood, criteria, liveData })
    ).sort((a, b) => b.score - a.score)

    // Calculate commute for top 5 if workLocation specified
    if (criteria.workLocation) {
      const destination = criteria.workLocation.toLowerCase().includes('zagreb')
        ? criteria.workLocation
        : criteria.workLocation + ', Zagreb'
      const top5 = initialScores.slice(0, 5)
      const commuteResults = await Promise.all(
        top5.map(n => getCommuteMinutes(n.centroid, destination))
      )
      commuteResults.forEach((minutes, idx) => {
        const n = top5[idx]
        const neighborhood = (neighborhoods as NeighborhoodMeta[]).find(nb => nb.id === n.id)!
        const updated = scoreNeighborhood({ neighborhood, criteria, liveData, commuteMinutes: minutes })
        initialScores[idx] = updated
      })
      initialScores.sort((a, b) => b.score - a.score)
    }

    // Generate narrative
    const narrative = await generateNarrative(query, initialScores, criteria)

    return NextResponse.json({
      criteria,
      neighborhoods: initialScores,
      narrative,
    })
  } catch (err) {
    console.error('/api/match error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
