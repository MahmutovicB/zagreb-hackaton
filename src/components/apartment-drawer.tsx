'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, Building2 } from 'lucide-react'
import type { NeighborhoodScore } from '@/types'

interface ApartmentDrawerProps {
  neighborhood: NeighborhoodScore | null
  onClose: () => void
}

interface ApartmentData {
  njuskalUrl: string
  places: Array<{ name: string; vicinity: string; rating?: number }>
}

export function ApartmentDrawer({ neighborhood, onClose }: ApartmentDrawerProps) {
  const [data, setData] = useState<ApartmentData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!neighborhood) { setData(null); return }
    setLoading(true)
    const params = new URLSearchParams({
      neighborhood: neighborhood.nameCroatian,
      lat: String(neighborhood.centroid.lat),
      lng: String(neighborhood.centroid.lng),
    })
    fetch(`/api/apartments?${params}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [neighborhood])

  return (
    <AnimatePresence>
      {neighborhood && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 md:left-auto md:top-0 md:bottom-0 md:w-[420px] md:right-0 z-50 bg-[#0F1419] border-t md:border-t-0 md:border-l border-white/10 rounded-t-3xl md:rounded-t-none flex flex-col"
            style={{ maxHeight: '85vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/8">
              <div>
                <h2 className="text-base font-semibold text-white">Stanovi — {neighborhood.nameCroatian}</h2>
                <p className="text-xs text-white/40 mt-0.5">Tražimo ponude za ovaj kvart</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {loading && (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 rounded-xl bg-white/4 animate-pulse" />
                  ))}
                </div>
              )}

              {data && (
                <>
                  {/* Primary Njuškalo CTA */}
                  <a
                    href={data.njuskalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between w-full p-4 rounded-xl bg-[#D4764A]/15 border border-[#D4764A]/30 hover:bg-[#D4764A]/20 transition-colors group"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#D4764A]">Pretraži na Njuškalo</p>
                      <p className="text-xs text-white/50 mt-0.5">Oglasi za {neighborhood.nameCroatian}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-[#D4764A] group-hover:translate-x-0.5 transition-transform" />
                  </a>

                  {/* Real estate agencies */}
                  {data.places.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2">Agencije u blizini</p>
                      <div className="space-y-2">
                        {data.places.map((p, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/4 border border-white/6">
                            <div className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center shrink-0">
                              <Building2 className="w-4 h-4 text-white/40" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{p.name}</p>
                              <p className="text-xs text-white/40 truncate">{p.vicinity}</p>
                            </div>
                            {p.rating && (
                              <span className="text-xs text-yellow-400 font-medium">★ {p.rating}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Score summary */}
                  <div className="p-4 rounded-xl bg-white/3 border border-white/6">
                    <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">Zašto ovaj kvart?</p>
                    <div className="space-y-2">
                      {neighborhood.scoreBreakdown.filter(c => c.value > 0).slice(0, 4).map((c, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-emerald-400 text-xs mt-0.5">+{c.value}</span>
                          <span className="text-xs text-white/60">{c.reason}</span>
                        </div>
                      ))}
                      {neighborhood.scoreBreakdown.filter(c => c.value < 0).slice(0, 2).map((c, i) => (
                        <div key={`neg-${i}`} className="flex items-start gap-2">
                          <span className="text-red-400 text-xs mt-0.5">{c.value}</span>
                          <span className="text-xs text-white/60">{c.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
