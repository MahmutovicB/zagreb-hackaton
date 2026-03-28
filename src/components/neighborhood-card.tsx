'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { NeighborhoodScore } from '@/types'
import {
  Construction, Train, Baby, Wind, MapPin,
  Home, ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react'

interface NeighborhoodCardProps {
  neighborhood: NeighborhoodScore
  rank: number
  selected?: boolean
  onSelect?: () => void
  onShowApartments?: () => void
}

function scoreConfig(score: number) {
  if (score >= 80) return { label: 'Odlično', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.25)' }
  if (score >= 65) return { label: 'Vrlo dobro', color: '#84cc16', bg: 'rgba(132,204,22,0.1)', border: 'rgba(132,204,22,0.25)' }
  if (score >= 50) return { label: 'Dobro', color: '#eab308', bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.25)' }
  if (score >= 35) return { label: 'Osrednje', color: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.25)' }
  return { label: 'Slabo', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)' }
}

function ScoreBar({ score }: { score: number }) {
  const { color } = scoreConfig(score)
  return (
    <div className="relative h-1 w-full rounded-full bg-white/8 overflow-hidden">
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
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
        style={{
          backgroundColor: color,
          left: value > 0 ? 0 : 'auto',
          right: value < 0 ? 0 : 'auto',
        }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  )
}

export function NeighborhoodCard({
  neighborhood,
  rank,
  selected,
  onSelect,
  onShowApartments,
}: NeighborhoodCardProps) {
  const [expanded, setExpanded] = useState(false)
  const cfg = scoreConfig(neighborhood.score)
  const isTop3 = rank <= 3

  const positives = neighborhood.scoreBreakdown.filter(c => c.value > 0)
  const negatives = neighborhood.scoreBreakdown.filter(c => c.value < 0)
  const topPositive = positives[0]
  const maxAbs = Math.max(...neighborhood.scoreBreakdown.map(c => Math.abs(c.value)), 1)

  const hasWorks = neighborhood.activeWorksCount > 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.055, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      onClick={onSelect}
      className={`
        group relative cursor-pointer rounded-2xl overflow-hidden transition-all duration-200
        ${selected
          ? 'shadow-[0_0_0_1.5px_rgba(212,118,74,0.7),0_8px_32px_rgba(212,118,74,0.12)]'
          : 'shadow-[0_0_0_1px_rgba(255,255,255,0.06)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.12)]'
        }
      `}
    >
      {/* Top-tier accent line */}
      {isTop3 && (
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: `linear-gradient(90deg, ${cfg.color}90, ${cfg.color}20)` }}
        />
      )}

      {/* Active works warning stripe */}
      {hasWorks && (
        <div className="absolute top-0 right-0 w-0 h-0"
          style={{
            borderLeft: '28px solid transparent',
            borderTop: '28px solid rgba(245,158,11,0.35)',
          }}
        >
          <Construction className="absolute -top-[22px] -left-[14px] w-2.5 h-2.5 text-amber-400" />
        </div>
      )}

      <div className={`
        p-4 transition-colors duration-200
        ${selected ? 'bg-[#1a1f2b]' : 'bg-[#111620] group-hover:bg-[#141924]'}
      `}>
        {/* Row 1: Rank + Name + Score */}
        <div className="flex items-center gap-3">
          {/* Large rank */}
          <div className="shrink-0 w-8 text-center">
            <span
              className="text-[11px] font-black tracking-widest"
              style={{ color: selected ? cfg.color : 'rgba(255,255,255,0.2)', fontVariantNumeric: 'tabular-nums' }}
            >
              {String(rank).padStart(2, '0')}
            </span>
          </div>

          {/* Name block */}
          <div className="flex-1 min-w-0">
            <h3
              className="font-bold text-[15px] leading-tight truncate transition-colors"
              style={{ color: selected ? '#fff' : 'rgba(255,255,255,0.85)' }}
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

          {/* Score number */}
          <div className="shrink-0 text-right">
            <motion.span
              className="text-2xl font-black leading-none tabular-nums"
              style={{ color: cfg.color }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: rank * 0.055 + 0.3 }}
            >
              {neighborhood.score}
            </motion.span>
            <p className="text-[9px] text-white/25 text-right mt-0.5 leading-none">/ 100</p>
          </div>
        </div>

        {/* Score bar */}
        <div className="mt-3 px-11">
          <ScoreBar score={neighborhood.score} />
        </div>

        {/* Row 2: Stats pills */}
        <div className="flex items-center gap-1.5 mt-3 px-11 flex-wrap">
          {neighborhood.nearestZetMeters < 2000 && (
            <Stat icon={Train} value={
              neighborhood.nearestZetMeters < 1000
                ? `${neighborhood.nearestZetMeters}m`
                : `${(neighborhood.nearestZetMeters / 1000).toFixed(1)}km`
            } label="ZET" color="rgba(96,165,250,0.8)" />
          )}
          {neighborhood.kindergartenSpotsCount > 0 && (
            <Stat icon={Baby} value={`${neighborhood.kindergartenSpotsCount}`} label="mjesta" color="rgba(244,114,182,0.8)" />
          )}
          <Stat
            icon={Wind}
            value={`AQI ${neighborhood.airQualityIndex}`}
            label=""
            color={neighborhood.airQualityIndex <= 2 ? 'rgba(34,197,94,0.7)' : 'rgba(251,146,60,0.7)'}
          />
          {neighborhood.commuteMinutes && (
            <Stat icon={MapPin} value={`${neighborhood.commuteMinutes} min`} label="do posla" color="rgba(167,139,250,0.8)" />
          )}
        </div>

        {/* Top matching reason — single line, most impactful */}
        {topPositive && (
          <div className="mt-2.5 px-11">
            <p className="text-[11px] text-white/35 leading-relaxed line-clamp-1">
              <span style={{ color: cfg.color }}>↑</span> {topPositive.reason}
            </p>
          </div>
        )}

        {/* Action row */}
        <div className="flex items-center gap-2 mt-3 px-11">
          <button
            onClick={(e) => { e.stopPropagation(); onShowApartments?.() }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
            style={{
              background: selected ? `${cfg.color}18` : 'rgba(255,255,255,0.05)',
              color: selected ? cfg.color : 'rgba(255,255,255,0.45)',
              border: selected ? `1px solid ${cfg.color}35` : '1px solid rgba(255,255,255,0.08)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.color = cfg.color
              ;(e.currentTarget as HTMLButtonElement).style.background = `${cfg.color}18`
            }}
            onMouseLeave={e => {
              if (!selected) {
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.45)'
                ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'
              }
            }}
          >
            <Home className="w-3 h-3" />
            Stanovi
            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
          </button>

          {neighborhood.scoreBreakdown.length > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(v => !v) }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] text-white/30 hover:text-white/60 transition-colors border border-white/6 hover:border-white/12"
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              Razlozi
            </button>
          )}
        </div>

        {/* Expandable breakdown */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-white/6 px-11 space-y-2">
                {positives.length > 0 && (
                  <div className="space-y-1.5">
                    {positives.map((c, i) => (
                      <div key={`pos-${i}`} className="flex items-center gap-2">
                        <span className="text-[10px] text-emerald-400 font-semibold tabular-nums w-8 text-right shrink-0">+{c.value}</span>
                        <BreakdownBar value={c.value} maxAbs={maxAbs} />
                        <span className="text-[10px] text-white/40 truncate min-w-0 flex-1">{c.labelHr}</span>
                      </div>
                    ))}
                  </div>
                )}
                {negatives.length > 0 && (
                  <div className="space-y-1.5 mt-1">
                    {negatives.map((c, i) => (
                      <div key={`neg-${i}`} className="flex items-center gap-2">
                        <span className="text-[10px] text-red-400 font-semibold tabular-nums w-8 text-right shrink-0">{c.value}</span>
                        <BreakdownBar value={c.value} maxAbs={maxAbs} />
                        <span className="text-[10px] text-white/35 truncate min-w-0 flex-1">{c.labelHr}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

function Stat({ icon: Icon, value, label, color }: {
  icon: React.ElementType
  value: string
  label: string
  color: string
}) {
  return (
    <div
      className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium"
      style={{ background: `${color.replace('0.8', '0.08').replace('0.7', '0.07')}`, color }}
    >
      <Icon className="w-2.5 h-2.5 shrink-0" />
      <span>{value}</span>
      {label && <span className="opacity-60">{label}</span>}
    </div>
  )
}
