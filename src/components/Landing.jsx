import { Fragment, useRef } from 'react'
import HeroScene from './landing/HeroScene'
import StepCube from './landing/StepCube'
import BracketBars3D from './landing/BracketBars3D'
import { useInView, useReducedMotion } from './landing/motion'

const HEADLINE = ['Work', 'out', 'your', 'tax', 'from', 'your', 'IRP5.']

const FIELDS = [
  ['Gross income', 'Code 3601, “gross pay”, “basic salary”, W-2 box 1'],
  ['PAYE', 'Code 4102, “tax deducted”, W-2 box 2'],
  ['Retirement contributions', 'Codes 4001, 4003 and 4006'],
  ['Medical scheme fees', 'Code 4116, plus the number of members'],
  ['UIF', 'Code 4141. Shown, not deducted'],
  ['Age', 'Date of birth, or worked out from an SA ID number'],
]

const RATES = [
  ['Rebates', 'R17,235 under 65, R26,679 from 65, R29,824 from 75.'],
  ['Medical tax credit', 'R364 a month each for you and your first dependant, R246 for every other member.'],
  ['Retirement deduction', 'Up to 27.5% of income, capped at R350,000 a year.'],
]

const LIMITS = [
  'It doesn’t submit anything to SARS. Your real return still goes through eFiling.',
  'It only handles employment income. Interest, rental income, capital gains and provisional tax aren’t covered.',
  'OCR can misread a blurry scan. Check the figures before you calculate.',
]

// Children flip down into place (staggered) once the block scrolls into view.
function useFlip(threshold = 0.2) {
  const ref = useRef(null)
  const reduced = useReducedMotion()
  const inView = useInView(ref, threshold)
  const cls = (i, step = 70) => ({
    className: reduced || inView ? 'flip-in' : 'opacity-0',
    style: { animationDelay: `${i * step}ms` },
  })
  return [ref, cls]
}

function Buttons({ onStart, onTrySample }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <button
        onClick={onStart}
        className="press cta-glow px-7 py-3.5 bg-blue-600 text-white rounded-xl font-semibold text-base hover:bg-blue-500 hover:-translate-y-0.5 transition-all"
      >
        Start filing
      </button>
      <button
        onClick={onTrySample}
        className="press px-7 py-3.5 rounded-xl font-semibold text-base text-white border border-white/25 bg-white/5 hover:bg-white/10 hover:border-white/50 hover:-translate-y-0.5 transition-all"
      >
        Try a sample IRP5
      </button>
    </div>
  )
}

export default function Landing({ onStart, onTrySample }) {
  const [fieldsRef, fieldFlip] = useFlip()
  const [ratesRef, rateFlip] = useFlip()
  const [limitsRef, limitFlip] = useFlip()

  return (
    <div className="overflow-x-clip">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gray-950 text-white">
        <div className="hero-grid" aria-hidden="true" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-14 sm:pt-20 pb-16 sm:pb-24 grid lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-8 items-center">
          <div>
            <p className="anim-fade-up text-sm font-medium text-blue-300">For salaried taxpayers in South Africa, 2025/26 tax year</p>
            <h1 className="mt-4 font-heading font-bold tracking-tight leading-[1.02] text-5xl sm:text-6xl lg:text-7xl" style={{ perspective: 800 }}>
              {HEADLINE.map((w, i) => (
                <Fragment key={i}>
                  <span
                    className={`word-up ${w === 'IRP5.' ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300' : ''}`}
                    style={{ animationDelay: `${120 + i * 70}ms` }}
                  >
                    {w}
                  </span>{' '}
                </Fragment>
              ))}
            </h1>
            <p className="anim-fade-up mt-6 text-lg text-gray-300 max-w-xl" style={{ animationDelay: '600ms' }}>
              Upload your certificate, a payslip or a photo of either. Return pulls out the figures, you check them,
              and it runs them through the SARS tables to show your refund or what you owe.
            </p>
            <div className="anim-fade-up mt-8" style={{ animationDelay: '720ms' }}>
              <Buttons onStart={onStart} onTrySample={onTrySample} />
              <p className="mt-3 text-sm text-gray-500">The sample is a made-up certificate. It&apos;s the one being read here.</p>
            </div>
          </div>
          <div className="anim-fade-up" style={{ animationDelay: '300ms' }}>
            <HeroScene />
          </div>
        </div>
      </section>

      <StepCube />

      {/* What it reads */}
      <section id="documents" className="scroll-mt-14 max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28 grid lg:grid-cols-[1fr_1.4fr] gap-10 lg:gap-14">
        <div>
          <h2 className="font-heading text-3xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-100">What it reads</h2>
          <p className="mt-5 text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            IRP5 certificates, monthly payslips, US W-2 forms, scanned PDFs and phone photos.
          </p>
          <p className="mt-3 text-gray-600 dark:text-gray-400 leading-relaxed">
            Monthly payslips are multiplied by twelve, and you&apos;re asked to check the result.
          </p>
        </div>
        <div ref={fieldsRef} className="stage-3d space-y-2">
          {FIELDS.map(([field, source], i) => {
            const f = fieldFlip(i)
            return (
              <div
                key={field}
                className={`${f.className} grid sm:grid-cols-[200px_1fr] gap-1 sm:gap-4 items-baseline px-5 py-3.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm hover:border-blue-400 hover:shadow-md transition-[border-color,box-shadow]`}
                style={f.style}
              >
                <span className="font-semibold text-gray-900 dark:text-gray-100">{field}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">{source}</span>
              </div>
            )
          })}
        </div>
      </section>

      {/* Brackets */}
      <section className="bg-white dark:bg-gray-900 border-y border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <h2 className="font-heading text-3xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-100">The 2025/26 figures it uses</h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
            Seven tax brackets, from 18% to 45%. Each rand is taxed at the rate of the band it falls in.
          </p>
          <div className="mt-10 grid lg:grid-cols-[1.4fr_1fr] gap-12 items-center">
            <BracketBars3D />
            <dl ref={ratesRef} className="stage-3d space-y-3">
              {RATES.map(([term, detail], i) => {
                const f = rateFlip(i, 110)
                return (
                  <div key={term} className={`${f.className} rounded-xl p-5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700`} style={f.style}>
                    <dt className="font-heading font-semibold text-gray-900 dark:text-gray-100">{term}</dt>
                    <dd className="mt-1 text-sm text-gray-600 dark:text-gray-400">{detail}</dd>
                  </div>
                )
              })}
            </dl>
          </div>
        </div>
      </section>

      {/* Limits */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-24 grid lg:grid-cols-[1fr_1.4fr] gap-8 lg:gap-14">
        <h2 className="font-heading text-3xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-100">What it won&apos;t do</h2>
        <ul ref={limitsRef} className="stage-3d space-y-3">
          {LIMITS.map((l, i) => {
            const f = limitFlip(i, 110)
            return (
              <li key={l} className={`${f.className} flex gap-3 text-gray-700 dark:text-gray-300 rounded-xl p-4 border border-dashed border-gray-300 dark:border-gray-700`} style={f.style}>
                <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 border-gray-400 text-gray-500 text-xs font-bold flex items-center justify-center" aria-hidden="true">✕</span>
                {l}
              </li>
            )
          })}
        </ul>
      </section>

      {/* Closing */}
      <section className="relative overflow-hidden bg-gray-950 text-white">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-glow" aria-hidden="true" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-24 sm:py-32 text-center">
          <h2 className="font-heading text-4xl sm:text-6xl font-bold tracking-tight">Got your IRP5 to hand?</h2>
          <p className="mt-4 text-lg text-gray-300">If not, the sample runs the whole thing in about a minute.</p>
          <div className="mt-10 flex justify-center">
            <Buttons onStart={onStart} onTrySample={onTrySample} />
          </div>
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-sm text-gray-400 dark:text-gray-500">
        Return is a demonstration project. It isn&apos;t affiliated with SARS and doesn&apos;t submit returns.
      </footer>
    </div>
  )
}
