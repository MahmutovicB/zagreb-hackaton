'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { preloaderDone, markPreloaderDone } from '@/lib/preloaderState'

const IMAGES = [
  '/preloader/zagreb-1.jpg',
  '/preloader/zagreb-2.jpg',
  '/preloader/zagreb-3.jpg',
  '/preloader/zagreb-4.jpg',
  '/preloader/zagreb-5.jpg',
  '/preloader/zagreb-6.jpg',
]

const SLIDE_DURATION  = 0.28   // seconds per image
const FADE_DURATION   = 0.18   // cross-dissolve between images
// Last image appears at (N-1) * SLIDE_DURATION, unblurs over this long:
const UNBLUR_DURATION = 0.8    // seconds
// After reel ends, text fades; fire done early so page can start animating in
const REEL_END        = IMAGES.length * SLIDE_DURATION + 0.15
// Preloader overlay fully gone this many seconds after reel ends
const EXIT_DURATION   = 0.55

type Phase = 'reel' | 'exit' | 'done'

export default function Preloader({ onDone }: { onDone?: () => void }) {
  const [phase, setPhase]           = useState<Phase>('reel')
  const [activeIndex, setActiveIndex] = useState(0)
  const [lastBlur, setLastBlur]     = useState(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    if (preloaderDone) { setPhase('done'); return }

    // Cycle images
    IMAGES.forEach((_, i) => {
      timers.current.push(
        setTimeout(() => setActiveIndex(i), i * SLIDE_DURATION * 1000)
      )
    })

    // Enter exit phase → fire done so page begins animating in
    timers.current.push(
      setTimeout(() => {
        setPhase('exit')
        markPreloaderDone()
        window.dispatchEvent(new CustomEvent('preloader:done'))
        onDone?.()
      }, REEL_END * 1000)
    )

    // Remove preloader from DOM
    timers.current.push(
      setTimeout(() => setPhase('done'), (REEL_END + EXIT_DURATION) * 1000)
    )

    return () => timers.current.forEach(clearTimeout)
  }, [onDone])

  if (phase === 'done') return null

  const isExit = phase === 'exit'

  return (
    <div
      className="fixed inset-0 z-[99999] bg-black select-none pointer-events-none overflow-hidden"
      style={{
        opacity: isExit ? 0 : 1,
        transition: isExit ? `opacity ${EXIT_DURATION}s ease-in-out` : undefined,
      }}
      aria-hidden="true"
    >
      {/* ── Image reel ── */}
      {IMAGES.map((src, i) => {
        const isLast = i === IMAGES.length - 1
        return (
          <AnimatePresence key={src} initial={false}>
            {activeIndex === i && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: FADE_DURATION, ease: 'easeInOut' }}
                className="absolute inset-0"
                style={isLast ? {
                  filter: `blur(${lastBlur}px)`,
                  transition: `filter ${UNBLUR_DURATION}s ease-out`,
                  willChange: 'filter',
                } : undefined}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  unoptimized
                  style={{ objectFit: 'cover', objectPosition: 'center' }}
                  priority={i === 0}
                  sizes="100vw"
                />
              </motion.div>
            )}
          </AnimatePresence>
        )
      })}

      {/* ── Center scrim — keeps image dark behind the text ── */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at center, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.1) 70%, transparent 100%)',
          opacity: isExit ? 0 : 1,
          transition: isExit ? `opacity ${EXIT_DURATION * 0.6}s ease-in` : undefined,
        }}
      />

      {/* ── Logo — difference blend inverts image colors ── */}
      <div
        className="absolute inset-0 z-[2] flex items-center justify-center"
        style={{
          mixBlendMode: 'difference',
          opacity: isExit ? 0 : 1,
          transition: isExit ? `opacity ${EXIT_DURATION * 0.5}s ease-in` : undefined,
        }}
      >
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
          className="font-[var(--font-syne)] font-black text-white leading-none whitespace-nowrap"
          style={{ fontSize: 'clamp(3rem, 11vw, 10rem)', letterSpacing: '-0.03em' }}
        >
          Gdje Živjeti
        </motion.span>
      </div>

      {/* ── Corner labels ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isExit ? 0 : 1 }}
        transition={{ delay: isExit ? 0 : 0.2, duration: 0.2 }}
        className="absolute bottom-8 right-8 z-[2] font-[var(--font-dm)]"
        style={{ mixBlendMode: 'difference' }}
      >
        <span className="text-white/50 tabular-nums" style={{ fontSize: 10, letterSpacing: '0.2em' }}>
          {String(activeIndex + 1).padStart(2, '0')} / {String(IMAGES.length).padStart(2, '0')}
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isExit ? 0 : 1 }}
        transition={{ delay: isExit ? 0 : 0.2, duration: 0.2 }}
        className="absolute bottom-8 left-8 z-[2]"
        style={{ mixBlendMode: 'difference' }}
      >
        <span className="font-[var(--font-dm)] text-white/50 uppercase tracking-[0.25em]" style={{ fontSize: 10 }}>
          Zagreb, Hrvatska
        </span>
      </motion.div>

      {/* ── Progress bar ── */}
      <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-white/10 z-[3]">
        <motion.div
          className="h-full bg-white/60"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: REEL_END - 0.05, ease: 'linear' }}
        />
      </div>
    </div>
  )
}
