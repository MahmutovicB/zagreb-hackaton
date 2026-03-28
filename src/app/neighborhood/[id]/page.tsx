'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Construction, Baby, Train, Wind, Bike, ExternalLink } from 'lucide-react'
import { ZagrebMap } from '@/components/map/ZagrebMap'
import { ScoreGauge } from '@/components/score-gauge'
import type { KomunalniWork, Kindergarten, AirQualityStation } from '@/types'
import neighborhoodsData from '@/data/neighborhoods.json'
import type { NeighborhoodMeta } from '@/types'

function MetricCard({ icon: Icon, label, value, sub, color = 'text-white' }: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  color?: string
}) {
  return (
    <div className="bg-white/4 border border-white/8 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-white/40 uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${color} leading-none`}>{value}</p>
      {sub && <p className="text-xs text-white/40 mt-1">{sub}</p>}
    </div>
  )
}

export default function NeighborhoodDetail() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const neighborhood = (neighborhoodsData as NeighborhoodMeta[]).find(n => n.id === id)

  const [radarWorks, setRadarWorks] = useState<KomunalniWork[]>([])
  const [kindergartens, setKindergartens] = useState<Kindergarten[]>([])
  const [airQuality, setAirQuality] = useState<AirQualityStation[]>([])

  useEffect(() => {
    fetch('/api/radar').then(r => r.json()).then(d => {
      const works = (d.works ?? []) as KomunalniWork[]
      if (!neighborhood) return
      const local = works.filter(w => {
        if (w.district?.toLowerCase().includes(neighborhood.name.toLowerCase().split(' ')[0].toLowerCase())) return true
        return false
      })
      setRadarWorks(local)
    })
    fetch('/api/kindergartens').then(r => r.json()).then(d => setKindergartens(d.kindergartens ?? []))
    fetch('/api/airquality').then(r => r.json()).then(d => setAirQuality(d.stations ?? []))
  }, [neighborhood])

  if (!neighborhood) {
    return (
      <div className="min-h-screen bg-[#080D12] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-white/40">Kvart nije pronađen</p>
          <button onClick={() => router.push('/')} className="text-[#D4764A] text-sm">← Povratak</button>
        </div>
      </div>
    )
  }

  const nearbyKindergartens = kindergartens.slice(0, 5)
  const nearestAQ = airQuality[0]
  const activeWorks = radarWorks.filter(w => w.status === 'u_tijeku')

  // Build a mock score for display
  const mockScore = Math.round(50 + neighborhood.greenScore * 2 + neighborhood.transitScore * 1.5 - activeWorks.length * 5)
  const clampedScore = Math.max(10, Math.min(95, mockScore))

  const njuskalSlug = neighborhood.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[čć]/g, 'c')
    .replace(/[šđž]/g, (s: string) => ({ š: 's', đ: 'd', ž: 'z' } as Record<string, string>)[s] ?? s)
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')

  return (
    <div className="min-h-screen bg-[#080D12]">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b border-white/6 bg-[#0A0F16]/90 backdrop-blur-xl">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-xl bg-white/6 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-base font-semibold text-white">{neighborhood.nameCroatian}</h1>
        {activeWorks.length > 0 && (
          <div className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/25 rounded-lg px-2 py-1 ml-auto">
            <Construction className="w-3 h-3 text-amber-400" />
            <span className="text-xs text-amber-400">{activeWorks.length} aktivnih radova</span>
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Score hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-6 p-6 rounded-2xl bg-white/4 border border-white/8"
        >
          <ScoreGauge score={clampedScore} size={100} strokeWidth={10} />
          <div>
            <h2 className="text-2xl font-bold text-white">{neighborhood.nameCroatian}</h2>
            <p className="text-sm text-white/50 mt-1 max-w-sm leading-relaxed">{neighborhood.description}</p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {neighborhood.highlights.map((h, i) => (
                <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-white/6 border border-white/10 text-white/60">{h}</span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <MetricCard
            icon={Train}
            label="Javni prijevoz"
            value={`${neighborhood.transitScore}/10`}
            sub="ZET tram/bus mreža"
            color="text-blue-400"
          />
          <MetricCard
            icon={Wind}
            label="Mir i tišina"
            value={`${neighborhood.quietScore}/10`}
            sub={activeWorks.length > 0 ? `${activeWorks.length} aktivnih radova` : 'Bez aktivnih radova'}
            color="text-cyan-400"
          />
          <MetricCard
            icon={Baby}
            label="Vrtići"
            value={nearbyKindergartens.filter(k => k.freeSpots > 0).length.toString()}
            sub={`s ${nearbyKindergartens.reduce((s, k) => s + k.freeSpots, 0)} slobodnih mjesta`}
            color="text-pink-400"
          />
          <MetricCard
            icon={Wind}
            label="Kvaliteta zraka"
            value={nearestAQ ? `AQI ${nearestAQ.aqi}` : 'N/A'}
            sub="Indeks 1-5 (niže = bolje)"
            color={nearestAQ?.aqi <= 2 ? 'text-emerald-400' : 'text-amber-400'}
          />
          <MetricCard
            icon={Bike}
            label="Biciklizam"
            value={`${(neighborhood.greenScore * 0.4).toFixed(1)} km`}
            sub="procijenjene staze"
            color="text-green-400"
          />
          <MetricCard
            icon={Construction}
            label="Zelenilo"
            value={`${neighborhood.greenScore}/10`}
            sub="parkovi i zelene površine"
            color="text-emerald-400"
          />
        </div>

        {/* Map */}
        <div className="h-64 md:h-96">
          <ZagrebMap
            radarWorks={radarWorks}
            kindergartens={kindergartens}
            showRadar={true}
            showKindergartens={true}
            zoom={14}
            focusNeighborhoodId={id}
          />
        </div>

        {/* Komunalni radovi */}
        {radarWorks.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Construction className="w-4 h-4 text-amber-400" />
              Komunalni radovi
            </h3>
            <div className="space-y-2">
              {radarWorks.map((w, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/3 border border-white/6">
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{ backgroundColor: w.status === 'u_tijeku' ? '#ef4444' : '#f59e0b' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{w.title}</p>
                    <p className="text-xs text-white/40 mt-0.5">{w.address}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[11px] text-white/30">{w.holdingCompany}</span>
                      <span className="text-[11px] text-white/30">Završetak: {new Date(w.endDate).toLocaleDateString('hr-HR')}</span>
                    </div>
                  </div>
                  <span className={`text-[11px] shrink-0 px-2 py-0.5 rounded-full ${
                    w.status === 'u_tijeku' ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'
                  }`}>
                    {w.status === 'u_tijeku' ? 'U tijeku' : 'Planirano'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Kindergartens */}
        {nearbyKindergartens.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Baby className="w-4 h-4 text-pink-400" />
              Vrtići u blizini
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {nearbyKindergartens.map((k, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/6">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${k.freeSpots > 0 ? 'bg-pink-400' : 'bg-white/20'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{k.name}</p>
                    <p className="text-xs text-white/40 truncate">{k.address}</p>
                  </div>
                  <span className={`text-xs font-medium shrink-0 ${k.freeSpots > 0 ? 'text-pink-400' : 'text-white/30'}`}>
                    {k.freeSpots > 0 ? `${k.freeSpots} mjesta` : 'Popunjeno'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Apartments CTA */}
        <a
          href={`https://www.njuskalo.hr/iznajmljivanje-stanova/zagreb-${njuskalSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between w-full p-5 rounded-2xl bg-[#D4764A]/12 border border-[#D4764A]/25 hover:bg-[#D4764A]/18 transition-colors group"
        >
          <div>
            <p className="font-semibold text-[#D4764A]">Pregledajte stanove na Njuškalu</p>
            <p className="text-sm text-white/40 mt-0.5">Oglasi za najam u {neighborhood.nameCroatian}</p>
          </div>
          <ExternalLink className="w-5 h-5 text-[#D4764A] group-hover:translate-x-1 transition-transform" />
        </a>
      </div>
    </div>
  )
}
