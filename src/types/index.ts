export interface SearchCriteria {
  hasChild: boolean
  hasInfant: boolean
  noCar: boolean
  needsQuiet: boolean
  workLocation: string | null
  maxCommuteMinutes: number | null
  needsPharmacy: boolean
  needsHealthCenter: boolean
  prefersBike: boolean
  isStudent: boolean
  isElderly: boolean
  hasDog: boolean
  prefersGreen: boolean
  budgetRange: 'low' | 'mid' | 'high' | null
  rawQuery: string
}

export interface ScoreComponent {
  label: string
  labelHr: string
  value: number
  reason: string
}

export interface NeighborhoodScore {
  id: string
  name: string
  nameCroatian: string
  centroid: { lat: number; lng: number }
  score: number
  scoreBreakdown: ScoreComponent[]
  activeWorksCount: number
  kindergartenSpotsCount: number
  nearestZetMeters: number
  pharmacyCount: number
  airQualityIndex: number
  bikeTrailMeters: number
  commuteMinutes: number | null
  geminiNarrative?: string
}

export interface KomunalniWork {
  id: string
  title: string
  description: string
  category: 'ceste' | 'vodovod' | 'elektrika' | 'zelenilo' | 'ostalo'
  status: 'planirano' | 'u_tijeku' | 'završeno'
  startDate: string
  endDate: string
  address: string
  lat: number | null
  lng: number | null
  district: string
  holdingCompany: string
}

export interface Kindergarten {
  name: string
  address: string
  lat: number
  lng: number
  type: 'gradski' | 'privatni' | 'vjerski'
  freeSpots: number
  totalCapacity: number
  district: string
}

export interface AirQualityStation {
  id: string
  name: string
  lat: number
  lng: number
  aqi: number
  district: string
}

export interface ApartmentListing {
  id: string
  title: string
  price: number
  currency: 'EUR'
  sizeM2: number
  address: string
  lat: number | null
  lng: number | null
  photoUrl: string
  listingUrl: string
  source: 'njuskalo' | 'google_places'
}

export interface NeighborhoodMeta {
  id: string
  name: string
  nameCroatian: string
  centroid: { lat: number; lng: number }
  bounds: Array<{ lat: number; lng: number }>
  character: string
  greenScore: number
  transitScore: number
  quietScore: number
  costIndex: number
  description: string
  highlights: string[]
}

export interface MatchResponse {
  criteria: SearchCriteria
  neighborhoods: NeighborhoodScore[]
  narrative: string
}

export interface RadarResponse {
  works: KomunalniWork[]
  lastUpdated: string
}
