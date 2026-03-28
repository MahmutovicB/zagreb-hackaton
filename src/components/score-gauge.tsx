'use client'

import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'

interface ScoreGaugeProps {
  score: number
  size?: number
  strokeWidth?: number
  showLabel?: boolean
}

function scoreColor(score: number): string {
  if (score >= 75) return '#22c55e'
  if (score >= 50) return '#eab308'
  if (score >= 25) return '#f97316'
  return '#ef4444'
}

export function ScoreGauge({ score, size = 80, strokeWidth = 8, showLabel = true }: ScoreGaugeProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const countRef = useRef<HTMLSpanElement>(null)
  const circleRef = useRef<SVGCircleElement>(null)
  const color = scoreColor(score)

  useEffect(() => {
    const count = { val: 0 }
    const controls = animate(count, { val: score }, {
      duration: 1.2,
      ease: 'easeOut',
      onUpdate(latest) {
        if (countRef.current) countRef.current.textContent = Math.round(latest.val).toString()
        if (circleRef.current) {
          const offset = circumference - (latest.val / 100) * circumference
          circleRef.current.style.strokeDashoffset = offset.toString()
        }
      }
    })
    return () => controls.stop()
  }, [score, circumference])

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />
        {/* Animated progress arc */}
        <circle
          ref={circleRef}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          style={{ transition: 'stroke 0.3s ease' }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span ref={countRef} className="text-xl font-bold leading-none" style={{ color }}>0</span>
          <span className="text-[10px] text-white/40 leading-none mt-0.5">/ 100</span>
        </div>
      )}
    </div>
  )
}
