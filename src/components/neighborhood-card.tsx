'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { NeighborhoodScore } from '@/types'
import {
  Construction, Train, Baby, Wind, MapPin,
  Home, ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react'
import { useLang } from '@/lib/lang-context'

interface NeighborhoodCardProps {
  neighborhood: NeighborhoodScore
  rank: number
  selected?: boolean
  onSelect?: () => void
  onShowApartments?: () => void
}

function scoreConfig(score: number) {
  if (score >= 80) return { label: 'Odlično',    color: '#22c55e', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.22)',  glow: 'rgba(34,197,94,0.18)'  }
  if (score >= 65) return { label: 'Vrlo dobro', color: '#84cc16', bg: 'rgba(132,204,22,0.08)',  border: 'rgba(132,204,22,0.22)', glow: 'rgba(132,204,22,0.15)' }
  if (score >= 50) return { label: 'Dobro',      color: '#eab308', bg: 'rgba(234,179,8,0.08)',   border: 'rgba(234,179,8,0.22)',  glow: 'rgba(234,179,8,0.15)'  }
  if (score >= 35) return { label: 'Osrednje',   color: '#f97316', bg: 'rgba(249,115,22,0.08)',  border: 'rgba(249,115,22,0.22)', glow: 'rgba(249,115,22,0.12)' }
  return             { label: 'Slabo',       color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.22)',  glow: 'rgba(239,68,68,0.12)'  }
}

/** Counts up from 0 to target over ~700ms */
function useCountUp(target: number) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    setValue(0)
    const steps = 24
    const interval = 700 / steps
    let step = 0
    const t = setInterval(() => {
      step++
      setValue(Math.round((target * step) / steps))
      if (step >= steps) clearInterval(t)
    }, interval)
    return () => clearInterval(t)
  }, [target])
  return value
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="relative h-[3px] w-full rounded-full bg-white/6 overflow-hidden">
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
      />
      {/* Shimmer */}
      <motion.div
        className="absolute inset-y-0 w-8 rounded-full"
        style={{ background: `linear-gradient(90deg, transparent, ${color}70, transparent)` }}
        initial={{ left: '-2rem' }}
        animate={{ left: `${score}%` }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
      />
    </div>
  )
}

function BreakdownBar({ value, maxAbs }: { value: number; maxAbs: number }) {
  const pct = Math.min(100, (Math.abs(value) / maxAbs) * 100)
  const color = value > 0 ? '#22c55e' : '#ef4444'
  return (
    <div className="relative h-1 flex-1 rounded-full bg-white/6 overflow-hidden">
      <motion.div
        className="absolute inset-y-0 rounded-full"
        style={{ backgroundColor: color, left: value > 0 ? 0 : 'auto', right: value < 0 ? 0 : 'auto' }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
      />
    </div>
  )
}

export function NeighborhoodCard({
  neighborhood, rank, selected, onSelect, onShowApartments,
}: NeighborhoodCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [hovered, setHovered] = useState(false)
  const lang = useLang()
  const cfg = scoreConfig(neighborhood.score)
  const isTop3 = rank <= 3
  const displayScore = useCountUp(neighborhood.score)

  const positives  = neighborhood.scoreBreakdown.filter(c => c.value > 0)
  const negatives  = neighborhood.scoreBreakdown.filter(c => c.value < 0)
  const topPositive = positives[0]
  const maxAbs = Math.max(...neighborhood.scoreBreakdown.map(c => Math.abs(c.value)), 1)
  const hasWorks = neighborhood.activeWorksCount > 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.05, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={onSelect}
      whileTap={{ scale: 0.995 }}
      className="relative cursor-pointer rounded-2xl overflow-hidden"
      style={{
        boxShadow: selected
          ? `0 0 0 1.5px ${cfg.color}80, 0 8px 32px ${cfg.glow}`
          : hovered
          ? `0 0 0 1px rgba(255,255,255,0.1), 0 4px 20px rgba(0,0,0,0.3)`
          : `0 0 0 1px rgba(255,255,255,0.06)`,
        transition: 'box-shadow 0.2s ease',
      }}
    >
      {/* Left accent bar — grows when selected */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl z-10"
        style={{ backgroundColor: cfg.color, transformOrigin: 'top' }}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: selected ? 1 : 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Top-tier gradient line */}
      {isTop3 && (
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: `linear-gradient(90deg, ${cfg.color}90, ${cfg.color}20)` }}
        />
      )}

      {/* Construction corner badge */}
      {hasWorks && (
        <div className="absolute top-0 right-0 w-0 h-0 z-10"
          style={{ borderLeft: '28px solid transparent', borderTop: '28px solid rgba(245,158,11,0.4)' }}
        >
          <Construction className="absolute -top-[22px] -left-[14px] w-2.5 h-2.5 text-amber-400" />
        </div>
      )}

      {/* Card body */}
      <motion.div
        className="p-4"
        animate={{
          backgroundColor: selected ? '#1a1f2b' : hovered ? '#141924' : '#111620',
        }}
        transition={{ duration: 0.18 }}
      >
        {/* Row 1: Rank + Name + Score */}
        <div className="flex items-center gap-3">
          <div className="shrink-0 w-8 text-center">
            <span
              className="text-[11px] font-black tracking-widest tabular-nums"
              style={{ color: selected ? cfg.color : 'rgba(255,255,255,0.18)' }}
            >
              {String(rank).padStart(2, '0')}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h3
              className="font-bold text-[15px] leading-tight truncate"
              style={{ color: selected || hovered ? '#fff' : 'rgba(255,255,255,0.85)' }}
            >
              {neighborhood.nameCroatian}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
              {hasWorks && (
                <span className="text-[10px] text-amber-400/70 flex items-center gap-0.5">
                  <Construction className="w-2.5 h-2.5" />
                  {neighborhood.activeWorksCount} rad{neighborhood.activeWorksCount > 1 ? 'ova' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Animated score */}
          <div className="shrink-0 text-right">
            <motion.span
              className="text-2xl font-black leading-none tabular-nums"
              style={{ color: cfg.color }}
              animate={{ scale: selected ? 1.08 : 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              {displayScore}
            </motion.span>
            <p className="text-[9px] text-white/20 text-right mt-0.5 leading-none">/ 100</p>
          </div>
        </div>

        {/* Score bar */}
        <div className="mt-3 px-11">
          <ScoreBar score={neighborhood.score} color={cfg.color} />
        </div>

        {/* Stat pills */}
        <div className="flex items-center gap-1.5 mt-3 px-11 flex-wrap">
          {neighborhood.nearestZetMeters < 2000 && (
            <Stat icon={Train}
              value={neighborhood.nearestZetMeters < 1000
                ? `${neighborhood.nearestZetMeters}m`
                : `${(neighborhood.nearestZetMeters / 1000).toFixed(1)}km`}
              label="ZET" color="rgba(96,165,250,0.85)"
            />
          )}
          {neighborhood.kindergartenSpotsCount > 0 && (
            <Stat icon={Baby} value={`${neighborhood.kindergartenSpotsCount}`} label="mjesta" color="rgba(244,114,182,0.85)" />
          )}
          <Stat
            icon={Wind}
            value={`AQI ${neighborhood.airQualityIndex}`}
            label=""
            color={neighborhood.airQualityIndex <= 2 ? 'rgba(34,197,94,0.75)' : 'rgba(251,146,60,0.75)'}
          />
          {neighborhood.commuteMinutes && (
            <Stat icon={MapPin} value={`${neighborhood.commuteMinutes} min`} label="do posla" color="rgba(167,139,250,0.85)" />
          )}
        </div>

        {/* Top reason */}
        {topPositive && (
          <div className="mt-2.5 px-11">
            <p className="text-[11px] text-white/35 leading-relaxed line-clamp-1">
              <span style={{ color: cfg.color }}>↑</span> {topPositive.reason}
            </p>
          </div>
        )}

        {/* Action row */}
        <div className="flex items-center gap-2 mt-3 px-11">
          <motion.button
            onClick={(e) => { e.stopPropagation(); onShowApartments?.() }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors"
            style={{
              background: selected ? `${cfg.color}18` : 'rgba(255,255,255,0.05)',
              color: selected ? cfg.color : 'rgba(255,255,255,0.45)',
              border: selected ? `1px solid ${cfg.color}35` : '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <Home className="w-3 h-3" />
            {lang === 'en' ? 'Apartments' : 'Stanovi'}
            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
          </motion.button>

          {neighborhood.scoreBreakdown.length > 0 && (
            <motion.button
              onClick={(e) => { e.stopPropagation(); setExpanded(v => !v) }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] text-white/30 hover:text-white/60 transition-colors border border-white/6 hover:border-white/12"
            >
              <motion.span
                animate={{ rotate: expanded ? 180 : 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="flex items-center"
              >
                <ChevronDown className="w-3 h-3" />
              </motion.span>
              Razlozi
            </motion.button>
          )}
        </div>

        {/* Expandable breakdown */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-white/6 px-11 space-y-2">
                {positives.length > 0 && (
                  <div className="space-y-1.5">
                    {positives.map((c, i) => (
                      <motion.div
                        key={`pos-${i}`}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.25 }}
                        className="flex items-center gap-2"
                      >
                        <span className="text-[10px] text-emerald-400 font-semibold tabular-nums w-8 text-right shrink-0">+{c.value}</span>
                        <BreakdownBar value={c.value} maxAbs={maxAbs} />
                        <span className="text-[10px] text-white/40 truncate min-w-0 flex-1">{c.labelHr}</span>
                      </motion.div>
                    ))}
                  </div>
                )}
                {negatives.length > 0 && (
                  <div className="space-y-1.5 mt-1">
                    {negatives.map((c, i) => (
                      <motion.div
                        key={`neg-${i}`}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: positives.length * 0.04 + i * 0.04, duration: 0.25 }}
                        className="flex items-center gap-2"
                      >
                        <span className="text-[10px] text-red-400 font-semibold tabular-nums w-8 text-right shrink-0">{c.value}</span>
                        <BreakdownBar value={c.value} maxAbs={maxAbs} />
                        <span className="text-[10px] text-white/35 truncate min-w-0 flex-1">{c.labelHr}</span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

function Stat({ icon: Icon, value, label, color }: {
  icon: React.ElementType; value: string; label: string; color: string
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.06 }}
      className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium cursor-default"
      style={{ background: `${color.replace('0.85', '0.09').replace('0.75', '0.08')}`, color }}
    >
      <Icon className="w-2.5 h-2.5 shrink-0" />
      <span>{value}</span>
      {label && <span className="opacity-55">{label}</span>}
    </motion.div>
  )
}
