'use client'

import { motion } from 'framer-motion'
import { ScoreGauge } from './score-gauge'
import type { NeighborhoodScore } from '@/types'
import { Construction, Train, Baby, Wind, ChevronRight, MapPin } from 'lucide-react'

interface NeighborhoodCardProps {
  neighborhood: NeighborhoodScore
  rank: number
  selected?: boolean
  onSelect?: () => void
  onShowApartments?: () => void
  onCompare?: () => void
}

function getScoreLabel(score: number) {
  if (score >= 80) return { label: 'Odlično', color: 'text-emerald-400' }
  if (score >= 65) return { label: 'Vrlo dobro', color: 'text-green-400' }
  if (score >= 50) return { label: 'Dobro', color: 'text-yellow-400' }
  if (score >= 35) return { label: 'Osrednje', color: 'text-orange-400' }
  return { label: 'Slabo', color: 'text-red-400' }
}

export function NeighborhoodCard({
  neighborhood,
  rank,
  selected,
  onSelect,
  onShowApartments,
}: NeighborhoodCardProps) {
  const { label, color } = getScoreLabel(neighborhood.score)
  const topComponents = neighborhood.scoreBreakdown.filter(c => c.value > 0).slice(0, 3)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.07, duration: 0.4 }}
      onClick={onSelect}
      className={`
        relative cursor-pointer rounded-2xl p-4 border transition-all duration-200
        ${selected
          ? 'border-[#D4764A]/80 bg-[#D4764A]/10 shadow-[0_0_24px_rgba(212,118,74,0.15)]'
          : 'border-white/8 bg-white/4 hover:bg-white/8 hover:border-white/15'
        }
      `}
    >
      {/* Rank badge */}
      <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-[#1C2937] border border-white/15 flex items-center justify-center">
        <span className="text-[11px] font-bold text-white/60">#{rank}</span>
      </div>

      <div className="flex items-start gap-4">
        {/* Score gauge */}
        <div className="shrink-0">
          <ScoreGauge score={neighborhood.score} size={72} strokeWidth={7} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-white text-[15px] leading-tight">{neighborhood.nameCroatian}</h3>
              <span className={`text-xs font-medium ${color}`}>{label}</span>
            </div>
            {neighborhood.activeWorksCount > 0 && (
              <div className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/25 rounded-lg px-2 py-1 shrink-0">
                <Construction className="w-3 h-3 text-amber-400" />
                <span className="text-[11px] text-amber-400 font-medium">{neighborhood.activeWorksCount}</span>
              </div>
            )}
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-3 mt-2">
            {neighborhood.nearestZetMeters < 2000 && (
              <div className="flex items-center gap-1 text-[11px] text-white/50">
                <Train className="w-3 h-3" />
                <span>{neighborhood.nearestZetMeters < 1000 ? `${neighborhood.nearestZetMeters}m` : `${(neighborhood.nearestZetMeters / 1000).toFixed(1)}km`}</span>
              </div>
            )}
            {neighborhood.kindergartenSpotsCount > 0 && (
              <div className="flex items-center gap-1 text-[11px] text-white/50">
                <Baby className="w-3 h-3" />
                <span>{neighborhood.kindergartenSpotsCount} mjesta</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-[11px] text-white/50">
              <Wind className="w-3 h-3" />
              <span>AQI {neighborhood.airQualityIndex}</span>
            </div>
            {neighborhood.commuteMinutes && (
              <div className="flex items-center gap-1 text-[11px] text-white/50">
                <MapPin className="w-3 h-3" />
                <span>{neighborhood.commuteMinutes} min</span>
              </div>
            )}
          </div>

          {/* Top reasons */}
          {topComponents.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {topComponents.map((c, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/12 text-emerald-400 border border-emerald-500/20">
                  +{c.value} {c.labelHr}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-white/6">
        <button
          onClick={(e) => { e.stopPropagation(); onShowApartments?.() }}
          className="flex-1 text-[12px] font-medium text-[#D4764A] hover:text-[#e8855a] transition-colors flex items-center justify-center gap-1 py-1.5"
        >
          Prikaži stanove
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  )
}
