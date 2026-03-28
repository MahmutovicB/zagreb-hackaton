'use client'

import { Construction, Train, Baby, Wind, Bike } from 'lucide-react'

export interface MapLayers {
  radar: boolean
  transit: boolean
  kindergartens: boolean
  airQuality: boolean
  cycling: boolean
}

interface LayerControlsProps {
  layers: MapLayers
  onToggle: (key: keyof MapLayers) => void
  radarCount?: number
}

const LAYER_CONFIG = [
  { key: 'radar' as const, label: 'Komunalni radar', icon: Construction, activeColor: 'bg-red-500/20 border-red-500/40 text-red-400', dotColor: 'bg-red-400' },
  { key: 'transit' as const, label: 'ZET postaje', icon: Train, activeColor: 'bg-blue-500/20 border-blue-500/40 text-blue-400', dotColor: 'bg-blue-400' },
  { key: 'kindergartens' as const, label: 'Vrtići', icon: Baby, activeColor: 'bg-pink-500/20 border-pink-500/40 text-pink-400', dotColor: 'bg-pink-400' },
  { key: 'airQuality' as const, label: 'Kvaliteta zraka', icon: Wind, activeColor: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400', dotColor: 'bg-cyan-400' },
  { key: 'cycling' as const, label: 'Biciklizam', icon: Bike, activeColor: 'bg-green-500/20 border-green-500/40 text-green-400', dotColor: 'bg-green-400' },
]

export function LayerControls({ layers, onToggle, radarCount }: LayerControlsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {LAYER_CONFIG.map(({ key, label, icon: Icon, activeColor, dotColor }) => {
        const active = layers[key]
        return (
          <button
            key={key}
            onClick={() => onToggle(key)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-200
              ${active ? activeColor : 'bg-black/40 border-white/10 text-white/50 hover:bg-white/8 hover:text-white/70'}
            `}
          >
            {active && <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`} />}
            <Icon className="w-3 h-3" />
            {label}
            {key === 'radar' && radarCount != null && active && (
              <span className="ml-0.5 bg-red-500/30 text-red-300 rounded-md px-1 py-0.5 text-[10px]">{radarCount}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
