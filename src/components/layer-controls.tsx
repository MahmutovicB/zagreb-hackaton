'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Construction, Train, Baby, Wind, Bike } from 'lucide-react'
import { useLang } from '@/lib/lang-context'

export interface MapLayers {
  radar: boolean
  transit: boolean
  kindergartens: boolean
  airQuality: boolean
  cycling: boolean
}

export interface LayerCounts {
  radar?: number
  transit?: number
  kindergartens?: number
  airQuality?: number
  cycling?: number
}

interface LayerControlsProps {
  layers: MapLayers
  onToggle: (key: keyof MapLayers) => void
  counts?: LayerCounts
}

const LAYER_LABELS: Record<string, { hr: string; en: string }> = {
  radar:         { hr: 'Komunalni radar', en: 'Utility radar'   },
  transit:       { hr: 'ZET postaje',     en: 'Transit stops'   },
  kindergartens: { hr: 'Vrtići',          en: 'Kindergartens'   },
  airQuality:    { hr: 'Zrak',            en: 'Air quality'     },
  cycling:       { hr: 'Biciklizam',      en: 'Cycling'         },
}

const LAYER_CONFIG = [
  { key: 'radar' as const,        icon: Construction, activeColor: '#ef4444', activeBg: 'rgba(239,68,68,0.12)',   activeBorder: 'rgba(239,68,68,0.35)'  },
  { key: 'transit' as const,      icon: Train,        activeColor: '#3b82f6', activeBg: 'rgba(59,130,246,0.12)',  activeBorder: 'rgba(59,130,246,0.35)' },
  { key: 'kindergartens' as const,icon: Baby,         activeColor: '#ec4899', activeBg: 'rgba(236,72,153,0.12)',  activeBorder: 'rgba(236,72,153,0.35)' },
  { key: 'airQuality' as const,   icon: Wind,         activeColor: '#22c55e', activeBg: 'rgba(34,197,94,0.12)',   activeBorder: 'rgba(34,197,94,0.35)'  },
  { key: 'cycling' as const,      icon: Bike,         activeColor: '#22c55e', activeBg: 'rgba(34,197,94,0.12)',   activeBorder: 'rgba(34,197,94,0.35)'  },
]

export function LayerControls({ layers, onToggle, counts = {} }: LayerControlsProps) {
  const lang = useLang()
  return (
    <div className="flex flex-wrap gap-1.5">
      {LAYER_CONFIG.map(({ key, icon: Icon, activeColor, activeBg, activeBorder }) => {
        const label = LAYER_LABELS[key][lang]
        const active = layers[key]
        const count = counts[key]
        return (
          <motion.button
            key={key}
            onClick={() => onToggle(key)}
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors duration-150 relative overflow-hidden"
            style={active
              ? { background: activeBg, borderColor: activeBorder, color: activeColor }
              : { background: 'rgba(0,0,0,0.4)', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }
            }
          >
            {/* Active glow pulse */}
            <AnimatePresence>
              {active && (
                <motion.span
                  key="glow"
                  className="absolute inset-0 rounded-xl pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.3, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  style={{ background: `radial-gradient(ellipse at center, ${activeColor}40, transparent 70%)` }}
                />
              )}
            </AnimatePresence>

            {/* Active dot indicator */}
            {active && (
              <motion.span
                layoutId={`dot-${key}`}
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: activeColor }}
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}

            <Icon className="w-3 h-3 shrink-0" />
            <span>{label}</span>

            {/* Count badge */}
            {count != null && active && (
              <motion.span
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                className="rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums"
                style={{ background: `${activeColor}28`, color: activeColor }}
              >
                {count}
              </motion.span>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
