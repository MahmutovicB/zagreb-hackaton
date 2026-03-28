# Gdje Živjeti — Zagreb Neighborhood Intelligence Platform

> AI-powered neighborhood matchmaker + real-time communal radar for Zagreb.
> Built for Cursor Hackathon Zagreb 2026. Theme: "Build Something Zagreb Wants."

---

## What This Is

A web app where anyone searching for an apartment in Zagreb types a natural language query — "obitelj s djetetom, bez auta, tiho, posao u Donjem gradu" — and gets an AI-ranked list of neighborhoods with a live map, real city data, active construction radar, kindergarten availability, air quality, and direct links to apartment listings. Every data point is sourced from Zagreb's official open data portal (data.zagreb.hr), updated daily.

Two core features:

1. **Neighborhood Matchmaker** — natural language → ranked neighborhood recommendations with scoring
2. **Komunalni Radar** — live overlay of every active communal work, road closure, and maintenance project across Zagreb, updated from the official Plan komunalnih aktivnosti dataset

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 15 App Router + TypeScript | Fast setup, API routes built in |
| AI | Google Gemini API (`gemini-2.0-flash`) | Required per project spec |
| Maps | Google Maps JavaScript API + Places API | Full ecosystem: maps, geocoding, places search |
| Styling | Tailwind CSS + shadcn/ui | Fast, professional UI |
| Data | Zagreb Open Data Portal (data.zagreb.hr) | Free, official, GeoJSON/CSV |
| Apartment listings | Njuškalo scrape + Njuškalo embed links | Croatia's primary real estate marketplace |
| Deploy | Vercel | Zero-config Next.js deployment |
| Animation | anime.js v4 | Score animations, map transitions |

---

## Environment Variables

```env
GEMINI_API_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Google Maps API key needs these APIs enabled:
- Maps JavaScript API
- Places API (New)
- Geocoding API
- Directions API

---

## Project Structure

```
app/
  page.tsx                          # Landing page with search
  results/page.tsx                  # Results page (map + neighborhood list)
  neighborhood/[id]/page.tsx        # Single neighborhood deep-dive
  api/
    match/route.ts                  # POST: Gemini neighborhood matching
    radar/route.ts                  # GET: live komunalni radar data
    kindergartens/route.ts          # GET: live kindergarten free spots
    airquality/route.ts             # GET: air quality stations
    apartments/route.ts             # GET: Njuškalo search proxy

components/
  search-bar.tsx                    # Natural language input (voice + text)
  zagreb-map.tsx                    # Google Maps with all dataset layers
  radar-overlay.tsx                 # Komunalni radar toggle layer
  neighborhood-card.tsx             # Score card per kvart
  score-gauge.tsx                   # Animated 0-100 score (anime.js)
  layer-controls.tsx                # Toggle: construction / kindergartens / air / transit
  apartment-drawer.tsx              # Slide-in panel with Njuškalo listings
  comparison-view.tsx               # Side-by-side two neighborhoods

lib/
  datasets.ts                       # All Zagreb open data fetchers
  gemini.ts                         # Gemini API client + prompts
  scoring.ts                        # Neighborhood scoring engine
  geocoding.ts                      # Google Geocoding helpers
  zagreb-neighborhoods.ts           # Neighborhood boundaries GeoJSON + metadata

types/
  index.ts                          # All TypeScript interfaces

data/
  neighborhoods.json                # Static: 17 Zagreb gradske četvrti with boundaries
  neighborhood-meta.json            # Static: character descriptions per kvart
```

---

## Zagreb Open Data Sources

All datasets are under Open Licence (Otvorena dozvola), free to use.
Base URL: `https://data.zagreb.hr`

### Primary datasets (fetch at runtime, cache 1h)

| Dataset | URL | Format | Update freq |
|---------|-----|--------|-------------|
| Plan komunalnih aktivnosti | `/dataset/komunalne_aktivnosti` | JSON/CSV | Daily |
| Kindergartens + free spots | `/dataset/registar-slobodnih-upisnih-mjesta-u-gradskim-privatnim-i-vjerskim-djecjim-vrticima` | CSV | Regular |
| ZET tram stops | `/dataset/geoportal-tramvajske-stanice-zet` | GeoJSON | Static |
| ZET bus stops | `/dataset/geoportal-bus-stops-zet` | GeoJSON | Static |
| Air quality stations | `/dataset/geoportal-air-quality` | GeoJSON | Daily |
| Health centers | `/dataset/geoportal-zdravstvene-ustanove` | GeoJSON | Static |
| Pharmacies | `/dataset/geoportal-pharmacies` | GeoJSON | Static |
| Hospitals | `/dataset/geoportal-bolnice` | GeoJSON | Static |
| Public bicycle parking | `/dataset/geoportal-bicycle-parking` | GeoJSON | Static |
| Bike trails | `/dataset/geoportal-cycling-trails` | GeoJSON | Static |
| City gardens | `/dataset/geoportal-city-garden` | GeoJSON | Static |
| Homes for elderly | `/dataset/geoportal-homes-for-the-elderly` | GeoJSON | Static |
| Institutions for disabled | `/dataset/geoportal-institutions-for-people-with-disabilities` | GeoJSON | Static |
| Student settlements | `/dataset/geoportal-student-settlements` | GeoJSON | Static |
| Electric charging stations | `/dataset/geoportal-electric-charging-stations` | GeoJSON | Static |
| Free WiFi points | `/dataset/geoportal-free-wifi-network` | GeoJSON | Static |

### How to fetch from data.zagreb.hr

Each dataset page has a "Preuzmi resurs" (download) link. For JSON/CSV resources, fetch the direct file URL. Example:

```typescript
const res = await fetch(
  'https://data.zagreb.hr/dataset/komunalne_aktivnosti/resource/{resource_id}/download/komunalne_aktivnosti.json',
  { next: { revalidate: 3600 } } // Next.js ISR cache 1h
)
```

Use `next: { revalidate: 3600 }` on all static datasets and `revalidate: 300` on komunalne aktivnosti (5 min refresh).

---

## Feature 1: Neighborhood Matchmaker

### User flow

1. User types or speaks query in Croatian or English
2. Gemini extracts structured criteria from natural language
3. Scoring engine ranks all 17 Zagreb neighborhoods
4. Google Maps renders color-coded zones
5. User clicks a neighborhood → detail card expands
6. User sees apartment listings for that area from Njuškalo

### Gemini criteria extraction (`lib/gemini.ts`)

```typescript
// POST to Gemini with this system prompt:
const EXTRACT_CRITERIA_PROMPT = `
Ti si asistent za pretragu stanova u Zagrebu. Korisnik opisuje gdje želi živjeti.
Izvuci strukturirane kriterije iz opisa.

Odgovori SAMO u JSON formatu, bez markdown:
{
  "hasChild": boolean,
  "hasInfant": boolean,       // dijete ispod 3 godine → prioritet vrtić
  "noCar": boolean,           // bez auta → prioritet ZET pristup
  "needsQuiet": boolean,      // tiho → penalizira aktivne radove
  "workLocation": string | null,  // adresa ili kvart posla ako je navedeno
  "maxCommuteMinutes": number | null,
  "needsPharmacy": boolean,
  "needsHealthCenter": boolean,
  "prefersBike": boolean,
  "isStudent": boolean,
  "isElderly": boolean,
  "hasDog": boolean,
  "prefersGreen": boolean,    // zelenilo, parkovi
  "budgetRange": "low" | "mid" | "high" | null,
  "rawQuery": string          // original user query
}
`

// After scoring, call Gemini again for the narrative:
const NARRATIVE_PROMPT = `
Na temelju ovih podataka o zagrebačkim kvartovima, napiši preporuku za korisnika.
Korisnikov upit: {query}
Rezultati bodovanja: {scores}
Top 3 kvarta: {top3}

Napiši 2-3 rečenice na hrvatskom koje objašnjavaju zašto su ovi kvartovi dobri za korisnika.
Budi konkretan — spominji stvarne ulice, parkove, tramvajske linije.
Završi s jednom rečenicom upozorenja ako postoje aktivni komunalni radovi u top kvartu.
`
```

### Scoring engine (`lib/scoring.ts`)

Score each neighborhood 0–100. Start at 60, add/subtract based on criteria match.

```typescript
interface ScoringInput {
  neighborhood: NeighborhoodMeta
  criteria: ExtractedCriteria
  liveData: {
    activeWorks: KomunalniWork[]        // from Plan komunalnih aktivnosti
    kindergartenSpots: Kindergarten[]
    nearestZetStop: number              // meters
    pharmacyCount: number               // within 1km
    airQualityIndex: number             // 1-5, lower is better
    bikeTrailMeters: number             // within neighborhood
  }
}

// Scoring rules:
// +15  if hasChild && kindergartenSpots > 0 in neighborhood
// +10  if noCar && nearestZetStop < 300m
// +10  if prefersGreen && neighborhood.greenScore > 7
// +8   if needsPharmacy && pharmacyCount > 2
// -20  if needsQuiet && activeWorks > 3 in neighborhood
// -10  if needsQuiet && activeWorks > 0
// -5   per active komunalni work in neighborhood (max -25)
// +10  if prefersBike && bikeTrailMeters > 2000
// +5   if airQualityIndex <= 2
// -10  if airQualityIndex >= 4
// +15  if workLocation set && commute < maxCommuteMinutes (Google Directions API)
// +8   if isStudent && nearestStudentSettlement < 1km
```

### Commute calculation

If `workLocation` is provided, use Google Directions API to calculate transit commute time from neighborhood centroid to work address:

```typescript
// lib/geocoding.ts
export async function getCommuteMinutes(
  origin: LatLng,
  destination: string,
  mode: 'transit' | 'bicycling' | 'walking' = 'transit'
): Promise<number> {
  const url = `https://maps.googleapis.com/maps/api/directions/json`
    + `?origin=${origin.lat},${origin.lng}`
    + `&destination=${encodeURIComponent(destination)}`
    + `&mode=${mode}`
    + `&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
  // parse response, return duration_in_traffic.value / 60
}
```

---

## Feature 2: Komunalni Radar

The real-time overlay showing every active communal project across Zagreb on the map.

### Data source

`Plan komunalnih aktivnosti` dataset — updates daily. Contains:
- Project name and description
- Location (address or coordinates)
- District (gradska četvrt)
- Start and end date
- Category (road works, water, electricity, greenery, etc.)
- Status (planned / in progress / completed)

### Radar overlay behavior

- Toggle button in top-right of map: "🚧 Komunalni radar"
- When ON: red/amber markers appear at every active work site
  - Red = in progress right now
  - Amber = planned within 7 days
  - Gray = completed (hidden by default, optional toggle)
- Click any marker → popup with: project name, category, expected end date, responsible Holding company
- Heatmap mode: zoom out → works aggregate into heatmap showing which neighborhoods have most active disruption

### Why this matters for the matchmaker

The komunalni radar feeds directly into the `needsQuiet` penalty score. If a user wants quiet and their top neighborhood has 5 active roadworks, the AI warns them explicitly in the narrative.

### `/api/radar/route.ts`

```typescript
// GET /api/radar
// Returns all active and upcoming komunalne aktivnosti
// Geocodes any entries that have address but no coordinates
// Filters to: status != 'completed' AND endDate > today - 7 days

export async function GET() {
  const data = await fetchKomunalneAktivnosti() // from data.zagreb.hr
  const active = data.filter(w => 
    w.status !== 'završeno' && 
    new Date(w.datumZavrsetka) > subDays(new Date(), 7)
  )
  // Geocode missing coordinates using Google Geocoding API
  const geocoded = await Promise.all(
    active.map(async w => {
      if (w.lat && w.lng) return w
      const coords = await geocodeAddress(w.adresa + ', Zagreb')
      return { ...w, ...coords }
    })
  )
  return Response.json(geocoded)
}
```

---

## Feature 3: Apartment Listings Integration

### Approach

When user selects a neighborhood, show Njuškalo apartment listings for that area.

**Method: Njuškalo deep link + scrape**

Njuškalo allows search by neighborhood name in the URL:
```
https://www.njuskalo.hr/iznajmljivanje-stanova/zagreb-{kvart}
```

For the hackathon, use two approaches:

**Approach A (fast, works in 6h):** Generate a Njuškalo search URL for the selected neighborhood and open it in a new tab or embed in an iframe. Enrich with Google Places API "apartments for rent near X" as supplementary data.

**Approach B (full scrape, if time permits):** Playwright scrapes Njuškalo search results for the neighborhood, extracts: price, size, address, photo URL, listing URL. Return as JSON. Display in the apartment drawer component.

### Google Places integration

Use Google Places API (Nearby Search) to find real estate agencies near a neighborhood centroid:

```typescript
// Google Places API - Nearby Search
const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json`
  + `?location=${lat},${lng}`
  + `&radius=1500`
  + `&type=real_estate_agency`
  + `&key=${API_KEY}`
```

Also use Places API to show:
- Cafés, restaurants, supermarkets near the neighborhood (quality of life signals)
- Parks and green spaces
- Schools and kindergartens (cross-reference with official dataset)

### `/api/apartments/route.ts`

```typescript
// GET /api/apartments?neighborhood={name}&lat={lat}&lng={lng}
// Returns: { njuskalUrl: string, places: GooglePlace[], listings: ScrapedListing[] }
```

---

## Google Maps Implementation (`components/zagreb-map.tsx`)

```typescript
'use client'
// Use @react-google-maps/api library
// import { GoogleMap, useJsApiLoader, Polygon, Marker, InfoWindow, HeatmapLayer } from '@react-google-maps/api'

// Map configuration
const MAP_CENTER = { lat: 45.8150, lng: 15.9819 } // Zagreb center
const DEFAULT_ZOOM = 12

// Layers to implement:
// 1. Neighborhood polygons (from neighborhoods.json) - colored by score
//    - Green: score 75-100
//    - Yellow: score 50-74  
//    - Orange: score 25-49
//    - Red: score 0-24
//    - Highlighted: selected neighborhood (brighter, thicker border)

// 2. Komunalni radar markers (toggle)
//    - Custom red construction icon for active works
//    - Cluster markers when zoomed out

// 3. Dataset markers (toggleable layers):
//    - Blue pin: ZET stops
//    - Green cross: health centers / pharmacies
//    - Yellow house: kindergartens (with "N slobodnih mjesta" label)
//    - Purple bike: bike parking
//    - Gray WiFi: free WiFi spots

// 4. Apartment markers (when drawer is open)
//    - Custom price bubble markers (e.g. "850€")

// Click on neighborhood polygon → trigger neighborhood detail
// Click on apartment marker → open listing
```

### Map styles

Use Google Maps `styles` array to apply a clean, modern style. Recommended: use a subtle gray base (like "Aubergine" or custom) so the colored neighborhood overlays pop visually.

---

## UI Pages

### `app/page.tsx` — Landing

- Full-viewport layout, map as background (blurred/dimmed)
- Centered: large headline "Gdje živjeti u Zagrebu?"
- Subtitle: "Opišite što tražite — AI pronalazi pravi kvart"
- Large search input with mic button for voice input (Web Speech API)
- Example prompts below: "Obitelj s djetetom, bez auta" / "Student, tiho, blizu fakulteta" / "Par, ljubitelji prirode, Jarun"
- Bottom strip: "17 kvartova · Live komunalni radar · Slobodna mjesta u vrtićima · Stambene ponude"

### `app/results/page.tsx` — Results

Layout: split-screen. Left 40%: ranked neighborhood cards. Right 60%: Google Map.

Left panel:
- AI narrative paragraph (streams in word by word via Gemini streaming)
- Numbered list of neighborhood cards, sorted by score
- Each card: neighborhood name, score gauge (anime.js), top 3 matching reasons, active works count badge
- "Prikaži stanove" button on each card

Right panel:
- Google Map with neighborhood polygons colored by score
- Layer toggle controls (radar / kindergartens / health / transit / air quality)
- Komunalni radar toggle button

### `app/neighborhood/[id]/page.tsx` — Neighborhood Deep Dive

- Header: neighborhood name + overall score
- Score breakdown: 6 metric cards (transit, quiet, health, green, education, cost)
- Google Map zoomed to neighborhood with all layers on
- Komunalni radar section: list of all active works with dates
- Kindergarten section: list of nearest kindergartens with free spots
- Air quality: current reading from nearest station
- Apartment listings section: grid of Njuškalo listings with photos, prices, sizes

---

## Component Details

### `components/score-gauge.tsx`

```typescript
// Circular SVG gauge, 0-100
// Colors: red → amber → yellow-green → green
// anime.js v4 animation on mount:
// - Counter animates 0 → final score
// - SVG stroke-dashoffset animates simultaneously
// Always 'use client', useEffect, createScope for cleanup
USE FRAMER MOTION
```

### `components/radar-overlay.tsx`

```typescript
// Toggle component that adds/removes komunalni radar markers from Google Map
// Props: { map: google.maps.Map, works: KomunalniWork[] }
// Uses google.maps.Marker with custom SVG icon (construction cone)
// Groups by category: ceste, vodovod, elektrika, zelenilo, ostalo
// Each category has different marker color
// InfoWindow on click: title, category icon, start-end dates, Holding company
```

### `components/apartment-drawer.tsx`

```typescript
// Slide-in drawer from bottom on mobile, right side on desktop
// Shows when user clicks "Prikaži stanove" on a neighborhood card
// Contains:
//   - Google Places real estate agencies nearby
//   - Njuškalo listing cards (if scraped) OR direct link button
//   - Each listing: photo, price/month, size m², address, "Pogledaj oglas ↗" button
// Dismiss by clicking outside or X button
```

### `components/comparison-view.tsx`

```typescript
// Side-by-side comparison of two neighborhoods
// Triggered when user clicks "Usporedi" on two neighborhood cards
// Table layout: metric rows, two neighborhood columns
// Metrics: score, active works, kindergarten spots, ZET distance, pharmacy count, air quality
// Highlight better value in green for each row
```

---

## TypeScript Types (`types/index.ts`)

```typescript
interface SearchCriteria {
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

interface NeighborhoodScore {
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
  geminiNarrative: string
}

interface KomunalniWork {
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

interface Kindergarten {
  name: string
  address: string
  lat: number
  lng: number
  type: 'gradski' | 'privatni' | 'vjerski'
  freeSpots: number
  totalCapacity: number
  district: string
}

interface ApartmentListing {
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

interface ScoreComponent {
  label: string
  labelHr: string
  value: number       // contribution to score (positive or negative)
  reason: string
}
```

---

## API Routes

### `POST /api/match`

Request:
```json
{ "query": "obitelj s djetetom, bez auta, tražim tiho mjesto" }
```

Response (streamed):
```json
{
  "criteria": { ...SearchCriteria },
  "neighborhoods": [ ...NeighborhoodScore[] ],
  "narrative": "streaming text..."
}
```

Process:
1. Call Gemini to extract criteria from query
2. Fetch all live datasets in parallel (Promise.all)
3. Run scoring engine for all 17 neighborhoods
4. If workLocation: run Google Directions API for top 5 candidates
5. Sort by score descending
6. Call Gemini again with top 5 + criteria to generate narrative
7. Stream narrative back with `@google/generative-ai` streaming

### `GET /api/radar`

Returns all active + upcoming komunalne aktivnosti, geocoded.
Cache: 5 minutes (`revalidate: 300`).

### `GET /api/kindergartens`

Returns all kindergartens with current free spots.
Cache: 1 hour (`revalidate: 3600`).

### `GET /api/airquality`

Returns current readings from all Zagreb air quality stations.
Cache: 30 minutes (`revalidate: 1800`).

### `GET /api/apartments?neighborhood={name}&lat={lat}&lng={lng}`

Returns:
- `njuskalUrl`: direct Njuškalo search URL for neighborhood
- `places`: Google Places nearby real estate agencies
- `listings`: scraped listings if available, else empty array

---

## Gemini API Usage (`lib/gemini.ts`)

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genai.getGenerativeModel({ model: 'gemini-2.0-flash' })

// 1. Extract criteria (single call, JSON mode)
export async function extractCriteria(query: string): Promise<SearchCriteria> {
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: EXTRACT_PROMPT + query }] }],
    generationConfig: { responseMimeType: 'application/json' }
  })
  return JSON.parse(result.response.text())
}

// 2. Generate narrative (streaming)
export async function generateNarrative(
  query: string,
  topNeighborhoods: NeighborhoodScore[]
): Promise<AsyncGenerator<string>> {
  const stream = await model.generateContentStream(
    NARRATIVE_PROMPT
      .replace('{query}', query)
      .replace('{neighborhoods}', JSON.stringify(topNeighborhoods.slice(0, 3)))
  )
  return stream // yield chunks in the API route
}
```

---

## Build Order for Hackathon (6 hours: 10:45–16:45)

### Hour 1 (10:45–11:45): Foundation
- [ ] Verify Google Maps API key works — render a basic map of Zagreb
- [ ] Fetch komunalne aktivnosti dataset manually, inspect JSON shape
- [ ] Fetch kindergarten dataset, inspect CSV shape
- [ ] Write `types/index.ts`
- [ ] Write `lib/datasets.ts` with fetch functions for all datasets
- [ ] Write `data/neighborhoods.json` with all 17 kvartovi centroids + boundary polygon points

### Hour 2 (11:45–12:45): Core logic
- [ ] Write `lib/gemini.ts` — criteria extraction working with test query
- [ ] Write `lib/scoring.ts` — scoring engine, test with mock data
- [ ] Write `POST /api/match` — end to end: query → criteria → scores → response
- [ ] Write `GET /api/radar` — fetches, filters, geocodes komunalne aktivnosti

### Hour 3 (12:45–13:45): Map + UI
- [ ] Install `@react-google-maps/api`
- [ ] Build `components/zagreb-map.tsx` — map renders with neighborhood polygons colored by score
- [ ] Build `app/page.tsx` — landing with search input
- [ ] Build `app/results/page.tsx` — split layout shell

### Hour 4 (13:45–14:45): Features
- [ ] Add komunalni radar toggle layer to map
- [ ] Build `components/neighborhood-card.tsx` with score gauge
- [ ] Build `components/apartment-drawer.tsx` with Njuškalo deep links
- [ ] Gemini narrative streaming into results page

### Hour 5 (14:45–15:45): Polish + data layers
- [ ] Add kindergarten markers layer to map (green pins with spot count)
- [ ] Add ZET stop markers layer
- [ ] Add air quality overlay
- [ ] Build `app/neighborhood/[id]/page.tsx` detail page
- [ ] Test full flow with 3-4 different queries

### Hour 6 (15:45–16:45): Demo prep
- [ ] Seed 3 demo scenarios with cached results (no API dependency)
- [ ] Fix visual polish — animations, loading states, mobile layout
- [ ] Deploy to Vercel, verify production works
- [ ] Prepare 3-minute demo script

---

## Demo Script (for 17:30 presentation)

**Scenario 1 — The young family:**
Type: *"Obitelj s bebom, bez auta, mama radi na Trgu bana Jelačića, trebamo vrtić"*
→ Map lights up, Trešnjevka-jug scores 81/100
→ Show: 2 kindergartens with free spots nearby, ZET tram 14 stop 200m
→ Toggle komunalni radar: 1 active work on Ozaljska, AI warns about it
→ Click "Prikaži stanove" → Njuškalo listings for Trešnjevka-jug

**Scenario 2 — The student:**
Type: *"Student, tiho, blizu Sveučilišta, biciklom na faks"*
→ Gornji grad / Medveščak score high
→ Show bike trail layer → 3.2km of trails in neighborhood
→ Radar: 0 active works → green score for quiet

**Scenario 3 — Live radar demo:**
Toggle komunalni radar without any search
→ Full Zagreb map with all 40+ active construction sites lighting up
→ Zoom into Donji grad → cluster of 8 sites → "This is why Ilica is a nightmare right now"
→ Click one marker → popup: "Obnova vodovoda Ilica 23-67, ZGH Vodoopskrba, završetak 15.5.2026."

---

## Why This Wins

- **Real live data** — komunalni radar updates daily from official source, not made up
- **Every Zagreb person has this problem** — finding an apartment is one of the top 3 life stresses in Zagreb right now (prices up 10% YoY)
- **Nobody has done this** — data.zagreb.hr has had these datasets for years, completely unused
- **Gemini + Google Maps** — natural pairing, shows ecosystem depth
- **The radar is the wow moment** — 40+ construction sites appearing on a live Zagreb map is visually striking
- **Practical value persists after the hackathon** — this is a real product, not a demo toy

---

## Known Limitations & Fallbacks

| Risk | Mitigation |
|------|-----------|
| Komunalne aktivnosti dataset has no coordinates, only addresses | Geocode with Google Geocoding API on fetch. Cache results. |
| Njuškalo blocks scraping | Fall back to Njuškalo deep link URL. Still shows the right search. |
| Google Directions API slow for 17 neighborhoods | Only call for top 5 candidates after initial scoring. |
| Gemini API rate limit | Use `gemini-2.0-flash`, low latency. Cache criteria extraction per query. |
| Dataset not found / Zagreb portal down | Use bundled static snapshots in `/data/` as fallback for static datasets. |

---

## Notes for AI Coding Agents

- Always `'use client'` on any component using Google Maps, anime.js, or browser APIs
- All Google Maps code must run inside `useEffect` or event handlers — never at module level
- Use `@react-google-maps/api` library, not the raw script tag approach
- framer motion
- The `easing` parameter in anime.js v4 is now `ease`, and names are shortened: `'outExpo'` not `'easeOutExpo'`
- Gemini streaming: use `generateContentStream`, yield chunks, pipe through Next.js `ReadableStream`
- All Zagreb open data is under Open Licence — free to use, no attribution required beyond "Izvor: Grad Zagreb"
- GeoJSON neighborhood boundaries can be generated from the Geoportal datasets or approximated from district centroid coordinates in `neighborhoods.json`
