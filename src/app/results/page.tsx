'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { ZagrebMap } from '@/components/map/ZagrebMap'
import { NeighborhoodCard } from '@/components/neighborhood-card'
import { ApartmentDrawer } from '@/components/apartment-drawer'
import { LayerControls, type MapLayers } from '@/components/layer-controls'
import type { NeighborhoodScore, KomunalniWork, Kindergarten, MatchResponse } from '@/types'

function ResultsContent() {
  const params = useSearchParams()
  const router = useRouter()
  const query = params.get('q') ?? ''

  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<MatchResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [apartmentNeighborhood, setApartmentNeighborhood] = useState<NeighborhoodScore | null>(null)
  const [radarWorks, setRadarWorks] = useState<KomunalniWork[]>([])
  const [kindergartens, setKindergartens] = useState<Kindergarten[]>([])
  const [layers, setLayers] = useState<MapLayers>({
    radar: false,
    transit: false,
    kindergartens: false,
    airQuality: false,
    cycling: false,
  })

  useEffect(() => {
    if (!query) return
    setLoading(true)
    setError(null)

    fetch('/api/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    })
      .then(r => r.json())
      .then(data => {
        setResult(data)
        setLoading(false)
        if (data.neighborhoods?.length) setSelectedId(data.neighborhoods[0].id)
      })
      .catch(() => {
        setError('Greška pri učitavanju. Pokušajte ponovo.')
        setLoading(false)
      })
  }, [query])

  // Fetch radar and kindergartens in background
  useEffect(() => {
    fetch('/api/radar').then(r => r.json()).then(d => setRadarWorks(d.works ?? []))
    fetch('/api/kindergartens').then(r => r.json()).then(d => setKindergartens(d.kindergartens ?? []))
  }, [])

  const toggleLayer = useCallback((key: keyof MapLayers) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const activeRadarCount = radarWorks.filter(w => w.status === 'u_tijeku').length

  return (
    <div className="h-screen bg-[#080D12] flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/6 bg-[#0A0F16]/90 backdrop-blur-xl z-10 shrink-0">
        <button
          onClick={() => router.push('/')}
          className="w-8 h-8 rounded-xl bg-white/6 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white/70 truncate">
            <span className="text-white/30 mr-1">Pretraga:</span>
            {query}
          </p>
        </div>
        {result?.neighborhoods && (
          <span className="text-xs text-white/30 shrink-0">{result.neighborhoods.length} kvartova ocijenjeno</span>
        )}
      </div>

      {/* Main split layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel — results */}
        <div className="w-full md:w-[420px] lg:w-[460px] shrink-0 flex flex-col border-r border-white/6 overflow-hidden">
          {/* AI Narrative */}
          <AnimatePresence>
            {result?.narrative && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 py-3 border-b border-white/6 bg-[#D4764A]/5"
              >
                <p className="text-sm text-white/70 leading-relaxed">{result.narrative}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading state */}
          {loading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3">
                <Loader2 className="w-8 h-8 text-[#D4764A] animate-spin mx-auto" />
                <p className="text-sm text-white/40">AI analizira 17 kvartova…</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex-1 flex items-center justify-center px-6">
              <div className="text-center space-y-2">
                <p className="text-red-400 text-sm">{error}</p>
                <button
                  onClick={() => router.push('/')}
                  className="text-xs text-white/40 hover:text-white/60 transition-colors"
                >
                  ← Pokušajte ponovo
                </button>
              </div>
            </div>
          )}

          {/* Neighborhood list */}
          {result?.neighborhoods && (
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {result.neighborhoods.map((n, i) => (
                <NeighborhoodCard
                  key={n.id}
                  neighborhood={n}
                  rank={i + 1}
                  selected={selectedId === n.id}
                  onSelect={() => setSelectedId(n.id)}
                  onShowApartments={() => setApartmentNeighborhood(n)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right panel — map */}
        <div className="flex-1 relative hidden md:flex flex-col">
          {/* Layer controls */}
          <div className="absolute top-3 left-3 right-3 z-10 flex items-center gap-2">
            <div className="flex-1 bg-black/50 backdrop-blur-xl rounded-xl p-2 border border-white/8">
              <LayerControls layers={layers} onToggle={toggleLayer} radarCount={activeRadarCount} />
            </div>
          </div>

          {/* Map */}
          <div className="flex-1 p-2 pt-16">
            <ZagrebMap
              neighborhoods={result?.neighborhoods ?? []}
              radarWorks={radarWorks}
              kindergartens={kindergartens}
              selectedId={selectedId}
              showRadar={layers.radar}
              showKindergartens={layers.kindergartens}
              onNeighborhoodClick={setSelectedId}
              focusNeighborhoodId={selectedId}
              zoom={12}
            />
          </div>

          {/* Score legend */}
          <div className="absolute bottom-6 right-4 bg-black/60 backdrop-blur-xl rounded-xl p-3 border border-white/8">
            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">AI Score</p>
            <div className="space-y-1">
              {[
                { color: '#22c55e', label: '75–100 Odlično' },
                { color: '#eab308', label: '50–74 Dobro' },
                { color: '#f97316', label: '25–49 Osrednje' },
                { color: '#ef4444', label: '0–24 Slabo' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color + '55', border: `1.5px solid ${color}` }} />
                  <span className="text-[10px] text-white/50">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Apartment drawer */}
      <ApartmentDrawer
        neighborhood={apartmentNeighborhood}
        onClose={() => setApartmentNeighborhood(null)}
      />
    </div>
  )
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-[#080D12] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#D4764A] animate-spin" />
      </div>
    }>
      <ResultsContent />
    </Suspense>
  )
}
