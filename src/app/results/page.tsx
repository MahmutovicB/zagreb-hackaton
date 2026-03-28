'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Loader2, ChevronDown, ChevronUp, Search } from 'lucide-react'
import { ZagrebMap } from '@/components/map/ZagrebMap'
import { NeighborhoodCard } from '@/components/neighborhood-card'
import { ApartmentDrawer } from '@/components/apartment-drawer'
import { LayerControls, type MapLayers } from '@/components/layer-controls'
import type { NeighborhoodScore, KomunalniWork, Kindergarten, MatchResponse } from '@/types'

// Skeleton card for loading state
function SkeletonCard({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
      className="rounded-2xl bg-[#111620] border border-white/6 p-4 space-y-3"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-2 rounded bg-white/8 animate-pulse" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 rounded bg-white/10 animate-pulse w-3/5" />
          <div className="h-2 rounded bg-white/6 animate-pulse w-2/5" />
        </div>
        <div className="h-6 w-8 rounded bg-white/8 animate-pulse" />
      </div>
      <div className="h-1 rounded-full bg-white/6 animate-pulse mx-11" />
      <div className="flex gap-1.5 px-11">
        {[40, 56, 44].map((w, i) => (
          <div key={i} className="h-5 rounded-md bg-white/6 animate-pulse" style={{ width: w }} />
        ))}
      </div>
    </motion.div>
  )
}

function NarrativePanel({ text }: { text: string }) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b border-white/8"
    >
      <button
        className="w-full flex items-start gap-2.5 px-4 py-3 text-left"
        onClick={() => setCollapsed(v => !v)}
      >
        <span className="text-[10px] font-bold text-[#D4764A] uppercase tracking-widest shrink-0 mt-0.5">AI</span>
        <AnimatePresence initial={false} mode="wait">
          {collapsed ? (
            <motion.p key="collapsed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-xs text-white/35 leading-relaxed line-clamp-1 flex-1">
              {text}
            </motion.p>
          ) : (
            <motion.p key="expanded" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-xs text-white/60 leading-relaxed flex-1">
              {text}
            </motion.p>
          )}
        </AnimatePresence>
        <span className="text-white/25 shrink-0 mt-0.5">
          {collapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </span>
      </button>
    </motion.div>
  )
}

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
  const [filterText, setFilterText] = useState('')
  const [layers, setLayers] = useState<MapLayers>({
    radar: false, transit: false, kindergartens: false, airQuality: false, cycling: false,
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

  useEffect(() => {
    fetch('/api/radar').then(r => r.json()).then(d => setRadarWorks(d.works ?? []))
    fetch('/api/kindergartens').then(r => r.json()).then(d => setKindergartens(d.kindergartens ?? []))
  }, [])

  const toggleLayer = useCallback((key: keyof MapLayers) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const activeRadarCount = radarWorks.filter(w => w.status === 'u_tijeku').length

  const filteredNeighborhoods = result?.neighborhoods?.filter(n =>
    !filterText || n.nameCroatian.toLowerCase().includes(filterText.toLowerCase())
  ) ?? []

  return (
    <div className="h-screen bg-[#080D12] flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/6 bg-[#080D12]/95 backdrop-blur-xl z-10 shrink-0">
        <button
          onClick={() => router.push('/')}
          className="w-8 h-8 rounded-xl bg-white/6 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="text-[10px] font-bold text-[#D4764A]/60 uppercase tracking-widest shrink-0">Pretraga</span>
          <p className="text-sm text-white/60 truncate">{query}</p>
        </div>
        {result?.neighborhoods && (
          <span
            className="text-[10px] font-semibold shrink-0 px-2 py-1 rounded-md"
            style={{ background: 'rgba(212,118,74,0.1)', color: 'rgba(212,118,74,0.8)' }}
          >
            {result.neighborhoods.length} kvartova
          </span>
        )}
      </div>

      {/* Main split layout */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── LEFT PANEL ── */}
        <div className="w-full md:w-[400px] lg:w-[440px] shrink-0 flex flex-col border-r border-white/6 overflow-hidden bg-[#0A0E16]">

          {/* AI Narrative */}
          <AnimatePresence>
            {result?.narrative && <NarrativePanel text={result.narrative} />}
          </AnimatePresence>

          {/* List header with filter */}
          {(result?.neighborhoods || loading) && (
            <div className="px-4 py-2.5 border-b border-white/6 shrink-0">
              {loading ? (
                <div className="flex items-center gap-2 text-xs text-white/30">
                  <Loader2 className="w-3 h-3 animate-spin text-[#D4764A]" />
                  <span>AI analizira 17 kvartova…</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 bg-white/4 border border-white/8 rounded-lg px-2.5 py-1.5">
                    <Search className="w-3 h-3 text-white/25 shrink-0" />
                    <input
                      type="text"
                      placeholder="Filtriraj kvartove…"
                      value={filterText}
                      onChange={e => setFilterText(e.target.value)}
                      className="flex-1 bg-transparent text-xs text-white/70 placeholder-white/20 outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-white/25 shrink-0">
                    {filteredNeighborhoods.length}/{result?.neighborhoods?.length}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex-1 flex items-center justify-center px-6">
              <div className="text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
                  <span className="text-red-400 text-lg">!</span>
                </div>
                <p className="text-red-400/80 text-sm">{error}</p>
                <button onClick={() => router.push('/')}
                  className="text-xs text-white/30 hover:text-white/60 transition-colors border border-white/10 rounded-lg px-3 py-1.5">
                  ← Pokušajte ponovo
                </button>
              </div>
            </div>
          )}

          {/* Loading skeletons */}
          {loading && (
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
              {[0, 1, 2, 3, 4].map(i => <SkeletonCard key={i} delay={i * 0.08} />)}
            </div>
          )}

          {/* ── NEIGHBORHOOD LIST ── */}
          {!loading && filteredNeighborhoods.length > 0 && (
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 scroll-smooth">
              {/* Top 3 section label */}
              {filteredNeighborhoods.length >= 3 && (
                <div className="flex items-center gap-2 px-1 pb-1">
                  <div className="h-px flex-1 bg-gradient-to-r from-[#D4764A]/30 to-transparent" />
                  <span className="text-[9px] font-bold text-[#D4764A]/50 uppercase tracking-widest">Top preporuke</span>
                  <div className="h-px flex-1 bg-gradient-to-l from-[#D4764A]/30 to-transparent" />
                </div>
              )}

              {filteredNeighborhoods.slice(0, 3).map((n, i) => (
                <NeighborhoodCard
                  key={n.id}
                  neighborhood={n}
                  rank={i + 1}
                  selected={selectedId === n.id}
                  onSelect={() => setSelectedId(n.id)}
                  onShowApartments={() => setApartmentNeighborhood(n)}
                />
              ))}

              {/* Remaining section label */}
              {filteredNeighborhoods.length > 3 && (
                <div className="flex items-center gap-2 px-1 pt-1 pb-1">
                  <div className="h-px flex-1 bg-white/6" />
                  <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Ostali kvartovi</span>
                  <div className="h-px flex-1 bg-white/6" />
                </div>
              )}

              {filteredNeighborhoods.slice(3).map((n, i) => (
                <NeighborhoodCard
                  key={n.id}
                  neighborhood={n}
                  rank={i + 4}
                  selected={selectedId === n.id}
                  onSelect={() => setSelectedId(n.id)}
                  onShowApartments={() => setApartmentNeighborhood(n)}
                />
              ))}

              {/* Bottom padding */}
              <div className="h-4" />
            </div>
          )}

          {/* Empty filter result */}
          {!loading && result?.neighborhoods && filteredNeighborhoods.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-white/25">Nema kvartova za &ldquo;{filterText}&rdquo;</p>
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL — MAP ── */}
        <div className="flex-1 relative hidden md:flex flex-col">
          {/* Layer controls */}
          <div className="absolute top-3 left-3 right-3 z-10">
            <div className="bg-[#080D12]/80 backdrop-blur-xl rounded-xl p-2 border border-white/8">
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
          <div className="absolute bottom-6 right-4 bg-[#080D12]/80 backdrop-blur-xl rounded-xl p-3 border border-white/8">
            <p className="text-[9px] text-white/30 uppercase tracking-widest mb-2 font-semibold">AI Score</p>
            <div className="space-y-1.5">
              {[
                { color: '#22c55e', label: '75–100', sublabel: 'Odlično' },
                { color: '#eab308', label: '50–74', sublabel: 'Dobro' },
                { color: '#f97316', label: '25–49', sublabel: 'Osrednje' },
                { color: '#ef4444', label: '0–24', sublabel: 'Slabo' },
              ].map(({ color, label, sublabel }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: color + '40', border: `1.5px solid ${color}` }} />
                  <span className="text-[10px] font-semibold tabular-nums" style={{ color }}>{label}</span>
                  <span className="text-[10px] text-white/30">{sublabel}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

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
