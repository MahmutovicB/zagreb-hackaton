'use client'

import { useEffect, useRef, useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Loader2, ChevronDown, ChevronUp, Search, Sparkles } from 'lucide-react'
import { ZagrebMap } from '@/components/map/ZagrebMap'
import { NeighborhoodCard } from '@/components/neighborhood-card'
import { ApartmentDrawer } from '@/components/apartment-drawer'
import { LayerControls, type MapLayers, type LayerCounts } from '@/components/layer-controls'
import type { NeighborhoodScore, KomunalniWork, Kindergarten, MatchResponse } from '@/types'
import { LangContext, type Lang } from '@/lib/lang-context'

function SkeletonCard({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-white/6 p-4 space-y-3 overflow-hidden relative"
      style={{ background: '#111620' }}
    >
      {/* Shimmer sweep */}
      <motion.div
        className="absolute inset-0 -translate-x-full"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)' }}
        animate={{ translateX: ['−100%', '200%'] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'linear', delay }}
      />
      <div className="flex items-center gap-3">
        <div className="w-8 h-2.5 rounded-full bg-white/8 animate-pulse" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 rounded-full bg-white/10 animate-pulse w-3/5" />
          <div className="h-2 rounded-full bg-white/6 animate-pulse w-2/5" />
        </div>
        <div className="h-7 w-9 rounded-lg bg-white/8 animate-pulse" />
      </div>
      <div className="h-[3px] rounded-full bg-white/6 animate-pulse mx-11" />
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
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="border-b border-white/8 bg-gradient-to-r from-[#D4764A]/5 to-transparent"
    >
      <button
        className="w-full flex items-start gap-2.5 px-4 py-3 text-left group"
        onClick={() => setCollapsed(v => !v)}
      >
        <div className="flex items-center gap-1 shrink-0 mt-0.5">
          <Sparkles className="w-2.5 h-2.5 text-[#D4764A]" />
          <span className="text-[10px] font-bold text-[#D4764A] uppercase tracking-widest">AI</span>
        </div>
        <AnimatePresence initial={false} mode="wait">
          {collapsed ? (
            <motion.p key="c" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="text-xs text-white/35 leading-relaxed line-clamp-1 flex-1">
              {text}
            </motion.p>
          ) : (
            <motion.p key="e" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="text-xs text-white/60 leading-relaxed flex-1">
              {text}
            </motion.p>
          )}
        </AnimatePresence>
        <motion.span
          className="text-white/25 shrink-0 mt-0.5"
          animate={{ rotate: collapsed ? 0 : 180 }}
          transition={{ duration: 0.25 }}
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </motion.span>
      </button>
    </motion.div>
  )
}

function ResultsContent() {
  const params = useSearchParams()
  const router = useRouter()
  const query = params.get('q') ?? ''
  const [lang, setLang] = useState<Lang>((params.get('lang') as Lang) ?? 'hr')

  const t = {
    search:       lang === 'en' ? 'Search'                          : 'Pretraga',
    neighborhoods:lang === 'en' ? 'neighborhoods'                   : 'kvartova',
    analyzing:    lang === 'en' ? 'AI analyzing 17 neighborhoods…'  : 'AI analizira 17 kvartova…',
    filterPlaceholder: lang === 'en' ? 'Filter neighborhoods…'      : 'Filtriraj kvartove…',
    topPicks:     lang === 'en' ? 'Top picks'                       : 'Top preporuke',
    otherNeigh:   lang === 'en' ? 'Other neighborhoods'             : 'Ostali kvartovi',
    noResults:    lang === 'en' ? `No neighborhoods for`            : `Nema kvartova za`,
    tryAgain:     lang === 'en' ? '← Try again'                     : '← Pokušajte ponovo',
    scoreLegend: {
      title: 'AI Score',
      items: lang === 'en'
        ? [
            { color: '#22c55e', label: '80–100', sublabel: 'Excellent'    },
            { color: '#84cc16', label: '65–79',  sublabel: 'Very good'    },
            { color: '#eab308', label: '50–64',  sublabel: 'Good'         },
            { color: '#f97316', label: '35–49',  sublabel: 'Average'      },
            { color: '#ef4444', label: '0–34',   sublabel: 'Poor'         },
          ]
        : [
            { color: '#22c55e', label: '80–100', sublabel: 'Odlično'    },
            { color: '#84cc16', label: '65–79',  sublabel: 'Vrlo dobro' },
            { color: '#eab308', label: '50–64',  sublabel: 'Dobro'      },
            { color: '#f97316', label: '35–49',  sublabel: 'Osrednje'   },
            { color: '#ef4444', label: '0–34',   sublabel: 'Slabo'      },
          ],
    },
    mapFilter: {
      best: 'Top 1',
      top3: 'Top 3',
      all: lang === 'en' ? 'All' : 'Svi',
    },
  }

  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<MatchResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [apartmentNeighborhood, setApartmentNeighborhood] = useState<NeighborhoodScore | null>(null)
  const [radarWorks, setRadarWorks] = useState<KomunalniWork[]>([])
  const [kindergartens, setKindergartens] = useState<Kindergarten[]>([])
  const [filterText, setFilterText] = useState('')
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<'best' | 'top3' | 'all'>('top3')
  const [layers, setLayers] = useState<MapLayers>({
    radar: false, transit: false, kindergartens: false, airQuality: false, cycling: false,
  })
  const cardRefsMap = useRef<Map<string, HTMLDivElement>>(new Map())

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
      .catch(() => { setError('Greška pri učitavanju. Pokušajte ponovo.'); setLoading(false) })
  }, [query])

  useEffect(() => {
    fetch('/api/radar').then(r => r.json()).then(d => setRadarWorks(d.works ?? []))
    fetch('/api/kindergartens').then(r => r.json()).then(d => setKindergartens(d.kindergartens ?? []))
  }, [])

  // Scroll the selected card into view whenever selection changes
  useEffect(() => {
    if (!selectedId) return
    const el = cardRefsMap.current.get(selectedId)
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [selectedId])

  const toggleLayer = useCallback((key: keyof MapLayers) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const activeRadarCount = radarWorks.filter(w => w.status === 'u_tijeku').length
  const layerCounts: LayerCounts = {
    radar: activeRadarCount,
    transit: 21,
    kindergartens: kindergartens.length,
    airQuality: 8,
    cycling: 15,
  }
  const filteredNeighborhoods = result?.neighborhoods?.filter(n =>
    !filterText || n.nameCroatian.toLowerCase().includes(filterText.toLowerCase())
  ) ?? []

  const mapNeighborhoods = (() => {
    const all = result?.neighborhoods ?? []
    if (neighborhoodFilter === 'best') return all.slice(0, 1)
    if (neighborhoodFilter === 'top3') return all.slice(0, 3)
    return all
  })()

  return (
    <LangContext.Provider value={lang}>
      <div className="h-screen bg-[#080D12] flex flex-col overflow-hidden">

      {/* ── Top bar ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center gap-3 px-4 py-2.5 border-b border-white/6 bg-[#080D12]/95 backdrop-blur-xl z-10 shrink-0"
      >
        <motion.button
          onClick={() => router.push('/')}
          whileHover={{ scale: 1.08, backgroundColor: 'rgba(255,255,255,0.1)' }}
          whileTap={{ scale: 0.93 }}
          className="w-8 h-8 rounded-xl bg-white/6 flex items-center justify-center text-white/50 hover:text-white transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </motion.button>

        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="text-[10px] font-bold text-[#D4764A]/60 uppercase tracking-widest shrink-0">{t.search}</span>
          <motion.p
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.35 }}
            className="text-sm text-white/60 truncate"
          >
            {query}
          </motion.p>
        </div>

        <AnimatePresence>
          {result?.neighborhoods && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="text-[10px] font-semibold shrink-0 px-2 py-1 rounded-md"
              style={{ background: 'rgba(212,118,74,0.12)', color: 'rgba(212,118,74,0.85)' }}
            >
              {result.neighborhoods.length} {t.neighborhoods}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Language toggle */}
        <button
          onClick={() => setLang(l => l === 'hr' ? 'en' : 'hr')}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-white/12 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all shrink-0 ml-1"
        >
          <span className={`text-xs font-semibold transition-colors ${lang === 'hr' ? 'text-white' : 'text-white/30'}`}>HR</span>
          <span className="text-white/20 text-xs mx-0.5">/</span>
          <span className={`text-xs font-semibold transition-colors ${lang === 'en' ? 'text-white' : 'text-white/30'}`}>EN</span>
        </button>
      </motion.div>

      {/* ── Main layout ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── LEFT PANEL ── */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="w-full md:w-[400px] lg:w-[440px] shrink-0 flex flex-col border-r border-white/6 overflow-hidden bg-[#0A0E16]"
        >
          {/* AI Narrative */}
          <AnimatePresence>
            {result?.narrative && <NarrativePanel text={result.narrative} />}
          </AnimatePresence>

          {/* Filter / loading header */}
          {(result?.neighborhoods || loading) && (
            <div className="px-4 py-2.5 border-b border-white/6 shrink-0">
              {loading ? (
                <div className="flex items-center gap-2.5 text-xs text-white/30">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Loader2 className="w-3 h-3 text-[#D4764A]" />
                  </motion.div>
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                  >
                    {t.analyzing}
                  </motion.span>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2"
                >
                  <div className="flex-1 flex items-center gap-2 bg-white/4 border border-white/8 hover:border-white/14 rounded-lg px-2.5 py-1.5 transition-colors">
                    <Search className="w-3 h-3 text-white/25 shrink-0" />
                    <input
                      type="text"
                      placeholder={t.filterPlaceholder}
                      value={filterText}
                      onChange={e => setFilterText(e.target.value)}
                      className="flex-1 bg-transparent text-xs text-white/70 placeholder-white/20 outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-white/25 shrink-0 tabular-nums">
                    {filteredNeighborhoods.length}/{result?.neighborhoods?.length}
                  </span>
                </motion.div>
              )}
            </div>
          )}

          {/* Error state */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex items-center justify-center px-6"
            >
              <div className="text-center space-y-3">
                <motion.div
                  animate={{ scale: [1, 1.06, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto"
                >
                  <span className="text-red-400 text-lg">!</span>
                </motion.div>
                <p className="text-red-400/80 text-sm">{error}</p>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => router.push('/')}
                  className="text-xs text-white/30 hover:text-white/60 transition-colors border border-white/10 rounded-lg px-3 py-1.5"
                >
                  {t.tryAgain}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Skeletons */}
          {loading && (
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
              {[0, 1, 2, 3, 4].map(i => <SkeletonCard key={i} delay={i * 0.07} />)}
            </div>
          )}

          {/* ── Neighborhood list ── */}
          {!loading && filteredNeighborhoods.length > 0 && (
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 scroll-smooth">
              {filteredNeighborhoods.length >= 3 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-2 px-1 pb-1"
                >
                  <div className="h-px flex-1 bg-gradient-to-r from-[#D4764A]/30 to-transparent" />
                  <span className="text-[9px] font-bold text-[#D4764A]/50 uppercase tracking-widest">{t.topPicks}</span>
                  <div className="h-px flex-1 bg-gradient-to-l from-[#D4764A]/30 to-transparent" />
                </motion.div>
              )}

              {filteredNeighborhoods.slice(0, 3).map((n, i) => (
                <div key={n.id} ref={el => { if (el) cardRefsMap.current.set(n.id, el) }}>
                  <NeighborhoodCard
                    neighborhood={n}
                    rank={i + 1}
                    selected={selectedId === n.id}
                    onSelect={() => setSelectedId(n.id)}
                    onShowApartments={() => setApartmentNeighborhood(n)}
                  />
                </div>
              ))}

              {filteredNeighborhoods.length > 3 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="flex items-center gap-2 px-1 pt-1 pb-1"
                >
                  <div className="h-px flex-1 bg-white/6" />
                  <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{t.otherNeigh}</span>
                  <div className="h-px flex-1 bg-white/6" />
                </motion.div>
              )}

              {filteredNeighborhoods.slice(3).map((n, i) => (
                <div key={n.id} ref={el => { if (el) cardRefsMap.current.set(n.id, el) }}>
                  <NeighborhoodCard
                    neighborhood={n}
                    rank={i + 4}
                    selected={selectedId === n.id}
                    onSelect={() => setSelectedId(n.id)}
                    onShowApartments={() => setApartmentNeighborhood(n)}
                  />
                </div>
              ))}

              <div className="h-4" />
            </div>
          )}

          {/* Empty filter */}
          {!loading && result?.neighborhoods && filteredNeighborhoods.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex items-center justify-center"
            >
              <p className="text-sm text-white/25">{t.noResults} &ldquo;{filterText}&rdquo;</p>
            </motion.div>
          )}
        </motion.div>

        {/* ── RIGHT PANEL — MAP ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="flex-1 relative hidden md:flex flex-col"
        >
          {/* Layer controls */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.35 }}
            className="absolute top-3 left-3 right-3 z-10"
          >
            <div className="bg-[#080D12]/85 backdrop-blur-xl rounded-xl p-2 border border-white/8 shadow-lg">
              <LayerControls layers={layers} onToggle={toggleLayer} counts={layerCounts} />
            </div>
          </motion.div>

          {/* Neighborhood filter */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.35 }}
            className="absolute top-[56px] right-3 z-10"
          >
            <div className="bg-[#080D12]/85 backdrop-blur-xl rounded-xl border border-white/8 shadow-lg flex overflow-hidden">
              {(['best', 'top3', 'all'] as const).map((opt, i) => (
                <button
                  key={opt}
                  onClick={() => setNeighborhoodFilter(opt)}
                  className={`px-3 py-1.5 text-[11px] font-semibold tracking-wide transition-colors ${i > 0 ? 'border-l border-white/8' : ''} ${neighborhoodFilter === opt ? 'bg-[#D4764A] text-white' : 'text-white/50 hover:text-white/80'}`}
                >
                  {t.mapFilter[opt]}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Map */}
          <div className="flex-1 p-2 pt-16">
            <div className="w-full h-full rounded-2xl overflow-hidden ring-1 ring-white/6">
              <ZagrebMap
                key={query}
                neighborhoods={mapNeighborhoods}
                radarWorks={radarWorks}
                kindergartens={kindergartens}
                selectedId={selectedId}
                showRadar={layers.radar}
                showTransit={layers.transit}
                showKindergartens={layers.kindergartens}
                showAirQuality={layers.airQuality}
                showCycling={layers.cycling}
                onNeighborhoodClick={setSelectedId}
                focusNeighborhoodId={selectedId}
                zoom={12}
              />
            </div>
          </div>

          {/* Score legend */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.35 }}
            className="absolute bottom-6 right-4 bg-[#080D12]/85 backdrop-blur-xl rounded-xl p-3 border border-white/8 shadow-lg"
          >
            <p className="text-[9px] text-white/30 uppercase tracking-widest mb-2 font-semibold">{t.scoreLegend.title}</p>
            <div className="space-y-1.5">
              {t.scoreLegend.items.map(({ color, label, sublabel }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.06 }}
                  className="flex items-center gap-2"
                >
                  <div className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: color + '40', border: `1.5px solid ${color}` }} />
                  <span className="text-[10px] font-semibold tabular-nums" style={{ color }}>{label}</span>
                  <span className="text-[10px] text-white/30">{sublabel}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>

      <ApartmentDrawer
        neighborhood={apartmentNeighborhood}
        onClose={() => setApartmentNeighborhood(null)}
      />
      </div>
    </LangContext.Provider>
  )
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-[#080D12] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-8 h-8 text-[#D4764A]" />
        </motion.div>
      </div>
    }>
      <ResultsContent />
    </Suspense>
  )
}
