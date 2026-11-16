import { useRef } from 'react'
import { useInView, useMediaQuery, usePassProgress, useReducedMotion } from './motion'

// SARS 2025/26 individual brackets. The sample's taxable income (R450,000)
// lands in the 31% band, which is highlighted.
const BRACKETS = [
  { rate: 18, from: 'R0' },
  { rate: 26, from: 'R237,101' },
  { rate: 31, from: 'R370,501', sample: true },
  { rate: 36, from: 'R512,801' },
  { rate: 39, from: 'R673,001' },
  { rate: 41, from: 'R857,901' },
  { rate: 45, from: 'R1,817,001' },
]

const BLUE = { front: '#3b82f6', side: '#1e40af', top: '#93c5fd' }
const AMBER = { front: '#f59e0b', side: '#b45309', top: '#fde68a' }

function Box({ w, d, h, colors, grown, delay, reduced, label }) {
  const face = { position: 'absolute' }
  return (
    <div
      className="preserve-3d relative"
      style={{
        width: w,
        height: h,
        transformOrigin: '50% 100%',
        transform: `scaleY(${grown ? 1 : 0.02})`,
        transition: reduced ? 'none' : `transform 1s cubic-bezier(0.2, 0.9, 0.25, 1.15) ${delay}ms`,
      }}
    >
      <div
        className="flex justify-center pt-2 font-heading font-bold text-white text-[10px] sm:text-sm"
        style={{ ...face, inset: 0, background: colors.front, transform: `translateZ(${d / 2}px)` }}
      >
        {label}
      </div>
      <div style={{ ...face, inset: 0, background: colors.side, transform: `rotateY(180deg) translateZ(${d / 2}px)` }} />
      <div style={{ ...face, top: 0, left: (w - d) / 2, width: d, height: h, background: colors.side, transform: `rotateY(90deg) translateZ(${w / 2}px)` }} />
      <div style={{ ...face, top: 0, left: (w - d) / 2, width: d, height: h, background: colors.side, transform: `rotateY(-90deg) translateZ(${w / 2}px)` }} />
      <div style={{ ...face, left: 0, top: (h - d) / 2, width: w, height: d, background: colors.top, transform: `rotateX(90deg) translateZ(${h / 2}px)` }} />
    </div>
  )
}

export default function BracketBars3D() {
  const reduced = useReducedMotion()
  const wide = useMediaQuery('(min-width: 640px)')
  const ref = useRef(null)
  const inView = useInView(ref, 0.3)
  const p = usePassProgress(ref)
  const grown = reduced || inView

  const w = wide ? 40 : 26
  const gap = wide ? 22 : 12
  const unit = wide ? 5.2 : 3.6
  const turn = reduced ? -24 : -34 + p * 22

  return (
    <div ref={ref}>
      <div className="stage-3d flex justify-center items-end h-[230px] sm:h-[300px]" style={{ perspective: 1200 }} role="img" aria-label="3D bar chart of the seven SARS income tax rates, from 18% up to 45%">
        <div
          className="preserve-3d flex items-end"
          style={{ gap, transform: `translateY(-24px) rotateX(-12deg) rotateY(${turn}deg)` }}
        >
          {BRACKETS.map((b, i) => (
            <Box
              key={b.rate}
              w={w}
              d={w}
              h={b.rate * unit}
              colors={b.sample ? AMBER : BLUE}
              grown={grown}
              delay={i * 90}
              reduced={reduced}
              label={`${b.rate}%`}
            />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mt-10 text-center">
        {BRACKETS.map((b) => (
          <div key={b.rate}>
            <p className={`font-heading font-bold text-base sm:text-xl ${b.sample ? 'text-amber-500' : 'text-gray-900 dark:text-gray-100'}`}>{b.rate}%</p>
            <p className="text-[9px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">from {b.from}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-center text-gray-500 dark:text-gray-400">
        <span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-500 mr-1.5 align-middle" />
        The sample&apos;s R450,000 taxable income tops out in the 31% band.
      </p>
    </div>
  )
}
