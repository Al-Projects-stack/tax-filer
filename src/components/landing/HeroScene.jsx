import { useEffect, useRef, useState } from 'react'
import { useCountUp, useMediaQuery, useReducedMotion } from './motion'

// The bundled sample IRP5 (public/sample-irp5.pdf) and the return it produces.
const DOC_LINES = [
  { label: 'Gross Income (3601)', value: 'R 486,000.00' },
  { label: 'Pension Fund (4001)', value: 'R 36,000.00' },
  { label: 'Medical Scheme (4116)', value: 'R 30,240.00' },
  { label: 'Scheme members', value: '3' },
  { label: 'PAYE Deducted (4102)', value: 'R 98,412.00' },
]

const LEDGER = [
  ['Gross income', '486,000.00'],
  ['Less pension', '−36,000.00'],
  ['Taxable income', '450,000.00', true],
  ['Tax on brackets', '102,006.43'],
  ['Primary rebate', '−17,235.00'],
  ['Medical credit', '−11,688.00'],
  ['Tax for the year', '73,083.43', true],
  ['PAYE already paid', '−98,412.00'],
]

const REFUND = 25328.57
const TICK_MS = 560
// Timeline (one tick each): scan the 5 lines while ledger rows start flipping in
// from tick 2, refund + stamp lands after the last row, hold, fade, loop.
const ROW_START = 2
const REFUND_AT = ROW_START + LEDGER.length
const FADE_AT = REFUND_AT + 7
const TOTAL = FADE_AT + 1

const LINE_H = 32
const LINES_PAD = 12

export default function HeroScene() {
  const reduced = useReducedMotion()
  const finePointer = useMediaQuery('(pointer: fine)')
  const [tick, setTick] = useState(0)
  const tiltRef = useRef(null)

  useEffect(() => {
    if (reduced) return
    const id = setInterval(() => setTick((t) => (t + 1) % TOTAL), TICK_MS)
    return () => clearInterval(id)
  }, [reduced])

  // Mouse tilt: write straight to the DOM so pointer moves don't re-render.
  useEffect(() => {
    const el = tiltRef.current
    if (reduced || !finePointer || !el) return
    let raf = 0
    const onMove = (e) => {
      const x = e.clientX / window.innerWidth - 0.5
      const y = e.clientY / window.innerHeight - 0.5
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        el.style.transform = `rotateY(${x * 16}deg) rotateX(${-y * 12}deg)`
      })
    }
    window.addEventListener('pointermove', onMove)
    return () => { window.removeEventListener('pointermove', onMove); cancelAnimationFrame(raf) }
  }, [reduced, finePointer])

  const t = reduced ? FADE_AT - 1 : tick
  const scanning = t < DOC_LINES.length ? t : -1
  const rowsShown = Math.max(0, Math.min(LEDGER.length, t - ROW_START + 1))
  const showRefund = t >= REFUND_AT
  const fading = t === FADE_AT
  const refund = useCountUp(REFUND, showRefund, reduced ? 0 : 900)

  return (
    <div className="stage-3d relative h-[430px] sm:h-[500px]" aria-label="Animated example: the sample IRP5 being read and turned into a tax return with a R25,328.57 refund" role="img">
      <div className="hero-glow" aria-hidden="true" />
      <div className={`h-full ${reduced ? 'preserve-3d' : 'hero-drift'}`} style={reduced ? { transform: 'rotateX(8deg) rotateY(-12deg)' } : undefined}>
        <div ref={tiltRef} className="preserve-3d h-full transition-transform duration-500 ease-out" aria-hidden="true">

          {/* The paper certificate */}
          <div
            className="preserve-3d absolute left-0 top-0 w-[82%] sm:w-[66%] bg-white rounded-xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)]"
            style={{ transform: 'translateZ(-40px) rotateY(10deg)' }}
          >
            <div className="rounded-t-xl bg-blue-600 px-4 py-3">
              <p className="font-heading font-semibold text-sm text-white">Employee Tax Certificate</p>
              <p className="text-[10px] text-blue-100 mt-0.5">IRP5 · Karoo Ridge Trading (Pty) Ltd · 2026</p>
            </div>
            <div className="preserve-3d relative px-3" style={{ paddingTop: LINES_PAD, paddingBottom: LINES_PAD }}>
              <div
                className="scan-beam"
                style={{ top: LINES_PAD + Math.max(0, scanning) * LINE_H + LINE_H / 2, opacity: scanning >= 0 ? 1 : 0 }}
              />
              {DOC_LINES.map((l, i) => (
                <div
                  key={l.label}
                  className={`preserve-3d relative flex items-center justify-between gap-3 px-2 rounded-md text-[11px] sm:text-xs transition-colors duration-300 ${
                    i === scanning ? 'bg-blue-50 text-blue-900' : 'text-gray-500'
                  }`}
                  style={{ height: LINE_H }}
                >
                  <span className="truncate">{l.label}</span>
                  <span className="font-mono font-semibold text-gray-900 whitespace-nowrap">{l.value}</span>
                  {i === scanning && (
                    <span key={tick} className="ghost-lift absolute right-2 font-mono font-bold text-blue-600 bg-white rounded px-1 shadow-lg whitespace-nowrap">
                      {l.value}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* The digital return, floating in front */}
          <div
            className="preserve-3d absolute right-0 bottom-0 w-[84%] sm:w-[64%] rounded-xl bg-gray-900 border border-blue-400/30 shadow-[0_35px_90px_-20px_rgba(37,99,235,0.7)] transition-opacity duration-500"
            style={{ transform: 'translateZ(90px)', opacity: fading ? 0 : 1 }}
          >
            <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-white/10">
              <span className="text-xs font-semibold text-white">Your return, 2025/26</span>
              <span className="flex items-center gap-1.5 text-[10px] text-blue-300">
                <span className={`w-1.5 h-1.5 rounded-full ${showRefund ? 'bg-green-400' : 'bg-blue-400 animate-pulse'}`} />
                {showRefund ? 'Done' : 'Calculating'}
              </span>
            </div>
            <div className="preserve-3d px-4 py-2 text-[11px] sm:text-xs">
              {LEDGER.map(([label, amount, strong], i) => (
                <div
                  key={label}
                  className={`flex justify-between gap-3 py-[3px] ${strong ? 'border-t border-white/15 mt-1 pt-1.5' : ''} ${
                    i < rowsShown ? 'flip-in' : 'opacity-0'
                  }`}
                >
                  <span className={strong ? 'text-white font-medium' : 'text-gray-400'}>{label}</span>
                  <span className={`font-mono tabular-nums ${strong ? 'text-white font-semibold' : 'text-gray-300'}`}>{amount}</span>
                </div>
              ))}
              <div className={`flex justify-between items-baseline gap-3 border-t-2 border-white/80 mt-2 pt-2 pb-1 ${showRefund ? 'flip-in' : 'opacity-0'}`}>
                <span className="text-white font-semibold text-sm">Refund</span>
                <span className="font-mono tabular-nums font-bold text-green-400 text-base sm:text-lg">
                  R {refund.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            {showRefund && (
              <div className="absolute -top-5 right-2 sm:-right-3" style={{ transform: 'translateZ(50px)' }}>
                <div className="stamp-in px-3 py-1 rounded-md border-[3px] border-green-400 text-green-400 bg-gray-950/80 font-heading font-bold tracking-[0.2em] text-sm">
                  REFUND
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
