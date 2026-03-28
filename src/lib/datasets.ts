import type { KomunalniWork, Kindergarten, AirQualityStation } from '@/types'

const ZAGREB_OPEN_DATA = 'https://data.zagreb.hr'

// Komunalne aktivnosti — active communal works
export async function fetchKomunalneAktivnosti(): Promise<KomunalniWork[]> {
  try {
    const res = await fetch(
      `${ZAGREB_OPEN_DATA}/dataset/komunalne_aktivnosti/resource/56b27a77-1a46-4ed3-80c7-78d4ca1d34ec/download/komunalne_aktivnosti.json`,
      { next: { revalidate: 300 } }
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const raw = await res.json()
    return parseKomunalneAktivnosti(raw)
  } catch {
    return getMockKomunalneAktivnosti()
  }
}

function parseKomunalneAktivnosti(raw: unknown[]): KomunalniWork[] {
  if (!Array.isArray(raw)) return getMockKomunalneAktivnosti()
  return raw.slice(0, 200).map((unknown_item, idx) => {
    const item = unknown_item as Record<string, unknown>
    return {
    id: String(item.id ?? idx),
    title: String(item.naziv ?? item.name ?? item.naslov ?? 'Komunalni rad'),
    description: String(item.opis ?? item.description ?? ''),
    category: mapCategory(String(item.vrsta ?? item.kategorija ?? '')),
    status: mapStatus(String(item.status ?? '')),
    startDate: String(item.datum_pocetka ?? item.pocetak ?? new Date().toISOString()),
    endDate: String(item.datum_zavrsetka ?? item.zavrsetak ?? new Date(Date.now() + 30 * 86400000).toISOString()),
    address: String(item.adresa ?? item.lokacija ?? ''),
    lat: item.lat ? Number(item.lat) : item.y ? Number(item.y) : null,
    lng: item.lng ? Number(item.lng) : item.x ? Number(item.x) : null,
      district: String(item.gradska_cetvrt ?? item.cetvrt ?? ''),
      holdingCompany: String(item.izvodac ?? item.tvrtka ?? 'ZGH'),
    }
  })
}

function mapCategory(raw: string): KomunalniWork['category'] {
  const l = raw.toLowerCase()
  if (l.includes('cest') || l.includes('asfalt') || l.includes('kolnička') || l.includes('road')) return 'ceste'
  if (l.includes('vod') || l.includes('kanal') || l.includes('water')) return 'vodovod'
  if (l.includes('elek') || l.includes('struj') || l.includes('electric')) return 'elektrika'
  if (l.includes('zeleni') || l.includes('park') || l.includes('drvo') || l.includes('green')) return 'zelenilo'
  return 'ostalo'
}

function mapStatus(raw: string): KomunalniWork['status'] {
  const l = raw.toLowerCase()
  if (l.includes('tijeku') || l.includes('aktiv') || l.includes('progress')) return 'u_tijeku'
  if (l.includes('završ') || l.includes('complet') || l.includes('done')) return 'završeno'
  return 'planirano'
}

// Kindergartens
export async function fetchKindergartens(): Promise<Kindergarten[]> {
  try {
    const res = await fetch(
      `${ZAGREB_OPEN_DATA}/dataset/registar-slobodnih-upisnih-mjesta-u-gradskim-privatnim-i-vjerskim-djecjim-vrticima/resource/d1f1b42f-e8e1-4459-8f94-65e54c60c8f6/download/vrtici.csv`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const text = await res.text()
    return parseKindergartenCSV(text)
  } catch {
    return getMockKindergartens()
  }
}

function parseKindergartenCSV(text: string): Kindergarten[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return getMockKindergartens()
  const headers = lines[0].split(';').map(h => h.trim().toLowerCase().replace(/"/g, ''))
  return lines.slice(1, 100).map((line, idx) => {
    const cols = line.split(';').map(c => c.trim().replace(/"/g, ''))
    const get = (key: string) => cols[headers.indexOf(key)] ?? ''
    return {
      name: get('naziv') || get('ime') || `Vrtić ${idx + 1}`,
      address: get('adresa') || get('address') || '',
      lat: parseFloat(get('lat') || get('y_wgs') || '45.815') || 45.815,
      lng: parseFloat(get('lng') || get('x_wgs') || '15.982') || 15.982,
      type: mapKinderType(get('vrsta') || get('tip') || ''),
      freeSpots: parseInt(get('slobodna_mjesta') || get('slobodna') || '0') || 0,
      totalCapacity: parseInt(get('ukupno_mjesta') || get('kapacitet') || '30') || 30,
      district: get('cetvrt') || get('gradska_cetvrt') || '',
    }
  }).filter(k => k.lat && k.lng)
}

function mapKinderType(raw: string): Kindergarten['type'] {
  const l = raw.toLowerCase()
  if (l.includes('privatn')) return 'privatni'
  if (l.includes('vjersk') || l.includes('crkv') || l.includes('katol')) return 'vjerski'
  return 'gradski'
}

// Air quality
export async function fetchAirQuality(): Promise<AirQualityStation[]> {
  try {
    const res = await fetch(
      `${ZAGREB_OPEN_DATA}/dataset/geoportal-air-quality/resource/air-quality.geojson`,
      { next: { revalidate: 1800 } }
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const geojson = await res.json()
    return parseAirQualityGeoJSON(geojson)
  } catch {
    return getMockAirQuality()
  }
}

function parseAirQualityGeoJSON(geojson: { features?: unknown[] }): AirQualityStation[] {
  if (!geojson?.features) return getMockAirQuality()
  return (geojson.features as Array<{ geometry: { coordinates: number[] }, properties: Record<string, unknown> }>)
    .slice(0, 10)
    .map((f, idx) => ({
      id: String(f.properties?.id ?? idx),
      name: String(f.properties?.naziv ?? f.properties?.name ?? `Postaja ${idx + 1}`),
      lat: f.geometry?.coordinates?.[1] ?? 45.815,
      lng: f.geometry?.coordinates?.[0] ?? 15.982,
      aqi: Math.min(5, Math.max(1, Math.round(parseFloat(String(f.properties?.aqi ?? f.properties?.indeks ?? '2'))))),
      district: String(f.properties?.cetvrt ?? ''),
    }))
}

// Mock data fallbacks
function getMockKomunalneAktivnosti(): KomunalniWork[] {
  return [
    {
      id: '1', title: 'Rekonstrukcija Ilice', description: 'Obnova kolnika i vodovoda na Ilici 23-67',
      category: 'ceste', status: 'u_tijeku', startDate: '2026-03-01', endDate: '2026-05-15',
      address: 'Ilica 45, Zagreb', lat: 45.8122, lng: 15.9681, district: 'Gornji grad - Medveščak', holdingCompany: 'ZGH Ceste'
    },
    {
      id: '2', title: 'Obnova vodovoda Ozaljska', description: 'Zamjena dotrajalih cijevi vodovoda',
      category: 'vodovod', status: 'u_tijeku', startDate: '2026-02-15', endDate: '2026-04-20',
      address: 'Ozaljska 10, Zagreb', lat: 45.8098, lng: 15.9452, district: 'Trešnjevka-Sjever', holdingCompany: 'Vodoopskrba i odvodnja'
    },
    {
      id: '3', title: 'Uređenje parka Maksimir', description: 'Obnova šetnica i sadnja novog drveća',
      category: 'zelenilo', status: 'planirano', startDate: '2026-04-01', endDate: '2026-05-31',
      address: 'Park Maksimir, Zagreb', lat: 45.8219, lng: 16.0123, district: 'Maksimir', holdingCompany: 'Zrinjevac'
    },
    {
      id: '4', title: 'Asfaltiranje Savske ceste', description: 'Rekonstrukcija kolnika Savske ceste',
      category: 'ceste', status: 'u_tijeku', startDate: '2026-01-20', endDate: '2026-06-30',
      address: 'Savska cesta 100, Zagreb', lat: 45.7995, lng: 15.9412, district: 'Trešnjevka-Jug', holdingCompany: 'ZGH Ceste'
    },
    {
      id: '5', title: 'Električna mreža Donji grad', description: 'Modernizacija elektroenergetske mreže',
      category: 'elektrika', status: 'planirano', startDate: '2026-04-10', endDate: '2026-07-01',
      address: 'Petrinjska 20, Zagreb', lat: 45.8135, lng: 15.9841, district: 'Donji grad', holdingCompany: 'HEP'
    },
    {
      id: '6', title: 'Obnova ceste Črnomerec', description: 'Sanacija asfalta i nogostupa',
      category: 'ceste', status: 'u_tijeku', startDate: '2026-03-05', endDate: '2026-04-30',
      address: 'Črnomerecka 15, Zagreb', lat: 45.8201, lng: 15.9230, district: 'Črnomerec', holdingCompany: 'ZGH Ceste'
    },
    {
      id: '7', title: 'Vodovod Trnje', description: 'Zamjena cijevi u zoni Bundeka',
      category: 'vodovod', status: 'planirano', startDate: '2026-04-15', endDate: '2026-06-01',
      address: 'Bundečka 3, Zagreb', lat: 45.7989, lng: 16.0050, district: 'Trnje', holdingCompany: 'Vodoopskrba i odvodnja'
    },
    {
      id: '8', title: 'Uređenje Britanskog trga', description: 'Rekonstrukcija pješačke zone',
      category: 'ceste', status: 'u_tijeku', startDate: '2026-02-01', endDate: '2026-04-15',
      address: 'Britanski trg 1, Zagreb', lat: 45.8179, lng: 15.9641, district: 'Gornji grad - Medveščak', holdingCompany: 'ZGH Ceste'
    },
    {
      id: '9', title: 'Sadnja drveća Novi Zagreb', description: 'Urbano ozelenivanje ulica',
      category: 'zelenilo', status: 'u_tijeku', startDate: '2026-03-20', endDate: '2026-04-20',
      address: 'Avenue Dubrovnik 10, Zagreb', lat: 45.7780, lng: 16.0050, district: 'Novi Zagreb-Istok', holdingCompany: 'Zrinjevac'
    },
    {
      id: '10', title: 'Obnova Kvaternikovog trga', description: 'Rekonstrukcija trga i fontane',
      category: 'ceste', status: 'u_tijeku', startDate: '2026-03-01', endDate: '2026-05-01',
      address: 'Kvaternikov trg 1, Zagreb', lat: 45.8065, lng: 16.0201, district: 'Peščenica-Žitnjak', holdingCompany: 'ZGH Ceste'
    },
  ]
}

function getMockKindergartens(): Kindergarten[] {
  return [
    { name: 'DV Tratinčica', address: 'Ilica 50, Zagreb', lat: 45.8119, lng: 15.9672, type: 'gradski', freeSpots: 5, totalCapacity: 50, district: 'Gornji grad - Medveščak' },
    { name: 'DV Zvjezdica', address: 'Ozaljska 20, Zagreb', lat: 45.8105, lng: 15.9461, type: 'gradski', freeSpots: 2, totalCapacity: 45, district: 'Trešnjevka-Sjever' },
    { name: 'DV Sopnica-Jelkovec', address: 'Sopnička 5, Zagreb', lat: 45.7975, lng: 15.9431, type: 'gradski', freeSpots: 8, totalCapacity: 60, district: 'Trešnjevka-Jug' },
    { name: 'DV Šumska jagoda', address: 'Bukovačka 10, Zagreb', lat: 45.8229, lng: 16.0401, type: 'gradski', freeSpots: 3, totalCapacity: 40, district: 'Maksimir' },
    { name: 'DV Mala Maslačak', address: 'Bundečka 2, Zagreb', lat: 45.7981, lng: 16.0041, type: 'gradski', freeSpots: 0, totalCapacity: 35, district: 'Trnje' },
    { name: 'DV Leptir', address: 'Jadranska 15, Zagreb', lat: 45.7790, lng: 16.0071, type: 'gradski', freeSpots: 4, totalCapacity: 50, district: 'Novi Zagreb-Istok' },
    { name: 'DV Sv. Ana', address: 'Dubrava 30, Zagreb', lat: 45.8381, lng: 16.0780, type: 'vjerski', freeSpots: 6, totalCapacity: 40, district: 'Gornja Dubrava' },
    { name: 'DV Mali princ', address: 'Jankomir 5, Zagreb', lat: 45.8189, lng: 15.8912, type: 'privatni', freeSpots: 10, totalCapacity: 30, district: 'Stenjevec' },
  ]
}

function getMockAirQuality(): AirQualityStation[] {
  return [
    { id: '1', name: 'Donji grad', lat: 45.8130, lng: 15.9792, aqi: 2, district: 'Donji grad' },
    { id: '2', name: 'Maksimir', lat: 45.8250, lng: 16.0350, aqi: 1, district: 'Maksimir' },
    { id: '3', name: 'Peščenica', lat: 45.8050, lng: 16.0500, aqi: 3, district: 'Peščenica-Žitnjak' },
    { id: '4', name: 'Novi Zagreb', lat: 45.7750, lng: 16.0200, aqi: 2, district: 'Novi Zagreb-Istok' },
    { id: '5', name: 'Črnomerec', lat: 45.8200, lng: 15.9250, aqi: 1, district: 'Črnomerec' },
  ]
}
