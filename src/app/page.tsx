'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, ArrowRight, MapPin, Construction, Baby, Wind } from 'lucide-react'

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

export default function LandingPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  function handleSubmit(q?: string) {
    const finalQuery = q ?? query
    if (!finalQuery.trim()) return
    router.push(`/results?q=${encodeURIComponent(finalQuery.trim())}`)
  }

  function toggleVoice() {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SR) return

    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }

    const recognition = new SR()
    recognitionRef.current = recognition
    recognition.lang = 'hr-HR'
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onresult = (e) => {
      let transcript = ''
      for (let i = 0; i < 10; i++) {
        if (!e.results[i]) break
        transcript += e.results[i][0].transcript
      }
      setQuery(transcript)
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)
    recognition.start()
    setListening(true)
  }

  return (
    <main className="min-h-screen bg-[#080D12] relative overflow-hidden flex flex-col items-center justify-center">
      {/* Atmospheric background */}
      <div className="absolute inset-0">
        {/* City map silhouette gradient */}
        <div className="absolute inset-0 bg-gradient-radial from-[#1a2d42]/60 via-[#0a1520]/80 to-[#080D12] opacity-100" />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(212,118,74,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(212,118,74,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        {/* Radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full bg-[#D4764A]/6 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[300px] rounded-full bg-[#1a3a5c]/30 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-2xl mx-auto px-6 flex flex-col items-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#D4764A]/30 bg-[#D4764A]/8 mb-8"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-[#D4764A] animate-pulse" />
          <span className="text-xs text-[#D4764A] font-medium tracking-wide">Zagreb · Live podatci · AI pretraga</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-center mb-3"
          style={{ fontFamily: 'var(--font-syne)' }}
        >
          <span className="block text-5xl md:text-6xl font-black text-white tracking-tight leading-none">
            Gdje živjeti
          </span>
          <span className="block text-5xl md:text-6xl font-black tracking-tight leading-none mt-1"
            style={{ color: '#D4764A', textShadow: '0 0 60px rgba(212,118,74,0.3)' }}>
            u Zagrebu?
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-white/40 text-base text-center mb-10 max-w-md leading-relaxed"
        >
          Opišite što tražite — AI pronalazi pravi kvart s live komunalnim radovima, vrtićima i stanovima
        </motion.p>

        {/* Search input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full"
        >
          <div className={`
            relative flex items-end gap-3 p-4 rounded-2xl border transition-all duration-300
            ${query ? 'border-[#D4764A]/50 bg-[#1C2937]/80' : 'border-white/10 bg-white/4'}
            backdrop-blur-xl shadow-2xl
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

        {/* Example queries */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="w-full mt-4 flex flex-wrap gap-2 justify-center"
        >
          {EXAMPLE_QUERIES.map((ex, i) => (
            <button
              key={i}
              onClick={() => { setQuery(ex); handleSubmit(ex) }}
              className="text-xs px-3 py-1.5 rounded-full border border-white/10 bg-white/3 text-white/40 hover:text-white/70 hover:border-white/20 hover:bg-white/6 transition-all"
            >
              {ex.split(',')[0]}…
            </button>
          ))}
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
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
