import { useState, useEffect, useRef } from 'react'

function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          obs.disconnect()
        }
      },
      { threshold: 0.12 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div
      ref={ref}
      className={`${shown ? 'anim-fade-up' : 'opacity-0'} ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

function ExtractMock() {
  return (
    <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-4 items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 font-mono text-[11px] leading-5 text-gray-600 dark:text-gray-400">
        <p>Gross earnings (3601)</p>
        <p className="font-bold text-gray-900 dark:text-gray-100">R 800,308</p>
        <p className="mt-2">Tax deducted (4102)</p>
        <p className="font-bold text-gray-900 dark:text-gray-100">R 214,241.28</p>
      </div>
      <div className="mx-auto w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 anim-float">
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 6l6 6-6 6M5 12h14" />
        </svg>
      </div>
      <div className="space-y-2 text-sm">
        {[
          ['Income', 'R 800,308.00'],
          ['PAYE withheld', 'R 214,241.28'],
          ['UIF (info)', 'R 2,125.44'],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-lg px-3 py-2">
            <span className="text-green-700 dark:text-green-300">{k}</span>
            <span className="font-semibold text-green-800 dark:text-green-200 tabular-nums">{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function BracketMock() {
  const bars = [
    ['18%', 16], ['26%', 24], ['31%', 32], ['36%', 42], ['39%', 54], ['41%', 68], ['45%', 88],
  ]
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm space-y-3">
      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">SARS 2025/2026 — 7 brackets</p>
      {bars.map(([rate, w], i) => (
        <div key={rate} className="flex items-center gap-3 anim-fade-up" style={{ animationDelay: `${i * 70}ms` }}>
          <span className="w-9 text-xs font-bold text-blue-600 dark:text-blue-400 tabular-nums">{rate}</span>
          <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-3 bg-blue-600 rounded-full" style={{ width: `${w}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function CountUp({ to, suffix = '', duration = 1200 }) {
  const ref = useRef(null)
  const started = useRef(false)
  const [val, setVal] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const t0 = performance.now()
          const tick = (t) => {
            const p = Math.min(1, (t - t0) / duration)
            setVal(to * (1 - Math.pow(1 - p, 3)))
            if (p < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
          obs.disconnect()
        }
      },
      { threshold: 0.4 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [to, duration])
  return (
    <span ref={ref} className="tabular-nums">
      {Math.round(val)}{suffix}
    </span>
  )
}

function HistoryMock() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm max-w-sm mx-auto w-full space-y-3">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm">
        <div>
          <p className="text-gray-400 dark:text-gray-500 text-xs">12 Aug 2025</p>
          <p className="font-medium text-gray-900 dark:text-gray-100">Sewandgrow (Pty) Ltd</p>
        </div>
        <p className="font-semibold text-green-600 dark:text-green-400 tabular-nums">R 41,362.48</p>
      </div>
      <div className="px-4 py-3 border border-gray-100 dark:border-gray-700 rounded-xl text-xs space-y-1.5">
        <div className="flex justify-between">
          <span className="text-gray-400 dark:text-gray-500">Reference</span>
          <span className="font-mono font-medium text-gray-900 dark:text-gray-100">TAX-8X4K2PQR</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400 dark:text-gray-500">Gross Income</span>
          <span className="font-medium text-gray-900 dark:text-gray-100 tabular-nums">R 800,308.00</span>
        </div>
        <div className="flex justify-between items-center pt-1">
          <span className="text-gray-400 dark:text-gray-500">Kept forever, deletable</span>
          <span className="inline-flex items-center gap-1 text-red-500 dark:text-red-400 font-medium">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </span>
        </div>
      </div>
    </div>
  )
}

function ReceiptMock() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm max-w-sm mx-auto w-full">
      <p className="font-heading font-bold text-blue-600 dark:text-blue-400 tracking-tight">RETURN</p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Tax Filing Summary</p>
      <div className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">Reference</span>
          <span className="font-mono font-bold text-gray-900 dark:text-gray-100 text-xs">TAX-8X4K2PQR</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">Tax After Rebate</span>
          <span className="font-medium text-gray-900 dark:text-gray-100 tabular-nums">R 172,878.80</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-green-200 dark:border-green-800">
          <span className="font-semibold text-green-700 dark:text-green-400">Refund</span>
          <span className="font-extrabold text-green-600 dark:text-green-400 tabular-nums">R 41,362.48</span>
        </div>
      </div>
      <div className="mt-4 w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold text-center">
        Download Receipt
      </div>
    </div>
  )
}

const PILLARS = [
  {
    title: 'Upload anything',
    body: 'IRP5s, payslips, W-2s, scanned PDFs, even photos. If it has numbers on it, Return reads them.',
    icon: 'M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5',
  },
  {
    title: 'We read everything',
    body: 'PDF text, OCR on scans, monthly payslips annualised, retirement, medical aid, UIF and age-based rebates picked up automatically.',
    icon: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z',
  },
  {
    title: 'File with confidence',
    body: 'Edit any figure before calculating. Every bracket is itemised, and every filing is saved with a downloadable receipt.',
    icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
]

const DOC_TYPES = ['IRP5', 'Payslip', 'W-2', 'Scanned PDF', 'Photos']

const STATS = [
  [7, '', 'SARS brackets computed'],
  [5, '', 'Document types accepted'],
  [4, '', 'Steps from upload to filed'],
  [100, '%', 'Editable before you file'],
]

const MADE_FOR = [
  'Salaried employees',
  'Payslip earners',
  'Pensioners 65+',
  'W-2 holders',
  'Anyone with a shoebox of scans',
]

const EXTRAS = [
  {
    title: 'Dark mode',
    body: 'Easy on the eyes at midnight. It remembers your choice.',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />,
  },
  {
    title: 'Document preview',
    body: 'See your upload — PDF or photo — right inside the upload box before it processes.',
    icon: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </>
    ),
  },
  {
    title: 'Editable everything',
    body: 'Every extracted field can be corrected by hand. Nothing is filed until you approve it.',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />,
  },
  {
    title: 'Monthly payslips ×12',
    body: 'Monthly figures are spotted and annualised automatically, with a reminder to check them.',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
  },
  {
    title: 'Scan & photo OCR',
    body: 'Paper scans and phone photos become structured data, so there is nothing to retype.',
    icon: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </>
    ),
  },
  {
    title: 'PDF receipts',
    body: 'Every filing downloads as a professional receipt with reference number and breakdown.',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  },
]

const SARS_FACTS = [
  ['45%', 'Top rate above R1.817m'],
  ['R17,235', 'Primary rebate under 65'],
  ['R364 / R246', 'Medical credit per month'],
]

export default function Landing({ onStart }) {
  return (
    <div className="space-y-20 sm:space-y-28 pb-4">
      {/* Hero */}
      <section className="relative pt-10 sm:pt-16">
        <div className="bg-dots absolute inset-x-0 top-0 h-72 pointer-events-none" aria-hidden="true" />
        <div className="relative grid lg:grid-cols-2 gap-10 lg:gap-8 items-center">
          <div className="text-center lg:text-left">
            <div className="anim-fade-up inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-full px-4 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              SARS 2025/2026 tax tables built in
            </div>
            <h1 className="anim-fade-up text-4xl sm:text-6xl font-heading font-bold tracking-tight text-gray-900 dark:text-gray-100 mt-6 leading-[1.05]" style={{ animationDelay: '90ms' }}>
              Turn tax documents<br />into filed returns.
            </h1>
            <p className="anim-fade-up text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto lg:mx-0 mt-5" style={{ animationDelay: '180ms' }}>
              Upload any IRP5, payslip or scan. Return reads the figures, runs the SARS calculation, and files your return in minutes.
            </p>
            <div className="anim-fade-up flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3 mt-8" style={{ animationDelay: '270ms' }}>
              <button
                onClick={onStart}
                className="press w-full sm:w-auto px-8 py-3.5 bg-blue-600 text-white rounded-xl font-semibold text-base hover:bg-blue-700 transition-all duration-200 shadow-sm"
              >
                Start filing
              </button>
              <button
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="press w-full sm:w-auto px-8 py-3.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-semibold text-base hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
              >
                See how it works
              </button>
            </div>
            <div className="anim-fade-up flex flex-wrap items-center justify-center lg:justify-start gap-2 mt-8" style={{ animationDelay: '360ms' }}>
              {['Upload', 'Extract', 'Calculate', 'File'].map((s) => (
                <span key={s} className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full px-3 py-1.5">
                  <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="anim-pop-in relative" style={{ animationDelay: '200ms' }}>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60">
                <span className="w-2.5 h-2.5 bg-red-400 rounded-full" />
                <span className="w-2.5 h-2.5 bg-amber-400 rounded-full" />
                <span className="w-2.5 h-2.5 bg-green-400 rounded-full" />
                <span className="ml-2 text-[11px] text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md px-2.5 py-0.5">return / file</span>
              </div>
              <div className="grid grid-cols-[96px_1fr] gap-4 p-4">
                <div className="space-y-1.5">
                  {['Upload', 'Extract', 'Calculate', 'File'].map((s, i) => (
                    <div key={s} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] font-medium ${i < 2 ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500'}`}>
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${i < 2 ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                        {i < 2 ? '✓' : i + 1}
                      </span>
                      {s}
                    </div>
                  ))}
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 space-y-1.5 text-[11px]">
                  <p className="text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider text-[10px]">Extracted fields</p>
                  {[
                    ['Income', 'R 800,308.00'],
                    ['PAYE withheld', 'R 214,241.28'],
                    ['Retirement', 'R 45,000.00'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-lg px-2 py-1">
                      <span className="text-gray-500 dark:text-gray-400">{k}</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{v}</span>
                    </div>
                  ))}
                  <div className="flex justify-between bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-lg px-2 py-1">
                    <span className="text-green-700 dark:text-green-300 font-medium">Refund</span>
                    <span className="font-bold text-green-700 dark:text-green-300 tabular-nums">R 41,362.48</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="anim-float hidden sm:flex absolute -left-5 top-10 items-center gap-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full pl-2 pr-3 py-1.5 shadow-lg text-xs font-semibold text-blue-700 dark:text-blue-300">
              <span className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px]">✓</span>
              PAYE found
            </div>
            <div className="anim-float hidden sm:flex absolute -right-4 bottom-12 items-center gap-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full pl-2 pr-3 py-1.5 shadow-lg text-xs font-semibold text-green-700 dark:text-green-300" style={{ animationDelay: '1.2s' }}>
              <span className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-[10px]">✓</span>
              Refund +R41,362
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <Reveal>
        <section id="documents" className="text-center scroll-mt-20">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Works with your documents</p>
          <div className="marquee mt-5 -mx-4 sm:mx-0" aria-label="Supported document types">
            <div className="marquee-track gap-3 px-4">
              {[...DOC_TYPES, ...DOC_TYPES].map((d, i) => (
                <span key={`${d}-${i}`} aria-hidden={i >= DOC_TYPES.length} className="flex-shrink-0 px-5 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-heading font-semibold text-gray-700 dark:text-gray-200 shadow-sm">
                  {d}
                </span>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* Pillars */}
      <section id="how-it-works" className="scroll-mt-20">
        <Reveal className="text-center">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            What Return does for you.
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-3 max-w-lg mx-auto">
            Three things Return does for you.
          </p>
        </Reveal>
        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          {PILLARS.map((p, i) => (
            <Reveal key={p.title} delay={i * 110}>
              <div className="h-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
                <div className="w-11 h-11 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={p.icon} />
                  </svg>
                </div>
                <h3 className="font-heading font-semibold text-lg text-gray-900 dark:text-gray-100 mt-4">{p.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">{p.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={120}>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mr-1">Made for</span>
            {MADE_FOR.map((m) => (
              <span key={m} className="text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1.5">
                {m}
              </span>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Alternating features */}
      <section className="space-y-12 sm:space-y-16">
        <Reveal>
          <div className="grid sm:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Extraction</p>
              <h3 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 dark:text-gray-100 tracking-tight mt-2">Smart extraction from any page.</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-3 leading-relaxed">
                SARS codes, payslip labels, W-2 boxes, even scanned pages via OCR. Income, PAYE, retirement, medical aid, UIF and age-based rebates — pulled out and shown for your review before any calculation runs.
              </p>
            </div>
            <ExtractMock />
          </div>
        </Reveal>
        <Reveal>
          <div className="grid sm:grid-cols-2 gap-8 items-center">
            <div className="sm:order-2">
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Calculation</p>
              <h3 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 dark:text-gray-100 tracking-tight mt-2">SARS math, fully itemised.</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-3 leading-relaxed">
                All seven 2025/2026 brackets from 18% to 45%, retirement deductions, age-tier rebates and medical credits — every rand of tax shown where it comes from.
              </p>
            </div>
            <div className="sm:order-1">
              <BracketMock />
            </div>
          </div>
        </Reveal>
        <Reveal>
          <div className="grid sm:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Filing</p>
              <h3 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 dark:text-gray-100 tracking-tight mt-2">Proof of filing in one click.</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-3 leading-relaxed">
                Submit your return, download a professional PDF receipt, and revisit every filing any time from your history dashboard.
              </p>
            </div>
            <ReceiptMock />
          </div>
        </Reveal>
        <Reveal>
          <div className="grid sm:grid-cols-2 gap-8 items-center">
            <div className="sm:order-2">
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">History</p>
              <h3 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 dark:text-gray-100 tracking-tight mt-2">Every filing, on record.</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-3 leading-relaxed">
                Your history dashboard keeps every return with its full bracket breakdown and reference number. Compare years, re-download receipts, or delete what you don&apos;t need.
              </p>
            </div>
            <div className="sm:order-1">
              <HistoryMock />
            </div>
          </div>
        </Reveal>
      </section>

      {/* Everything else */}
      <section>
        <Reveal className="text-center">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            And everything else you&apos;d expect.
          </h2>
        </Reveal>
        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          {EXTRAS.map((x, i) => (
            <Reveal key={x.title} delay={(i % 3) * 110}>
              <div className="h-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    {x.icon}
                  </svg>
                </div>
                <h3 className="font-heading font-semibold text-gray-900 dark:text-gray-100 mt-3">{x.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{x.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Stats band */}
      <Reveal>
        <section className="bg-gray-900 dark:bg-gray-900 border-y border-gray-900 dark:border-gray-800 rounded-3xl px-6 py-10 sm:py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {STATS.map(([to, suffix, l]) => (
              <div key={l}>
                <p className="text-3xl sm:text-4xl font-heading font-bold text-white">
                  <CountUp to={to} suffix={suffix} />
                </p>
                <p className="text-sm text-gray-400 mt-1">{l}</p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* SARS facts */}
      <Reveal>
        <section className="text-center">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Built for the 2025/2026 tax year.
          </h2>
          <div className="grid sm:grid-cols-3 gap-4 mt-6 text-left">
            {SARS_FACTS.map(([v, l]) => (
              <div key={l} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
                <p className="text-xl font-heading font-bold text-blue-600 dark:text-blue-400 tabular-nums">{v}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{l}</p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* CTA */}
      <Reveal>
        <section className="text-center bg-blue-600 rounded-3xl px-6 py-12 sm:py-16">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-white tracking-tight">
            Stop dreading tax season.<br />Start your return.
          </h2>
          <p className="text-blue-100 mt-3 max-w-md mx-auto">
            Upload your first document and see your calculation in minutes. Free and editable.
          </p>
          <button
            onClick={onStart}
            className="press mt-8 px-8 py-3.5 bg-white text-blue-700 rounded-xl font-semibold text-base hover:bg-blue-50 transition-all duration-200 shadow-sm"
          >
            Start filing now
          </button>
        </section>
      </Reveal>

      {/* Footer */}
      <footer className="pt-4 pb-8">
        <div className="grid sm:grid-cols-3 gap-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="font-heading font-semibold text-gray-900 dark:text-gray-100">Return</span>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 leading-relaxed">
              Demonstration project. No real SARS integration, no real filings, no real payments.
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Product</p>
            <div className="flex flex-col items-start gap-2 mt-3">
              <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                How it works
              </button>
              <button onClick={() => document.getElementById('documents')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Supported documents
              </button>
              <button onClick={onStart} className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Start filing
              </button>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Your account</p>
            <div className="flex flex-col items-start gap-2 mt-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">Filing history with receipts</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">Dark mode, saved preference</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">SARS 2025/2026 tables</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-300 dark:text-gray-600 mt-6 text-center">© 2026 Return. All rights reserved.</p>
      </footer>
    </div>
  )
}
