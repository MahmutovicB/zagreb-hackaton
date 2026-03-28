'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { NeighborhoodScore, KomunalniWork, Kindergarten } from '@/types'

const ZAGREB_CENTER = { lat: 45.8150, lng: 15.9819 }

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

function scoreToColor(score: number): { fill: string; stroke: string } {
  if (score >= 75) return { fill: 'rgba(34, 197, 94, 0.22)', stroke: '#22c55e' }
  if (score >= 50) return { fill: 'rgba(234, 179, 8, 0.22)', stroke: '#eab308' }
  if (score >= 25) return { fill: 'rgba(249, 115, 22, 0.22)', stroke: '#f97316' }
  return { fill: 'rgba(239, 68, 68, 0.22)', stroke: '#ef4444' }
}

function categoryColor(category: KomunalniWork['category']): string {
  switch (category) {
    case 'ceste': return '#ef4444'
    case 'vodovod': return '#3b82f6'
    case 'elektrika': return '#f59e0b'
    case 'zelenilo': return '#22c55e'
    default: return '#a78bfa'
  }
}

interface ZagrebMapProps {
  neighborhoods?: NeighborhoodScore[]
  radarWorks?: KomunalniWork[]
  kindergartens?: Kindergarten[]
  selectedId?: string | null
  showRadar?: boolean
  showTransit?: boolean
  showKindergartens?: boolean
  onNeighborhoodClick?: (id: string) => void
  zoom?: number
  focusNeighborhoodId?: string | null
}

declare global {
  interface Window {
    google: typeof google
  }
}

export function ZagrebMap({
  neighborhoods = [],
  radarWorks = [],
  kindergartens = [],
  selectedId,
  showRadar = false,
  showTransit = false,
  showKindergartens = false,
  onNeighborhoodClick,
  zoom = 12,
  focusNeighborhoodId,
}: ZagrebMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<google.maps.Map | null>(null)
  const polygonsRef = useRef<Map<string, google.maps.Polygon>>(new Map())
  const radarMarkersRef = useRef<google.maps.Marker[]>([])
  const kgMarkersRef = useRef<google.maps.Marker[]>([])
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState<'billing' | 'auth' | null>(null)

  const initMap = useCallback(() => {
    if (!mapRef.current || mapInstance.current) return
    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      center: ZAGREB_CENTER,
      zoom,
      styles: MAP_STYLES,
      disableDefaultUI: true,
      zoomControl: true,
      zoomControlOptions: { position: window.google.maps.ControlPosition.RIGHT_CENTER },
      gestureHandling: 'cooperative',
    })
    infoWindowRef.current = new window.google.maps.InfoWindow()
    setMapReady(true)
  }, [zoom])

  // Load Google Maps script
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!key) return

    if (window.google?.maps) { initMap(); return }

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript) {
      existingScript.addEventListener('load', initMap)
      return
    }

    // Global auth failure handler — catches BillingNotEnabledMapError
    ;(window as typeof window & { gm_authFailure?: () => void }).gm_authFailure = () => {
      setMapError('billing')
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=visualization`
    script.async = true
    script.defer = true
    script.onload = () => initMap()
    script.onerror = () => setMapError('auth')
    document.head.appendChild(script)
    return () => {
      delete (window as typeof window & { gm_authFailure?: () => void }).gm_authFailure
    }
  }, [initMap])

  // Draw neighborhood polygons
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return

    // Clear existing polygons
    polygonsRef.current.forEach(p => p.setMap(null))
    polygonsRef.current.clear()

    neighborhoods.forEach(n => {
      const bounds = getBoundsForNeighborhood(n.id, n.centroid)
      const { fill, stroke } = scoreToColor(n.score)
      const isSelected = n.id === selectedId

      const polygon = new window.google.maps.Polygon({
        paths: bounds,
        strokeColor: isSelected ? '#D4764A' : stroke,
        strokeOpacity: isSelected ? 1 : 0.7,
        strokeWeight: isSelected ? 3 : 1.5,
        fillColor: isSelected ? 'rgba(212, 118, 74, 0.25)' : fill,
        fillOpacity: 1,
        map: mapInstance.current!,
      })

      polygon.addListener('click', () => onNeighborhoodClick?.(n.id))
      polygon.addListener('mouseover', () => {
        polygon.setOptions({ strokeWeight: 2.5, fillOpacity: 0.9 })
      })
      polygon.addListener('mouseout', () => {
        if (n.id !== selectedId) polygon.setOptions({ strokeWeight: isSelected ? 3 : 1.5, fillOpacity: 1 })
      })

      polygonsRef.current.set(n.id, polygon)
    })
  }, [neighborhoods, selectedId, mapReady, onNeighborhoodClick])

  // Focus on selected neighborhood
  useEffect(() => {
    if (!mapReady || !mapInstance.current || !focusNeighborhoodId) return
    const n = neighborhoods.find(n => n.id === focusNeighborhoodId)
    if (n) {
      mapInstance.current.panTo(n.centroid)
      mapInstance.current.setZoom(14)
    }
  }, [focusNeighborhoodId, neighborhoods, mapReady])

  // Radar markers
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return

    radarMarkersRef.current.forEach(m => m.setMap(null))
    radarMarkersRef.current = []

    if (!showRadar) return

    radarWorks.forEach(work => {
      if (!work.lat || !work.lng) return
      const color = work.status === 'u_tijeku' ? '#ef4444' : '#f59e0b'
      const catColor = categoryColor(work.category)

      const marker = new window.google.maps.Marker({
        position: { lat: work.lat, lng: work.lng },
        map: mapInstance.current!,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: work.status === 'u_tijeku' ? 9 : 7,
          fillColor: color,
          fillOpacity: 0.9,
          strokeColor: catColor,
          strokeWeight: 2,
        },
        title: work.title,
      })

      marker.addListener('click', () => {
        if (!infoWindowRef.current) return
        const endDate = new Date(work.endDate).toLocaleDateString('hr-HR')
        infoWindowRef.current.setContent(`
          <div style="font-family:sans-serif;padding:8px;max-width:220px">
            <div style="font-weight:600;font-size:13px;color:#111;margin-bottom:4px">${work.title}</div>
            <div style="font-size:11px;color:#666;margin-bottom:2px">${work.address}</div>
            <div style="font-size:11px;margin-bottom:2px">
              <span style="background:${catColor}22;color:${catColor};padding:1px 6px;border-radius:4px">${work.category}</span>
              <span style="margin-left:4px;color:${color};font-weight:500">${work.status === 'u_tijeku' ? '🔴 U tijeku' : '🟡 Planirano'}</span>
            </div>
            <div style="font-size:11px;color:#888">Završetak: ${endDate}</div>
            <div style="font-size:11px;color:#888">${work.holdingCompany}</div>
          </div>
        `)
        infoWindowRef.current.open(mapInstance.current!, marker)
      })

      radarMarkersRef.current.push(marker)
    })
  }, [showRadar, radarWorks, mapReady])

  // Kindergarten markers
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return

    kgMarkersRef.current.forEach(m => m.setMap(null))
    kgMarkersRef.current = []

    if (!showKindergartens) return

    kindergartens.forEach(kg => {
      const hasSpots = kg.freeSpots > 0
      const marker = new window.google.maps.Marker({
        position: { lat: kg.lat, lng: kg.lng },
        map: mapInstance.current!,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 7,
          fillColor: hasSpots ? '#ec4899' : '#6b7280',
          fillOpacity: 0.9,
          strokeColor: '#fff',
          strokeWeight: 1.5,
        },
        title: kg.name,
        label: hasSpots ? {
          text: String(kg.freeSpots),
          color: '#fff',
          fontSize: '10px',
          fontWeight: 'bold',
        } : undefined,
      })

      marker.addListener('click', () => {
        if (!infoWindowRef.current) return
        infoWindowRef.current.setContent(`
          <div style="font-family:sans-serif;padding:8px;max-width:200px">
            <div style="font-weight:600;font-size:13px;color:#111;margin-bottom:4px">${kg.name}</div>
            <div style="font-size:11px;color:#666;margin-bottom:4px">${kg.address}</div>
            <div style="font-size:12px;color:${hasSpots ? '#ec4899' : '#888'}">
              ${hasSpots ? `✓ ${kg.freeSpots} slobodnih mjesta` : '✗ Nema slobodnih mjesta'}
            </div>
            <div style="font-size:11px;color:#888;margin-top:2px">${kg.type === 'gradski' ? 'Gradski vrtić' : kg.type === 'privatni' ? 'Privatni vrtić' : 'Vjerski vrtić'}</div>
          </div>
        `)
        infoWindowRef.current.open(mapInstance.current!, marker)
      })

      kgMarkersRef.current.push(marker)
    })
  }, [showKindergartens, kindergartens, mapReady])

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
          <div className="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center mx-auto">
            <span className="text-lg">🗺️</span>
          </div>
          <p className="text-amber-400 font-semibold text-sm">Google Maps — naplata nije aktivirana</p>
          <p className="text-white/40 text-xs leading-relaxed">
            Google Maps API zahtijeva aktiviranu naplatu u Google Cloud konzoli (besplatan tier je dostupan).
          </p>
          <a
            href="https://console.cloud.google.com/billing"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 border border-amber-500/30 rounded-lg px-3 py-1.5 transition-colors"
          >
            Aktivirajte naplatu →
          </a>
          <p className="text-white/25 text-[11px]">
            Maps JavaScript API · Places API · Geocoding API · Directions API
          </p>
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
      <div
        ref={mapRef}
        className="w-full h-full rounded-2xl overflow-hidden"
        style={{ minHeight: 400 }}
      />
      {!mapReady && (
        <div className="absolute inset-0 rounded-2xl bg-[#0F1419] flex items-center justify-center">
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-[#D4764A]/60 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Generate approximate bounds for each neighborhood
function getBoundsForNeighborhood(id: string, centroid: { lat: number; lng: number }): Array<{ lat: number; lng: number }> {
  const boundsMap: Record<string, Array<{ lat: number; lng: number }>> = {
    'donji-grad': [
      { lat: 45.8200, lng: 15.9650 }, { lat: 45.8200, lng: 16.0000 },
      { lat: 45.8050, lng: 16.0000 }, { lat: 45.8050, lng: 15.9650 }
    ],
    'gornji-grad': [
      { lat: 45.8300, lng: 15.9600 }, { lat: 45.8300, lng: 15.9900 },
      { lat: 45.8100, lng: 15.9900 }, { lat: 45.8100, lng: 15.9600 }
    ],
    'trnje': [
      { lat: 45.8070, lng: 15.9750 }, { lat: 45.8070, lng: 16.0200 },
      { lat: 45.7900, lng: 16.0200 }, { lat: 45.7900, lng: 15.9750 }
    ],
    'maksimir': [
      { lat: 45.8400, lng: 15.9950 }, { lat: 45.8400, lng: 16.0800 },
      { lat: 45.8050, lng: 16.0800 }, { lat: 45.8050, lng: 15.9950 }
    ],
    'pescenica-zitnjak': [
      { lat: 45.8200, lng: 16.0100 }, { lat: 45.8200, lng: 16.1000 },
      { lat: 45.7900, lng: 16.1000 }, { lat: 45.7900, lng: 16.0100 }
    ],
    'novi-zagreb-istok': [
      { lat: 45.7900, lng: 15.9800 }, { lat: 45.7900, lng: 16.0700 },
      { lat: 45.7600, lng: 16.0700 }, { lat: 45.7600, lng: 15.9800 }
    ],
    'novi-zagreb-zapad': [
      { lat: 45.7950, lng: 15.8900 }, { lat: 45.7950, lng: 15.9800 },
      { lat: 45.7600, lng: 15.9800 }, { lat: 45.7600, lng: 15.8900 }
    ],
    'tresnjevka-sjever': [
      { lat: 45.8250, lng: 15.9200 }, { lat: 45.8250, lng: 15.9750 },
      { lat: 45.7980, lng: 15.9750 }, { lat: 45.7980, lng: 15.9200 }
    ],
    'tresnjevka-jug': [
      { lat: 45.8100, lng: 15.9200 }, { lat: 45.8100, lng: 15.9700 },
      { lat: 45.7800, lng: 15.9700 }, { lat: 45.7800, lng: 15.9200 }
    ],
    'crnomerec': [
      { lat: 45.8400, lng: 15.8900 }, { lat: 45.8400, lng: 15.9600 },
      { lat: 45.8000, lng: 15.9600 }, { lat: 45.8000, lng: 15.8900 }
    ],
    'gornja-dubrava': [
      { lat: 45.8600, lng: 16.0400 }, { lat: 45.8600, lng: 16.1300 },
      { lat: 45.8200, lng: 16.1300 }, { lat: 45.8200, lng: 16.0400 }
    ],
    'donja-dubrava': [
      { lat: 45.8300, lng: 16.0500 }, { lat: 45.8300, lng: 16.1200 },
      { lat: 45.8000, lng: 16.1200 }, { lat: 45.8000, lng: 16.0500 }
    ],
    'stenjevec': [
      { lat: 45.8400, lng: 15.8500 }, { lat: 45.8400, lng: 15.9300 },
      { lat: 45.8000, lng: 15.9300 }, { lat: 45.8000, lng: 15.8500 }
    ],
    'podsused-vrapce': [
      { lat: 45.8400, lng: 15.8100 }, { lat: 45.8400, lng: 15.8900 },
      { lat: 45.8000, lng: 15.8900 }, { lat: 45.8000, lng: 15.8100 }
    ],
    'podsljeme': [
      { lat: 45.8800, lng: 15.9000 }, { lat: 45.8800, lng: 16.0100 },
      { lat: 45.8400, lng: 16.0100 }, { lat: 45.8400, lng: 15.9000 }
    ],
    'sesvete': [
      { lat: 45.8700, lng: 16.0800 }, { lat: 45.8700, lng: 16.1700 },
      { lat: 45.8000, lng: 16.1700 }, { lat: 45.8000, lng: 16.0800 }
    ],
    'brezovica': [
      { lat: 45.7700, lng: 15.8500 }, { lat: 45.7700, lng: 15.9500 },
      { lat: 45.7300, lng: 15.9500 }, { lat: 45.7300, lng: 15.8500 }
    ],
  }

  return boundsMap[id] ?? [
    { lat: centroid.lat + 0.015, lng: centroid.lng - 0.020 },
    { lat: centroid.lat + 0.015, lng: centroid.lng + 0.020 },
    { lat: centroid.lat - 0.015, lng: centroid.lng + 0.020 },
    { lat: centroid.lat - 0.015, lng: centroid.lng - 0.020 },
  ]
}
