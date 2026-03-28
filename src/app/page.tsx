'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mic, MicOff, ArrowRight, MapPin, Construction, Baby, Wind } from 'lucide-react'
import Image from 'next/image'
import { preloaderDone } from '@/lib/preloaderState'

const TRANSLATIONS = {
  hr: {
    badge: 'Zagreb · Live podatci · AI pretraga',
    headline1: 'Gdje živjeti',
    headline2: 'u Zagrebu?',
    subtitle: 'Opišite što tražite — AI pronalazi pravi kvart s live komunalnim radovima, vrtićima i stanovima',
    placeholder: 'Opišite gdje želite živjeti…',
    searchBtn: 'Traži',
    stat1: '17 kvartova',
    stat2: 'Live komunalni radar',
    stat3: 'Slobodna mjesta u vrtićima',
    stat4: 'Kvaliteta zraka',
    queries: [
      'Obitelj s bebom, bez auta, trebamo vrtić, mama radi na Trgu',
      'Student, tiho, blizu Sveučilišta, biciklom na faks',
      'Par, ljubitelji prirode, zelenilo, Jarun, povoljno',
      'Umirovljenik, blizu ljekarne i liječnika, mirno',
    ],
    voiceLang: 'hr-HR',
  },
  en: {
    badge: 'Zagreb · Live data · AI search',
    headline1: 'Where to live',
    headline2: 'in Zagreb?',
    subtitle: 'Describe what you\'re looking for — AI finds the right neighborhood with live utility works, kindergartens and apartments',
    placeholder: 'Describe where you want to live…',
    searchBtn: 'Search',
    stat1: '17 neighborhoods',
    stat2: 'Live utility radar',
    stat3: 'Free kindergarten spots',
    stat4: 'Air quality',
    queries: [
      'Family with a baby, no car, need kindergarten, near city center',
      'Student, quiet, near the University, cycling to class',
      'Couple, nature lovers, green spaces, Jarun lake, affordable',
      'Retiree, near pharmacy and doctor, peaceful neighborhood',
    ],
    voiceLang: 'en-US',
  },
}

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
  const [ready, setReady] = useState(preloaderDone)
  const [lang, setLang] = useState<'hr' | 'en'>('hr')
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  const t = TRANSLATIONS[lang]

  useEffect(() => {
    if (preloaderDone) return
    const handler = () => setReady(true)
    window.addEventListener('preloader:done', handler)
    return () => window.removeEventListener('preloader:done', handler)
  }, [])

  function handleSubmit(q?: string) {
    const finalQuery = q ?? query
    if (!finalQuery.trim()) return
    router.push(`/results?q=${encodeURIComponent(finalQuery.trim())}&lang=${lang}`)
  }

  function toggleVoice() {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SR) return
    if (listening) { recognitionRef.current?.stop(); setListening(false); return }
    const r = new SR()
    recognitionRef.current = r
    r.lang = t.voiceLang
    r.continuous = false
    r.interimResults = true
    r.onresult = (e) => {
      let text = ''
      for (let i = 0; i < 10; i++) { if (!e.results[i]) break; text += e.results[i][0].transcript }
      setQuery(text)
    }
    r.onerror = () => setListening(false)
    r.onend   = () => setListening(false)
    r.start()
    setListening(true)
  }

  function toggleLang() {
    setLang(prev => prev === 'hr' ? 'en' : 'hr')
    setQuery('')
  }

  return (
    <main className="min-h-screen relative overflow-x-hidden flex flex-col items-center justify-center">

      {/* ── Language toggle ── */}
      <div className="absolute top-4 right-4 z-20">
        <motion.button
          onClick={toggleLang}
          initial={{ opacity: 0 }}
          animate={{ opacity: ready ? 1 : 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-white/15 bg-white/6 backdrop-blur-xl hover:bg-white/12 hover:border-white/25 transition-all"
        >
          <span className={`text-xs font-semibold transition-colors ${lang === 'hr' ? 'text-white' : 'text-white/35'}`}>HR</span>
          <span className="text-white/20 text-xs mx-0.5">/</span>
          <span className={`text-xs font-semibold transition-colors ${lang === 'en' ? 'text-white' : 'text-white/35'}`}>EN</span>
        </motion.button>
      </div>

      {/* ── Zagreb photo ── */}
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

      {/* ── Overlays ── */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to top, rgba(8,13,18,0.92) 0%, rgba(8,13,18,0.55) 50%, rgba(8,13,18,0.38) 100%)`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 90% 70% at 50% 55%, rgba(8,13,18,0.3) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.028] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px',
        }}
      />
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
            {t.badge}
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          {...reveal(ready, 0.1)}
          className="text-center mb-3"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <span
            className="block text-[2.6rem] md:text-[3.4rem] font-black text-white leading-[1.05]"
            style={{ letterSpacing: '-0.02em', fontVariationSettings: '"SOFT" 50, "WONK" 0' }}
          >
            {t.headline1}
          </span>
          <span
            className="block text-[2.6rem] md:text-[3.4rem] font-black leading-[1.05]"
            style={{
              color: '#D4764A',
              letterSpacing: '-0.02em',
              textShadow: '0 0 60px rgba(212,118,74,0.45)',
              fontVariationSettings: '"SOFT" 80, "WONK" 1',
              fontStyle: 'italic',
            }}
          >
            {t.headline2}
          </span>
        </motion.h1>

        <motion.p
          {...reveal(ready, 0.18)}
          className="text-white/45 text-base text-center mb-10 max-w-md leading-relaxed"
        >
          {t.subtitle}
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
              placeholder={t.placeholder}
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
                {t.searchBtn}
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
          {t.queries.map((ex, i) => (
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
            <span>{t.stat1}</span>
          </div>
          <div className="w-px h-3 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <Construction className="w-3 h-3 text-red-400/60" />
            <span>{t.stat2}</span>
          </div>
          <div className="w-px h-3 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <Baby className="w-3 h-3 text-pink-400/60" />
            <span>{t.stat3}</span>
          </div>
          <div className="w-px h-3 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <Wind className="w-3 h-3 text-cyan-400/60" />
            <span>{t.stat4}</span>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
