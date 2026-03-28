'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mic, MicOff, ArrowRight, MapPin, Construction, Baby, Wind } from 'lucide-react'
import Image from 'next/image'
import { preloaderDone } from '@/lib/preloaderState'

const EXAMPLE_QUERIES = [
  'Obitelj s bebom, bez auta, trebamo vrtić, mama radi na Trgu',
  'Student, tiho, blizu Sveučilišta, biciklom na faks',
  'Par, ljubitelji prirode, zelenilo, Jarun, povoljno',
  'Umirovljenik, blizu ljekarne i liječnika, mirno',
]

type SpeechRecognitionInstance = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: { results: { [i: number]: { [j: number]: { transcript: string }; isFinal: boolean } } }) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance
    webkitSpeechRecognition: new () => SpeechRecognitionInstance
  }
}

// Framer Motion variant — animate value itself changes so re-trigger works
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function reveal(ready: boolean, delay = 0): any {
  return {
    initial: { opacity: 0, y: 18 },
    animate: ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
    transition: { duration: 0.65, delay: ready ? delay : 0, ease: [0.16, 1, 0.3, 1] },
  }
}

export default function LandingPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [listening, setListening] = useState(false)
  // true immediately if returning via soft nav
  const [ready, setReady] = useState(preloaderDone)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  useEffect(() => {
    if (preloaderDone) return
    const handler = () => setReady(true)
    window.addEventListener('preloader:done', handler)
    return () => window.removeEventListener('preloader:done', handler)
  }, [])

  function handleSubmit(q?: string) {
    const finalQuery = q ?? query
    if (!finalQuery.trim()) return
    router.push(`/results?q=${encodeURIComponent(finalQuery.trim())}`)
  }

  function toggleVoice() {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SR) return
    if (listening) { recognitionRef.current?.stop(); setListening(false); return }
    const r = new SR()
    recognitionRef.current = r
    r.lang = 'hr-HR'
    r.continuous = false
    r.interimResults = true
    r.onresult = (e) => {
      let t = ''
      for (let i = 0; i < 10; i++) { if (!e.results[i]) break; t += e.results[i][0].transcript }
      setQuery(t)
    }
    r.onerror = () => setListening(false)
    r.onend   = () => setListening(false)
    r.start()
    setListening(true)
  }

  return (
    <main className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center">

      {/* ── Zagreb photo — synced to preloader exit ── */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: ready ? 1 : 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <Image
          src="/preloader/zagreb-6.jpg"
          alt="Zagreb"
          fill
          unoptimized
          priority
          style={{ objectFit: 'cover', objectPosition: 'center' }}
        />
      </motion.div>

      {/* ── Layered overlay — subtle enough the photo breathes through ── */}
      {/* Bottom-to-top gradient so headline area is readable */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(to top, rgba(8,13,18,0.92) 0%, rgba(8,13,18,0.55) 50%, rgba(8,13,18,0.38) 100%)
          `,
        }}
      />

      {/* Soft center vignette around the content area */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 90% 70% at 50% 55%, rgba(8,13,18,0.3) 0%, transparent 70%)',
        }}
      />

      {/* Subtle grain — cinematic texture */}
      <div
        className="absolute inset-0 opacity-[0.028] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px',
        }}
      />

      {/* Faint grid */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: 'linear-gradient(rgba(212,118,74,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(212,118,74,0.6) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      {/* ── Content ── */}
      <div className="relative z-10 w-full max-w-2xl mx-auto px-6 flex flex-col items-center">

        {/* Badge */}
        <motion.div
          {...reveal(ready, 0.0)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#D4764A]/30 bg-[#D4764A]/8 mb-8"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-[#D4764A] animate-pulse" />
          <span className="text-xs text-[#D4764A] font-medium tracking-wide">
            Zagreb · Live podatci · AI pretraga
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          {...reveal(ready, 0.1)}
          className="text-center mb-3"
          style={{ fontFamily: 'var(--font-syne)' }}
        >
          <span className="block text-5xl md:text-6xl font-black text-white tracking-tight leading-none">
            Gdje živjeti
          </span>
          <span
            className="block text-5xl md:text-6xl font-black tracking-tight leading-none mt-1"
            style={{ color: '#D4764A', textShadow: '0 0 80px rgba(212,118,74,0.35)' }}
          >
            u Zagrebu?
          </span>
        </motion.h1>

        <motion.p
          {...reveal(ready, 0.18)}
          className="text-white/45 text-base text-center mb-10 max-w-md leading-relaxed"
        >
          Opišite što tražite — AI pronalazi pravi kvart s live komunalnim radovima, vrtićima i stanovima
        </motion.p>

        {/* Search box */}
        <motion.div {...reveal(ready, 0.26)} className="w-full">
          <div className={`
            relative flex items-end gap-3 p-4 rounded-2xl border transition-all duration-300
            ${query ? 'border-[#D4764A]/50 bg-[#1C2937]/70' : 'border-white/12 bg-white/5'}
            backdrop-blur-2xl shadow-[0_8px_40px_rgba(0,0,0,0.4)]
          `}>
            <textarea
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() } }}
              placeholder="Opišite gdje želite živjeti…"
              rows={2}
              className="flex-1 bg-transparent text-white placeholder-white/25 resize-none outline-none text-base leading-relaxed"
            />
            <div className="flex items-center gap-2 shrink-0 pb-0.5">
              <button
                onClick={toggleVoice}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                  listening
                    ? 'bg-red-500/20 border border-red-500/40 text-red-400 animate-pulse'
                    : 'bg-white/6 border border-white/10 text-white/40 hover:text-white/70'
                }`}
              >
                {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <button
                onClick={() => handleSubmit()}
                disabled={!query.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D4764A] text-white font-semibold text-sm disabled:opacity-30 hover:bg-[#e8855a] transition-colors"
              >
                Traži
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Example query chips */}
        <motion.div
          {...reveal(ready, 0.35)}
          className="w-full mt-4 flex flex-wrap gap-2 justify-center"
        >
          {EXAMPLE_QUERIES.map((ex, i) => (
            <button
              key={i}
              onClick={() => { setQuery(ex); handleSubmit(ex) }}
              className="text-xs px-3 py-1.5 rounded-full border border-white/10 bg-white/4 text-white/40 hover:text-white/70 hover:border-white/20 hover:bg-white/7 transition-all backdrop-blur-sm"
            >
              {ex.split(',')[0]}…
            </button>
          ))}
        </motion.div>

        {/* Stats bar */}
        <motion.div
          {...reveal(ready, 0.45)}
          className="mt-12 flex items-center gap-6 text-[11px] text-white/30"
        >
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-[#D4764A]/60" />
            <span>17 kvartova</span>
          </div>
          <div className="w-px h-3 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <Construction className="w-3 h-3 text-red-400/60" />
            <span>Live komunalni radar</span>
          </div>
          <div className="w-px h-3 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <Baby className="w-3 h-3 text-pink-400/60" />
            <span>Slobodna mjesta u vrtićima</span>
          </div>
          <div className="w-px h-3 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <Wind className="w-3 h-3 text-cyan-400/60" />
            <span>Kvaliteta zraka</span>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
