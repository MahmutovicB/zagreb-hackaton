'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, Building2, Home, Tag, MapPin } from 'lucide-react'
import type { NeighborhoodScore } from '@/types'
import type { PlatformLink } from '@/lib/apartment-platforms'

interface ApartmentDrawerProps {
  neighborhood: NeighborhoodScore | null
  onClose: () => void
}

interface ApartmentData {
  platformLinks: PlatformLink[]
  places: Array<{ name: string; vicinity: string; rating?: number; place_id: string }>
}

type Tab = 'rent' | 'sale'

export function ApartmentDrawer({ neighborhood, onClose }: ApartmentDrawerProps) {
  const [data, setData] = useState<ApartmentData | null>(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<Tab>('rent')

  useEffect(() => {
    if (!neighborhood) { setData(null); return }
    setLoading(true)
    const params = new URLSearchParams({
      neighborhood: neighborhood.nameCroatian,
      id: neighborhood.id,
      lat: String(neighborhood.centroid.lat),
      lng: String(neighborhood.centroid.lng),
    })
    fetch(`/api/apartments?${params}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [neighborhood])

  const rentLinks = data?.platformLinks.filter(p => p.type === 'rent' || p.type === 'both') ?? []
  const saleLinks = data?.platformLinks.filter(p => p.type === 'sale' || p.type === 'both') ?? []
  const activeLinks = tab === 'rent' ? rentLinks : saleLinks

  const neighborhoodLinks = activeLinks.filter(p => p.scope === 'neighborhood')
  const zagrebLinks = activeLinks.filter(p => p.scope === 'zagreb')

  return (
    <AnimatePresence>
      {neighborhood && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 md:left-auto md:top-0 md:bottom-0 md:w-[420px] md:right-0 z-50 bg-[#0D1117] border-t md:border-t-0 md:border-l border-white/10 rounded-t-3xl md:rounded-t-none flex flex-col"
            style={{ maxHeight: '90vh' }}
          >
            {/* Header */}
            <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-white/8 shrink-0">
              <div>
                <h2 className="text-base font-bold text-white leading-tight">
                  Stanovi — {neighborhood.nameCroatian}
                </h2>
                <p className="text-xs text-white/35 mt-0.5">
                  {data ? `${activeLinks.length} platformi` : '…'} · Direktni linkovi
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors shrink-0 ml-3 mt-0.5"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {/* Rent / Sale tabs */}
            <div className="flex gap-1.5 px-5 py-3 border-b border-white/6 shrink-0">
              <TabBtn active={tab === 'rent'} onClick={() => setTab('rent')} icon={Home}>Najam</TabBtn>
              <TabBtn active={tab === 'sale'} onClick={() => setTab('sale')} icon={Tag}>Kupnja</TabBtn>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-5 pt-3">
              {loading && (
                <div className="space-y-2.5">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-[68px] rounded-2xl bg-white/4 animate-pulse" />
                  ))}
                </div>
              )}

              {data && (
                <>
                  {/* Neighborhood-scoped platforms first */}
                  {neighborhoodLinks.length > 0 && (
                    <section className="space-y-2">
                      <SectionLabel icon={MapPin} color="#22c55e">
                        Filtrirano za {neighborhood.nameCroatian}
                      </SectionLabel>
                      {neighborhoodLinks.map((p, i) => (
                        <PlatformCard key={p.id} platform={p} index={i} />
                      ))}
                    </section>
                  )}

                  {/* Zagreb-wide platforms */}
                  {zagrebLinks.length > 0 && (
                    <section className="space-y-2">
                      <SectionLabel icon={MapPin} color="rgba(255,255,255,0.25)">
                        Zagreb — svi kvartovi
                      </SectionLabel>
                      {zagrebLinks.map((p, i) => (
                        <PlatformCard key={p.id} platform={p} index={i} />
                      ))}
                    </section>
                  )}

                  {/* Nearby agencies */}
                  {data.places.length > 0 && (
                    <section className="space-y-2">
                      <SectionLabel icon={Building2} color="rgba(255,255,255,0.25)">
                        Agencije u blizini
                      </SectionLabel>
                      {data.places.map((p, i) => (
                        <a
                          key={i}
                          href={`https://www.google.com/maps/place/?q=place_id:${p.place_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-xl bg-white/4 border border-white/6 hover:bg-white/7 hover:border-white/12 transition-all group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center shrink-0">
                            <Building2 className="w-4 h-4 text-white/35" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white/80 truncate group-hover:text-white transition-colors">{p.name}</p>
                            <p className="text-xs text-white/35 truncate">{p.vicinity}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {p.rating && <span className="text-xs text-yellow-400 font-medium">★ {p.rating}</span>}
                            <ExternalLink className="w-3 h-3 text-white/25 group-hover:text-white/50 transition-colors" />
                          </div>
                        </a>
                      ))}
                    </section>
                  )}

                  {/* Score context */}
                  {neighborhood.scoreBreakdown.length > 0 && (
                    <section className="rounded-2xl bg-white/3 border border-white/6 p-4 space-y-2.5">
                      <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                        Zašto {neighborhood.nameCroatian}?
                      </p>
                      {neighborhood.scoreBreakdown.filter(c => c.value > 0).slice(0, 4).map((c, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <span className="text-[11px] font-bold text-emerald-400 tabular-nums shrink-0 mt-px">+{c.value}</span>
                          <span className="text-xs text-white/50 leading-relaxed">{c.reason}</span>
                        </div>
                      ))}
                      {neighborhood.scoreBreakdown.filter(c => c.value < 0).slice(0, 2).map((c, i) => (
                        <div key={`n-${i}`} className="flex items-start gap-2.5">
                          <span className="text-[11px] font-bold text-red-400 tabular-nums shrink-0 mt-px">{c.value}</span>
                          <span className="text-xs text-white/40 leading-relaxed">{c.reason}</span>
                        </div>
                      ))}
                    </section>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function PlatformCard({ platform, index }: { platform: PlatformLink; index: number }) {
  return (
    <motion.a
      href={platform.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all duration-150 group block"
      style={{ background: platform.bgColor, borderColor: `${platform.color}28` }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = `${platform.color}55`
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = `${platform.color}28`
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
        style={{ background: `${platform.color}15` }}
      >
        {platform.logo}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight" style={{ color: platform.color }}>
          {platform.name}
        </p>
        <p className="text-[11px] text-white/40 mt-0.5 truncate">{platform.tagline}</p>
      </div>
      <ExternalLink
        className="w-4 h-4 shrink-0 opacity-35 group-hover:opacity-80 group-hover:translate-x-0.5 transition-all"
        style={{ color: platform.color }}
      />
    </motion.a>
  )
}

function SectionLabel({ icon: Icon, color, children }: {
  icon: React.ElementType
  color: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-1.5 mb-1">
      <Icon className="w-3 h-3" style={{ color }} />
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>
        {children}
      </span>
    </div>
  )
}

function TabBtn({ active, onClick, icon: Icon, children }: {
  active: boolean
  onClick: () => void
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
      style={{
        background: active ? 'rgba(212,118,74,0.15)' : 'rgba(255,255,255,0.05)',
        color: active ? '#D4764A' : 'rgba(255,255,255,0.35)',
        border: active ? '1px solid rgba(212,118,74,0.35)' : '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <Icon className="w-3 h-3" />
      {children}
    </button>
  )
}
