'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { NeighborhoodScore, KomunalniWork, Kindergarten } from '@/types'
import { ZET_TRAM_STOPS } from '@/data/zet-stops'
import { BIKE_STATIONS } from '@/data/cycling-stations'

const ZAGREB_CENTER = { lat: 45.8150, lng: 15.9819 }

interface AirQualityStation { id: string; name: string; lat: number; lng: number; aqi: number; pm25: number }
const AIR_QUALITY_STATIONS: AirQualityStation[] = [
  { id: 'aq1', name: 'Gornji grad',  lat: 45.8200, lng: 15.9700, aqi: 2, pm25: 9  },
  { id: 'aq2', name: 'Črnomerec',    lat: 45.8220, lng: 15.9193, aqi: 2, pm25: 11 },
  { id: 'aq3', name: 'Trnje',        lat: 45.7970, lng: 15.9900, aqi: 3, pm25: 19 },
  { id: 'aq4', name: 'Novi Zagreb',  lat: 45.7760, lng: 15.9770, aqi: 3, pm25: 21 },
  { id: 'aq5', name: 'Sesvete',      lat: 45.8350, lng: 16.1100, aqi: 4, pm25: 34 },
  { id: 'aq6', name: 'Pesčenica',    lat: 45.8100, lng: 16.0450, aqi: 3, pm25: 20 },
  { id: 'aq7', name: 'Maksimir',     lat: 45.8190, lng: 16.0300, aqi: 1, pm25: 5  },
  { id: 'aq8', name: 'Stenjevec',    lat: 45.8200, lng: 15.8700, aqi: 2, pm25: 12 },
]
const AQI_COLOR: Record<number, string> = { 1: '#22c55e', 2: '#86efac', 3: '#eab308', 4: '#f97316', 5: '#ef4444' }
const AQI_LABEL: Record<number, string> = { 1: 'Izvrsno', 2: 'Dobro', 3: 'Umjereno', 4: 'Loše', 5: 'Vrlo loše' }

const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#0F1419' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0F1419' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a2332' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] },
]

// ── SVG icon helpers ──────────────────────────────────────────────────────────
function enc(svg: string) { return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}` }

function radarIcon(isActive: boolean) {
  const c = isActive ? '#ef4444' : '#f59e0b'
  return isActive
    ? enc(`<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44"><circle cx="22" cy="22" r="8" fill="${c}"/><circle cx="22" cy="22" r="8" fill="none" stroke="${c}" stroke-width="2"><animate attributeName="r" from="8" to="21" dur="1.6s" repeatCount="indefinite"/><animate attributeName="opacity" from="0.9" to="0" dur="1.6s" repeatCount="indefinite"/></circle><circle cx="22" cy="22" r="8" fill="none" stroke="${c}" stroke-width="1.5"><animate attributeName="r" from="8" to="15" dur="1.6s" begin="0.5s" repeatCount="indefinite"/><animate attributeName="opacity" from="0.6" to="0" dur="1.6s" begin="0.5s" repeatCount="indefinite"/></circle></svg>`)
    : enc(`<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><circle cx="14" cy="14" r="9" fill="${c}" opacity="0.9"/><circle cx="14" cy="14" r="8" fill="none" stroke="${c}88" stroke-width="1.5" stroke-dasharray="3 2"/></svg>`)
}

function tramIcon(isTerminal: boolean) {
  const c = isTerminal ? '#1d4ed8' : '#3b82f6'
  return enc(`<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"><circle cx="15" cy="15" r="13" fill="${c}"/><circle cx="15" cy="15" r="12" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1"/><rect x="9" y="8" width="12" height="9" rx="2" fill="none" stroke="white" stroke-width="1.3"/><line x1="9" y1="12" x2="21" y2="12" stroke="white" stroke-width="1" opacity="0.7"/><circle cx="11.5" cy="20" r="1.4" fill="white"/><circle cx="18.5" cy="20" r="1.4" fill="white"/><line x1="11.5" y1="17.2" x2="11.5" y2="19" stroke="white" stroke-width="1"/><line x1="18.5" y1="17.2" x2="18.5" y2="19" stroke="white" stroke-width="1"/></svg>`)
}

function kgIcon(freeSpots: number) {
  const c = freeSpots > 0 ? '#ec4899' : '#6b7280'
  const badge = freeSpots > 0
    ? `<circle cx="22" cy="9" r="7" fill="#111620" stroke="${c}" stroke-width="1.2"/><text x="22" y="12.5" text-anchor="middle" font-size="8" font-weight="bold" fill="${c}" font-family="system-ui">${freeSpots}</text>`
    : ''
  return enc(`<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"><circle cx="15" cy="15" r="13" fill="${c}"/><circle cx="15" cy="12" r="3.5" fill="white"/><path d="M9 22c0-3.3 2.7-6 6-6s6 2.7 6 6" fill="white" opacity="0.9"/>${badge}</svg>`)
}

function bikeIcon(bikes: number) {
  const c = bikes > 3 ? '#22c55e' : bikes > 0 ? '#eab308' : '#6b7280'
  return enc(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="16" r="14" fill="${c}" opacity="0.92"/><circle cx="9" cy="20" r="4" fill="none" stroke="white" stroke-width="1.5"/><circle cx="23" cy="20" r="4" fill="none" stroke="white" stroke-width="1.5"/><polyline points="9,20 13,13 19,13 23,20" fill="none" stroke="white" stroke-width="1.4" stroke-linejoin="round"/><line x1="13" y1="13" x2="16" y2="20" stroke="white" stroke-width="1.4"/><line x1="18" y1="13" x2="22" y2="13" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg>`)
}

function aqiMarkerSvg(aqi: number) {
  const c = AQI_COLOR[aqi] ?? '#94a3b8'
  return enc(`<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56"><circle cx="28" cy="28" r="26" fill="${c}" opacity="0.15" stroke="${c}" stroke-width="1.5" stroke-opacity="0.55"/><circle cx="28" cy="28" r="17" fill="#111620" opacity="0.88"/><text x="28" y="24" text-anchor="middle" font-size="7.5" fill="rgba(255,255,255,0.4)" font-family="system-ui">AQI</text><text x="28" y="37" text-anchor="middle" font-size="16" font-weight="bold" fill="${c}" font-family="system-ui">${aqi}</text></svg>`)
}

function darkInfoHTML(title: string, rows: Array<[string, string, string?]>) {
  return `<div style="font-family:system-ui,sans-serif;padding:12px 14px;min-width:180px;max-width:240px;background:#111620;border-radius:10px"><div style="font-weight:700;font-size:13px;color:#fff;margin-bottom:8px;line-height:1.3">${title}</div>${rows.map(([l, v, col = '#fff']) => `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px"><span style="font-size:11px;color:rgba(255,255,255,0.4)">${l}</span><span style="font-size:11px;font-weight:600;color:${col}">${v}</span></div>`).join('')}</div>`
}

function injectDarkInfoWindows() {
  if (document.getElementById('gm-dark-iw')) return
  const s = document.createElement('style')
  s.id = 'gm-dark-iw'
  s.textContent = `.gm-style .gm-style-iw-c{background:#111620!important;box-shadow:0 4px 24px rgba(0,0,0,.7)!important;border-radius:10px!important;padding:0!important}.gm-style .gm-style-iw-d{overflow:hidden!important}.gm-style .gm-style-iw-tc::after{background:#111620!important}.gm-style-iw-chr{position:absolute!important;top:2px!important;right:2px!important}.gm-style-iw-chr button{background:transparent!important;width:24px!important;height:24px!important}.gm-style-iw-chr button span{background-color:rgba(255,255,255,.3)!important;width:12px!important;height:12px!important}`
  document.head.appendChild(s)
}

function scoreToColor(score: number): { fill: string; stroke: string } {
  if (score >= 75) return { fill: 'rgba(34,197,94,0.22)', stroke: '#22c55e' }
  if (score >= 50) return { fill: 'rgba(234,179,8,0.22)', stroke: '#eab308' }
  if (score >= 25) return { fill: 'rgba(249,115,22,0.22)', stroke: '#f97316' }
  return { fill: 'rgba(239,68,68,0.22)', stroke: '#ef4444' }
}

function categoryColor(cat: KomunalniWork['category']): string {
  const m: Record<string, string> = { ceste: '#ef4444', vodovod: '#3b82f6', elektrika: '#f59e0b', zelenilo: '#22c55e' }
  return m[cat] ?? '#a78bfa'
}

interface ZagrebMapProps {
  neighborhoods?: NeighborhoodScore[]
  radarWorks?: KomunalniWork[]
  kindergartens?: Kindergarten[]
  selectedId?: string | null
  showRadar?: boolean
  showTransit?: boolean
  showKindergartens?: boolean
  showAirQuality?: boolean
  showCycling?: boolean
  onNeighborhoodClick?: (id: string) => void
  zoom?: number
  focusNeighborhoodId?: string | null
}

declare global {
  interface Window { google: typeof google; initGoogleMaps?: () => void }
}

export function ZagrebMap({
  neighborhoods = [], radarWorks = [], kindergartens = [],
  selectedId, showRadar = false, showTransit = false,
  showKindergartens = false, showAirQuality = false, showCycling = false,
  onNeighborhoodClick, zoom = 12, focusNeighborhoodId,
}: ZagrebMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<google.maps.Map | null>(null)
  const polygonsRef = useRef<Map<string, google.maps.Polygon>>(new Map())
  const radarMarkersRef = useRef<google.maps.Marker[]>([])
  const kgMarkersRef = useRef<google.maps.Marker[]>([])
  const transitMarkersRef = useRef<google.maps.Marker[]>([])
  const aqCirclesRef = useRef<google.maps.Circle[]>([])
  const aqMarkersRef = useRef<google.maps.Marker[]>([])
  const cyclingMarkersRef = useRef<google.maps.Marker[]>([])
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState<'billing' | 'auth' | null>(null)

  const initMap = useCallback(() => {
    if (!mapRef.current || mapInstance.current) return
    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      center: ZAGREB_CENTER, zoom, styles: MAP_STYLES,
      disableDefaultUI: true, zoomControl: true,
      zoomControlOptions: { position: window.google.maps.ControlPosition.RIGHT_CENTER },
      gestureHandling: 'cooperative',
    })
    infoWindowRef.current = new window.google.maps.InfoWindow()
    injectDarkInfoWindows()
    setMapReady(true)
  }, [zoom])

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!key) return
    if (window.google?.maps) { initMap(); return }
    const existing = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existing) { existing.addEventListener('load', initMap); return }
    ;(window as typeof window & { gm_authFailure?: () => void }).gm_authFailure = () => setMapError('billing')
    window.initGoogleMaps = initMap
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&callback=initGoogleMaps&libraries=visualization`
    script.async = true; script.defer = true
    script.onerror = () => setMapError('auth')
    document.head.appendChild(script)
    return () => { delete window.initGoogleMaps; delete (window as typeof window & { gm_authFailure?: () => void }).gm_authFailure }
  }, [initMap])

  // Neighborhood polygons
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return
    polygonsRef.current.forEach(p => p.setMap(null)); polygonsRef.current.clear()
    neighborhoods.forEach(n => {
      const bounds = getBoundsForNeighborhood(n.id, n.centroid)
      const { fill, stroke } = scoreToColor(n.score)
      const isSel = n.id === selectedId
      const poly = new window.google.maps.Polygon({
        paths: bounds, map: mapInstance.current!,
        strokeColor: isSel ? '#D4764A' : stroke, strokeOpacity: isSel ? 1 : 0.7, strokeWeight: isSel ? 3 : 1.5,
        fillColor: isSel ? 'rgba(212,118,74,0.25)' : fill, fillOpacity: 1,
      })
      poly.addListener('click', () => onNeighborhoodClick?.(n.id))
      poly.addListener('mouseover', () => poly.setOptions({ strokeWeight: 2.5, fillOpacity: 0.9 }))
      poly.addListener('mouseout', () => { if (n.id !== selectedId) poly.setOptions({ strokeWeight: isSel ? 3 : 1.5, fillOpacity: 1 }) })
      polygonsRef.current.set(n.id, poly)
    })
  }, [neighborhoods, selectedId, mapReady, onNeighborhoodClick])

  // Focus selected neighborhood
  useEffect(() => {
    if (!mapReady || !mapInstance.current || !focusNeighborhoodId) return
    const n = neighborhoods.find(n => n.id === focusNeighborhoodId)
    if (n) { mapInstance.current.panTo(n.centroid); mapInstance.current.setZoom(14) }
  }, [focusNeighborhoodId, neighborhoods, mapReady])

  // Komunalni radar
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return
    radarMarkersRef.current.forEach(m => m.setMap(null)); radarMarkersRef.current = []
    if (!showRadar) return
    radarWorks.forEach(work => {
      if (!work.lat || !work.lng) return
      const isActive = work.status === 'u_tijeku'
      const catColor = categoryColor(work.category)
      const marker = new window.google.maps.Marker({
        position: { lat: work.lat, lng: work.lng }, map: mapInstance.current!,
        icon: { url: radarIcon(isActive), scaledSize: new window.google.maps.Size(isActive ? 44 : 28, isActive ? 44 : 28), anchor: new window.google.maps.Point(isActive ? 22 : 14, isActive ? 22 : 14) },
        title: work.title,
      })
      marker.addListener('click', () => {
        const endDate = new Date(work.endDate).toLocaleDateString('hr-HR')
        infoWindowRef.current?.setContent(darkInfoHTML(work.title, [
          ['Adresa', work.address, 'rgba(255,255,255,0.7)'],
          ['Kategorija', work.category, catColor],
          ['Status', isActive ? 'U tijeku' : 'Planirano', isActive ? '#ef4444' : '#f59e0b'],
          ['Završetak', endDate, 'rgba(255,255,255,0.5)'],
          ['Tvrtka', work.holdingCompany, 'rgba(255,255,255,0.4)'],
        ]))
        infoWindowRef.current?.open(mapInstance.current!, marker)
      })
      radarMarkersRef.current.push(marker)
    })
  }, [showRadar, radarWorks, mapReady])

  // ZET tram stops
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return
    transitMarkersRef.current.forEach(m => m.setMap(null)); transitMarkersRef.current = []
    if (!showTransit) return
    ZET_TRAM_STOPS.forEach(stop => {
      const isTerminal = stop.terminal ?? false
      const marker = new window.google.maps.Marker({
        position: { lat: stop.lat, lng: stop.lng }, map: mapInstance.current!,
        icon: { url: tramIcon(isTerminal), scaledSize: new window.google.maps.Size(30, 30), anchor: new window.google.maps.Point(15, 15) },
        title: stop.name,
      })
      marker.addListener('click', () => {
        infoWindowRef.current?.setContent(darkInfoHTML(stop.name, [
          ['Linije', stop.lines.join(', '), '#3b82f6'],
          ['Tip', isTerminal ? 'Terminalna stanica' : 'Prolazna stanica', isTerminal ? '#1d4ed8' : '#60a5fa'],
        ]))
        infoWindowRef.current?.open(mapInstance.current!, marker)
      })
      transitMarkersRef.current.push(marker)
    })
  }, [showTransit, mapReady])

  // Kindergartens
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return
    kgMarkersRef.current.forEach(m => m.setMap(null)); kgMarkersRef.current = []
    if (!showKindergartens) return
    kindergartens.forEach(kg => {
      const marker = new window.google.maps.Marker({
        position: { lat: kg.lat, lng: kg.lng }, map: mapInstance.current!,
        icon: { url: kgIcon(kg.freeSpots), scaledSize: new window.google.maps.Size(30, 30), anchor: new window.google.maps.Point(15, 15) },
        title: kg.name,
      })
      marker.addListener('click', () => {
        const hasSpots = kg.freeSpots > 0
        infoWindowRef.current?.setContent(darkInfoHTML(kg.name, [
          ['Adresa', kg.address, 'rgba(255,255,255,0.6)'],
          ['Slobodna mjesta', hasSpots ? String(kg.freeSpots) : 'Nema', hasSpots ? '#ec4899' : '#6b7280'],
          ['Tip', kg.type === 'gradski' ? 'Gradski vrtić' : kg.type === 'privatni' ? 'Privatni vrtić' : 'Vjerski vrtić', 'rgba(255,255,255,0.5)'],
        ]))
        infoWindowRef.current?.open(mapInstance.current!, marker)
      })
      kgMarkersRef.current.push(marker)
    })
  }, [showKindergartens, kindergartens, mapReady])

  // Air quality — colored circles + AQI label markers
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return
    aqCirclesRef.current.forEach(c => c.setMap(null)); aqCirclesRef.current = []
    aqMarkersRef.current.forEach(m => m.setMap(null)); aqMarkersRef.current = []
    if (!showAirQuality) return
    AIR_QUALITY_STATIONS.forEach(st => {
      const color = AQI_COLOR[st.aqi] ?? '#94a3b8'
      const circle = new window.google.maps.Circle({
        center: { lat: st.lat, lng: st.lng }, radius: 1600, map: mapInstance.current!,
        strokeColor: color, strokeOpacity: 0.5, strokeWeight: 1.5,
        fillColor: color, fillOpacity: 0.13,
      })
      const marker = new window.google.maps.Marker({
        position: { lat: st.lat, lng: st.lng }, map: mapInstance.current!,
        icon: { url: aqiMarkerSvg(st.aqi), scaledSize: new window.google.maps.Size(56, 56), anchor: new window.google.maps.Point(28, 28) },
        title: st.name,
      })
      const content = darkInfoHTML(st.name, [
        ['AQI indeks', String(st.aqi), color],
        ['Kvaliteta', AQI_LABEL[st.aqi] ?? '', color],
        ['PM2.5', `${st.pm25} μg/m³`, st.pm25 <= 10 ? '#22c55e' : st.pm25 <= 25 ? '#eab308' : '#ef4444'],
      ])
      marker.addListener('click', () => { infoWindowRef.current?.setContent(content); infoWindowRef.current?.open(mapInstance.current!, marker) })
      circle.addListener('click', () => { infoWindowRef.current?.setContent(content); infoWindowRef.current?.open(mapInstance.current!, marker) })
      aqCirclesRef.current.push(circle)
      aqMarkersRef.current.push(marker)
    })
  }, [showAirQuality, mapReady])

  // ZagrebBike cycling stations
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return
    cyclingMarkersRef.current.forEach(m => m.setMap(null)); cyclingMarkersRef.current = []
    if (!showCycling) return
    BIKE_STATIONS.forEach(station => {
      const marker = new window.google.maps.Marker({
        position: { lat: station.lat, lng: station.lng }, map: mapInstance.current!,
        icon: { url: bikeIcon(station.bikes), scaledSize: new window.google.maps.Size(32, 32), anchor: new window.google.maps.Point(16, 16) },
        title: station.name,
      })
      marker.addListener('click', () => {
        const avail = station.bikes
        infoWindowRef.current?.setContent(darkInfoHTML(station.name, [
          ['Dostupna bicikla', String(avail), avail > 3 ? '#22c55e' : avail > 0 ? '#eab308' : '#6b7280'],
          ['Slobodna mjesta', String(station.docks - avail), 'rgba(255,255,255,0.6)'],
          ['Ukupno priključaka', String(station.docks), 'rgba(255,255,255,0.4)'],
          ['ZagrebBike', 'Nextbike', '#D4764A'],
        ]))
        infoWindowRef.current?.open(mapInstance.current!, marker)
      })
      cyclingMarkersRef.current.push(marker)
    })
  }, [showCycling, mapReady])

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    return (
      <div className="w-full h-full min-h-[400px] rounded-2xl border border-dashed border-white/15 flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-white/40 text-sm">Dodajte</p>
          <code className="text-[#D4764A] text-xs bg-white/5 px-2 py-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>
          <p className="text-white/40 text-sm">u .env.local za prikaz karte</p>
        </div>
      </div>
    )
  }
  if (mapError === 'billing') {
    return (
      <div className="w-full h-full min-h-[400px] rounded-2xl border border-amber-500/20 bg-amber-500/5 flex items-center justify-center p-6">
        <div className="text-center space-y-3 max-w-sm">
          <div className="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center mx-auto"><span className="text-lg">🗺️</span></div>
          <p className="text-amber-400 font-semibold text-sm">Google Maps — naplata nije aktivirana</p>
          <p className="text-white/40 text-xs leading-relaxed">Google Maps API zahtijeva aktiviranu naplatu u Google Cloud konzoli (besplatan tier je dostupan).</p>
          <a href="https://console.cloud.google.com/billing" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 border border-amber-500/30 rounded-lg px-3 py-1.5 transition-colors">Aktivirajte naplatu →</a>
        </div>
      </div>
    )
  }
  if (mapError === 'auth') {
    return (
      <div className="w-full h-full min-h-[400px] rounded-2xl border border-red-500/20 bg-red-500/5 flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <p className="text-red-400 text-sm font-medium">Greška pri učitavanju karte</p>
          <p className="text-white/40 text-xs">Provjerite API ključ u .env.local</p>
        </div>
      </div>
    )
  }
  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-2xl overflow-hidden" style={{ minHeight: 400 }} />
      {!mapReady && (
        <div className="absolute inset-0 rounded-2xl bg-[#0F1419] flex items-center justify-center">
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-[#D4764A]/60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function getBoundsForNeighborhood(id: string, centroid: { lat: number; lng: number }): Array<{ lat: number; lng: number }> {
  const b: Record<string, Array<{ lat: number; lng: number }>> = {
    'donji-grad':          [{ lat: 45.8200, lng: 15.9650 }, { lat: 45.8200, lng: 16.0000 }, { lat: 45.8050, lng: 16.0000 }, { lat: 45.8050, lng: 15.9650 }],
    'gornji-grad':         [{ lat: 45.8300, lng: 15.9600 }, { lat: 45.8300, lng: 15.9900 }, { lat: 45.8100, lng: 15.9900 }, { lat: 45.8100, lng: 15.9600 }],
    'trnje':               [{ lat: 45.8070, lng: 15.9750 }, { lat: 45.8070, lng: 16.0200 }, { lat: 45.7900, lng: 16.0200 }, { lat: 45.7900, lng: 15.9750 }],
    'maksimir':            [{ lat: 45.8400, lng: 15.9950 }, { lat: 45.8400, lng: 16.0800 }, { lat: 45.8050, lng: 16.0800 }, { lat: 45.8050, lng: 15.9950 }],
    'pescenica-zitnjak':   [{ lat: 45.8200, lng: 16.0100 }, { lat: 45.8200, lng: 16.1000 }, { lat: 45.7900, lng: 16.1000 }, { lat: 45.7900, lng: 16.0100 }],
    'novi-zagreb-istok':   [{ lat: 45.7900, lng: 15.9800 }, { lat: 45.7900, lng: 16.0700 }, { lat: 45.7600, lng: 16.0700 }, { lat: 45.7600, lng: 15.9800 }],
    'novi-zagreb-zapad':   [{ lat: 45.7950, lng: 15.8900 }, { lat: 45.7950, lng: 15.9800 }, { lat: 45.7600, lng: 15.9800 }, { lat: 45.7600, lng: 15.8900 }],
    'tresnjevka-sjever':   [{ lat: 45.8250, lng: 15.9200 }, { lat: 45.8250, lng: 15.9750 }, { lat: 45.7980, lng: 15.9750 }, { lat: 45.7980, lng: 15.9200 }],
    'tresnjevka-jug':      [{ lat: 45.8100, lng: 15.9200 }, { lat: 45.8100, lng: 15.9700 }, { lat: 45.7800, lng: 15.9700 }, { lat: 45.7800, lng: 15.9200 }],
    'crnomerec':           [{ lat: 45.8400, lng: 15.8900 }, { lat: 45.8400, lng: 15.9600 }, { lat: 45.8000, lng: 15.9600 }, { lat: 45.8000, lng: 15.8900 }],
    'gornja-dubrava':      [{ lat: 45.8600, lng: 16.0400 }, { lat: 45.8600, lng: 16.1300 }, { lat: 45.8200, lng: 16.1300 }, { lat: 45.8200, lng: 16.0400 }],
    'donja-dubrava':       [{ lat: 45.8300, lng: 16.0500 }, { lat: 45.8300, lng: 16.1200 }, { lat: 45.8000, lng: 16.1200 }, { lat: 45.8000, lng: 16.0500 }],
    'stenjevec':           [{ lat: 45.8400, lng: 15.8500 }, { lat: 45.8400, lng: 15.9300 }, { lat: 45.8000, lng: 15.9300 }, { lat: 45.8000, lng: 15.8500 }],
    'podsused-vrapce':     [{ lat: 45.8400, lng: 15.8100 }, { lat: 45.8400, lng: 15.8900 }, { lat: 45.8000, lng: 15.8900 }, { lat: 45.8000, lng: 15.8100 }],
    'podsljeme':           [{ lat: 45.8800, lng: 15.9000 }, { lat: 45.8800, lng: 16.0100 }, { lat: 45.8400, lng: 16.0100 }, { lat: 45.8400, lng: 15.9000 }],
    'sesvete':             [{ lat: 45.8700, lng: 16.0800 }, { lat: 45.8700, lng: 16.1700 }, { lat: 45.8000, lng: 16.1700 }, { lat: 45.8000, lng: 16.0800 }],
    'brezovica':           [{ lat: 45.7700, lng: 15.8500 }, { lat: 45.7700, lng: 15.9500 }, { lat: 45.7300, lng: 15.9500 }, { lat: 45.7300, lng: 15.8500 }],
  }
  return b[id] ?? [
    { lat: centroid.lat + 0.015, lng: centroid.lng - 0.020 },
    { lat: centroid.lat + 0.015, lng: centroid.lng + 0.020 },
    { lat: centroid.lat - 0.015, lng: centroid.lng + 0.020 },
    { lat: centroid.lat - 0.015, lng: centroid.lng - 0.020 },
  ]
}
