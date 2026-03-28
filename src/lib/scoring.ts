import type { SearchCriteria, NeighborhoodScore, ScoreComponent, KomunalniWork, Kindergarten, AirQualityStation } from '@/types'
import type { NeighborhoodMeta } from '@/types'
import { distanceMeters } from './geocoding'

// ZET stops (tram + bus) — one representative stop per neighborhood
// Tram lines: 14 (Savski most–Mihaljevac/Dubec), 6/7 (Sopot–Črnomerec), 11/12 (Dubec–Dubrava), 17 (Prečko–Borongaj)
// Bus stops used for areas without trams (ZET also operates bus network)
const ZET_STOPS: Array<{ lat: number; lng: number; district: string }> = [
  { lat: 45.8131, lng: 15.9792, district: 'donji-grad' },         // Trg bana Jelačića — many tram lines
  { lat: 45.8119, lng: 15.9681, district: 'gornji-grad' },        // Ilica/Frankopanska tram 14 (Gornji grad is uphill, tram runs below)
  { lat: 45.7989, lng: 16.0050, district: 'trnje' },              // Savska/Vukovarska tram 6/7
  { lat: 45.8220, lng: 16.0180, district: 'maksimir' },           // Bukovačka tram 11/12
  { lat: 45.8050, lng: 16.0500, district: 'pescenica-zitnjak' }, // Kvaternikov trg tram 7
  { lat: 45.7780, lng: 16.0071, district: 'novi-zagreb-istok' }, // Jarunska tram 6/7
  { lat: 45.7750, lng: 15.9420, district: 'novi-zagreb-zapad' }, // Jarun tram 17
  { lat: 45.8105, lng: 15.9461, district: 'tresnjevka-sjever' }, // Ozaljska tram 14
  { lat: 45.7975, lng: 15.9431, district: 'tresnjevka-jug' },    // Savska cesta tram 14/17
  { lat: 45.8201, lng: 15.9230, district: 'crnomerec' },          // Črnomerec tram 14 terminus
  { lat: 45.8150, lng: 16.0700, district: 'donja-dubrava' },      // Dubrava tram 11/12 terminus
  { lat: 45.8195, lng: 15.9100, district: 'stenjevec' },          // Špansko tram 14 terminus
  { lat: 45.8370, lng: 16.0760, district: 'gornja-dubrava' },     // ZET bus 203/237 — no tram
  { lat: 45.8180, lng: 15.8720, district: 'podsused-vrapce' },   // ZET bus 109 — no tram
  { lat: 45.8490, lng: 15.9520, district: 'podsljeme' },          // ZET bus 102 near Mihaljevac
  { lat: 45.8310, lng: 16.1080, district: 'sesvete' },            // ZET bus 295 Sesvete centar
  { lat: 45.7580, lng: 15.9120, district: 'brezovica' },          // ZET bus 268 — very limited service
]

function matchesDistrict(workDistrict: string, neighborhood: NeighborhoodMeta): boolean {
  if (!workDistrict) return false
  const wd = workDistrict.toLowerCase().replace(/[–\-]/g, ' ').trim()
  const namesToCheck = [
    neighborhood.nameCroatian.toLowerCase().replace(/[–\-]/g, ' '),
    neighborhood.name.toLowerCase().replace(/[–\-]/g, ' '),
    neighborhood.id.replace(/-/g, ' '),
  ]
  for (const name of namesToCheck) {
    const words = name.split(/[\s,]+/).filter(w => w.length > 3)
    if (words.some(word => wd.includes(word))) return true
    if (wd.includes(name) || name.includes(wd)) return true
  }
  return false
}

export interface ScoringInput {
  neighborhood: NeighborhoodMeta
  criteria: SearchCriteria
  liveData: {
    activeWorks: KomunalniWork[]
    kindergartens: Kindergarten[]
    airQuality: AirQualityStation[]
  }
  commuteMinutes?: number | null
}

export function scoreNeighborhood(input: ScoringInput): NeighborhoodScore {
  const { neighborhood, criteria, liveData, commuteMinutes } = input
  const components: ScoreComponent[] = []
  let score = 60

  // Find works in this neighborhood
  const worksInNeighborhood = liveData.activeWorks.filter(w => {
    if (w.district && matchesDistrict(w.district, neighborhood)) return true
    if (w.lat && w.lng) {
      return distanceMeters(neighborhood.centroid, { lat: w.lat, lng: w.lng }) < 2000
    }
    return false
  })

  const activeWorks = worksInNeighborhood.filter(w => w.status === 'u_tijeku')
  const plannedWorks = worksInNeighborhood.filter(w => w.status === 'planirano')

  // Find kindergartens in neighborhood
  const nearbyKindergartens = liveData.kindergartens.filter(k =>
    distanceMeters(neighborhood.centroid, { lat: k.lat, lng: k.lng }) < 2500
  )
  const kgsWithSpots = nearbyKindergartens.filter(k => k.freeSpots > 0)
  const totalFreeSpots = nearbyKindergartens.reduce((sum, k) => sum + k.freeSpots, 0)

  // Find nearest ZET stop — prefer the stop assigned to this neighborhood, then check all
  const ownStop = ZET_STOPS.find(s => s.district === neighborhood.id)
  const nearestStop = ZET_STOPS.reduce((nearest, stop) => {
    const d = distanceMeters(neighborhood.centroid, { lat: stop.lat, lng: stop.lng })
    return d < nearest.distance ? { stop, distance: d } : nearest
  }, { stop: ownStop ?? ZET_STOPS[0], distance: ownStop ? distanceMeters(neighborhood.centroid, { lat: ownStop.lat, lng: ownStop.lng }) : Infinity })
  const nearestZetMeters = Math.round(nearestStop.distance)

  // Find air quality near neighborhood
  const nearestAQ = liveData.airQuality.reduce((nearest, station) => {
    const d = distanceMeters(neighborhood.centroid, { lat: station.lat, lng: station.lng })
    return d < nearest.distance ? { station, distance: d } : nearest
  }, { station: liveData.airQuality[0] ?? { aqi: 2 } as AirQualityStation, distance: Infinity })
  const airQualityIndex = nearestAQ.station?.aqi ?? 2

  // Bike trail estimate based on green score
  const bikeTrailMeters = neighborhood.greenScore * 400

  // ─── SCORING RULES ───

  // Child / kindergarten
  if (criteria.hasChild || criteria.hasInfant) {
    if (kgsWithSpots.length > 0) {
      const bonus = 15
      score += bonus
      components.push({ label: 'Kindergarten', labelHr: 'Slobodna mjesta u vrtićima', value: bonus, reason: `${kgsWithSpots.length} vrtić(a) s ${totalFreeSpots} slobodnih mjesta` })
    } else if (nearbyKindergartens.length > 0) {
      score -= 5
      components.push({ label: 'Kindergarten', labelHr: 'Vrtići bez slobodnih mjesta', value: -5, reason: 'Vrtići u blizini ali bez slobodnih mjesta' })
    } else {
      score -= 10
      components.push({ label: 'Kindergarten', labelHr: 'Nema vrtića u blizini', value: -10, reason: 'Nema vrtića unutar 2.5km' })
    }
  }

  // Transit / no car
  if (criteria.noCar) {
    if (nearestZetMeters < 300) {
      score += 10
      components.push({ label: 'Transit', labelHr: 'Odlična tramvajska veza', value: 10, reason: `ZET postaja ${nearestZetMeters}m od centra kvarta` })
    } else if (nearestZetMeters < 600) {
      score += 5
      components.push({ label: 'Transit', labelHr: 'Dobra tramvajska veza', value: 5, reason: `ZET postaja ${nearestZetMeters}m od centra kvarta` })
    } else {
      score -= 10
      components.push({ label: 'Transit', labelHr: 'Slaba tramvajska veza', value: -10, reason: `Najbliža ZET postaja ${nearestZetMeters}m` })
    }
  }

  // Green / parks
  if (criteria.prefersGreen || criteria.hasDog) {
    if (neighborhood.greenScore >= 8) {
      score += 10
      components.push({ label: 'Green', labelHr: 'Zelenilo i parkovi', value: 10, reason: 'Odlično zelenilo i parkovi u kvartu' })
    } else if (neighborhood.greenScore >= 6) {
      score += 5
      components.push({ label: 'Green', labelHr: 'Dobro zelenilo', value: 5, reason: 'Dobar udio zelenila u kvartu' })
    } else {
      score -= 5
      components.push({ label: 'Green', labelHr: 'Malo zelenila', value: -5, reason: 'Ograničeno zelenilo u kvartu' })
    }
  }

  // Pharmacy
  const pharmacyCount = Math.round(neighborhood.transitScore * 0.4)
  if (criteria.needsPharmacy) {
    if (pharmacyCount >= 3) {
      score += 8
      components.push({ label: 'Pharmacy', labelHr: 'Ljekarne u blizini', value: 8, reason: `${pharmacyCount}+ ljekarni unutar 1km` })
    } else {
      score -= 3
      components.push({ label: 'Pharmacy', labelHr: 'Malo ljekarni', value: -3, reason: 'Ograničen broj ljekarni u blizini' })
    }
  }

  // Quiet / active works penalty
  if (criteria.needsQuiet) {
    if (activeWorks.length > 3) {
      score -= 20
      components.push({ label: 'Noise', labelHr: 'Mnogo aktivnih radova', value: -20, reason: `${activeWorks.length} aktivnih komunalnih radova` })
    } else if (activeWorks.length > 0) {
      score -= 10
      components.push({ label: 'Noise', labelHr: 'Aktivni komunalni radovi', value: -10, reason: `${activeWorks.length} aktivnih radova u kvartu` })
    } else if (neighborhood.quietScore >= 8) {
      score += 12
      components.push({ label: 'Quiet', labelHr: 'Miran kvart', value: 12, reason: 'Nizak nivo buke, nema aktivnih radova' })
    } else {
      score += 5
      components.push({ label: 'Quiet', labelHr: 'Relativno miran', value: 5, reason: 'Bez aktivnih komunalnih radova' })
    }
  }

  // Per active work penalty (general)
  const workPenalty = Math.min(25, activeWorks.length * 5)
  if (workPenalty > 0 && !criteria.needsQuiet) {
    score -= workPenalty
    components.push({ label: 'Works', labelHr: 'Komunalni radovi', value: -workPenalty, reason: `${activeWorks.length} aktivnih i ${plannedWorks.length} planiranih radova` })
  }

  // Bike trails
  if (criteria.prefersBike) {
    if (bikeTrailMeters > 2000) {
      score += 10
      components.push({ label: 'Cycling', labelHr: 'Biciklističke staze', value: 10, reason: `${(bikeTrailMeters / 1000).toFixed(1)}km biciklističkih staza` })
    } else {
      score -= 3
      components.push({ label: 'Cycling', labelHr: 'Malo biciklističkih staza', value: -3, reason: 'Ograničena biciklistička infrastruktura' })
    }
  }

  // Air quality
  if (airQualityIndex <= 2) {
    score += 5
    components.push({ label: 'Air', labelHr: 'Čist zrak', value: 5, reason: `Indeks kvalitete zraka: ${airQualityIndex}/5 (odlično)` })
  } else if (airQualityIndex >= 4) {
    score -= 10
    components.push({ label: 'Air', labelHr: 'Loša kvaliteta zraka', value: -10, reason: `Indeks kvalitete zraka: ${airQualityIndex}/5 (loše)` })
  }

  // Commute
  if (criteria.workLocation && commuteMinutes !== null && commuteMinutes !== undefined) {
    const maxCommute = criteria.maxCommuteMinutes ?? 30
    if (commuteMinutes <= maxCommute) {
      score += 15
      components.push({ label: 'Commute', labelHr: 'Kratka vožnja do posla', value: 15, reason: `${commuteMinutes} min do posla (limit: ${maxCommute} min)` })
    } else if (commuteMinutes <= maxCommute * 1.5) {
      score += 5
      components.push({ label: 'Commute', labelHr: 'Prihvatljiva vožnja do posla', value: 5, reason: `${commuteMinutes} min do posla` })
    } else {
      score -= 10
      components.push({ label: 'Commute', labelHr: 'Duga vožnja do posla', value: -10, reason: `${commuteMinutes} min do posla — predugo` })
    }
  }

  // Student — student settlements
  if (criteria.isStudent) {
    if (['gornji-grad', 'trnje', 'donji-grad', 'maksimir'].includes(neighborhood.id)) {
      score += 10
      components.push({ label: 'Student', labelHr: 'Studentski kvart', value: 10, reason: 'Blizu studentskih domova i fakulteta' })
    }
    if (criteria.budgetRange === 'low' && neighborhood.costIndex <= 4) {
      score += 8
      components.push({ label: 'Budget', labelHr: 'Pristupačne cijene', value: 8, reason: 'Niže cijene stanarine u ovom kvartu' })
    }
  }

  // Elderly — ground floor, pharmacy, health
  if (criteria.isElderly) {
    if (neighborhood.transitScore >= 8 && nearestZetMeters < 400) {
      score += 8
      components.push({ label: 'Accessibility', labelHr: 'Pristupačan kvart', value: 8, reason: 'Dobar javni prijevoz za starije' })
    }
    if (neighborhood.quietScore >= 7) {
      score += 5
      components.push({ label: 'Quiet', labelHr: 'Miran kvart za starije', value: 5, reason: 'Tiha okolina prikladna za starije' })
    }
  }

  // Budget
  if (criteria.budgetRange === 'low' && neighborhood.costIndex > 7) {
    score -= 15
    components.push({ label: 'Budget', labelHr: 'Skupo za vaš budžet', value: -15, reason: 'Jedan od skupljih kvartova Zagreba' })
  } else if (criteria.budgetRange === 'high' && neighborhood.costIndex > 7) {
    score += 5
    components.push({ label: 'Premium', labelHr: 'Prestižna lokacija', value: 5, reason: 'Jedan od najprestižnijih kvartova' })
  }

  // Clamp score 0-100
  score = Math.max(0, Math.min(100, Math.round(score)))

  return {
    id: neighborhood.id,
    name: neighborhood.name,
    nameCroatian: neighborhood.nameCroatian,
    centroid: neighborhood.centroid,
    score,
    scoreBreakdown: components,
    activeWorksCount: activeWorks.length,
    kindergartenSpotsCount: totalFreeSpots,
    nearestZetMeters,
    pharmacyCount,
    airQualityIndex,
    bikeTrailMeters,
    commuteMinutes: commuteMinutes ?? null,
  }
}
