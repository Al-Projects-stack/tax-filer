import { useRef } from 'react'
import { clamp, smoothstep, useMediaQuery, usePinProgress, useReducedMotion } from './motion'

export const STEPS = [
  {
    title: 'Upload',
    body: 'A PDF, JPG or PNG up to 10 MB. On a phone you can photograph the certificate instead.',
  },
  {
    title: 'Check the figures',
    body: 'Text PDFs are read directly. Scans and photos go through OCR. Whatever it finds lands in a form you can correct.',
  },
  {
    title: 'Calculate',
    body: 'Your income runs through the seven brackets, then deductions, rebates and the medical credit, each with its amount.',
  },
  {
    title: 'Save the filing',
    body: 'You get a reference number and a PDF summary. The filing stays in your history until you delete it.',
  },
]

function FaceShell({ n, title, badge, children }) {
  return (
    <div className="absolute inset-0 rounded-2xl bg-white border-2 border-blue-500/60 p-5 flex flex-col shadow-[inset_0_0_40px_rgba(37,99,235,0.08)]">
      <div className="flex items-center justify-between">
        <span className="font-heading text-xs font-bold tracking-widest text-blue-600">STEP {n}</span>
        <span className="font-heading text-4xl font-bold text-gray-100 leading-none">{n}</span>
      </div>
      <div className="flex items-center justify-between gap-2 mt-1">
        <p className="font-heading font-bold text-gray-900 text-lg">{title}</p>
        {badge}
      </div>
      <div className="flex-1 flex flex-col justify-center mt-3">{children}</div>
    </div>
  )
}

function UploadFace({ active }) {
  return (
    <FaceShell n={1} title="Upload">
      <div className="border-2 border-dashed border-blue-300 rounded-xl p-4 text-center bg-blue-50/60">
        <svg className="w-8 h-8 mx-auto text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-xs font-medium text-gray-700 mt-2">sample-irp5.pdf</p>
        <p className="text-[10px] text-gray-400">2.0 KB</p>
        <div className="mt-3 h-1.5 bg-blue-100 rounded-full overflow-hidden">
          <div key={active ? 'on' : 'off'} className={`h-full bg-blue-600 rounded-full ${active ? 'fill-bar' : 'w-0'}`} />
        </div>
      </div>
    </FaceShell>
  )
}

function CheckFace() {
  const rows = [['Gross income', '486000'], ['PAYE', '98412'], ['Medical aid', '30240'], ['Members', '3']]
  return (
    <FaceShell n={2} title="Check the figures">
      <div className="space-y-1.5">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-2 text-[11px]">
            <span className="text-gray-500">{k}</span>
            <span className="flex items-center gap-1.5">
              <span className="font-mono text-gray-900 border border-gray-200 rounded px-2 py-0.5 min-w-[70px] text-right">{v}</span>
              <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
          </div>
        ))}
      </div>
    </FaceShell>
  )
}

function CalculateFace({ active }) {
  // Tax owed in each band for the sample's R450,000 taxable income.
  const bars = [['18%', 42678], ['26%', 34683.74], ['31%', 24644.69]]
  const max = 42678
  return (
    <FaceShell n={3} title="Calculate">
      <div className="flex items-end justify-around gap-3">
        {bars.map(([rate, amt], i) => (
          <div key={rate} className="flex flex-col items-center gap-1 flex-1">
            <span className="text-[9px] font-mono text-gray-500">R{Math.round(amt / 1000)}k</span>
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-blue-700 to-blue-400 origin-bottom transition-transform duration-700"
              style={{ height: Math.round((amt / max) * 64), transform: `scaleY(${active ? 1 : 0.1})`, transitionDelay: `${i * 120}ms` }}
            />
            <span className="text-[10px] font-bold text-blue-700">{rate}</span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-gray-500 mt-2 text-center">Tax for the year <span className="font-mono font-semibold text-gray-900">R 73,083.43</span></p>
    </FaceShell>
  )
}

function FileFace({ active }) {
  return (
    <FaceShell
      n={4}
      title="Save the filing"
      badge={active && (
        <div className="stamp-in px-2 py-0.5 border-[3px] border-blue-600 text-blue-600 bg-white rounded font-heading font-bold tracking-[0.2em] text-xs">
          SAVED
        </div>
      )}
    >
      <div className="border border-gray-200 rounded-xl p-3 text-[11px] space-y-1">
        <div className="flex justify-between"><span className="text-gray-500">Reference</span><span className="font-mono font-semibold">TAX-K7R2M9QX</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Tax year</span><span className="font-mono">2025/26</span></div>
        <div className="flex justify-between pt-1 border-t border-gray-100"><span className="font-semibold text-green-700">Refund</span><span className="font-mono font-bold text-green-600">R 25,328.57</span></div>
      </div>
    </FaceShell>
  )
}

const FACES = [UploadFace, CheckFace, CalculateFace, FileFace]

function StepText({ step, i, active }) {
  return (
    <li className={`relative pl-6 transition-all duration-500 ${active ? 'opacity-100 translate-x-0' : 'opacity-40 -translate-x-1'}`}>
      <span className={`absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full transition-colors duration-500 ${active ? 'bg-blue-400 shadow-[0_0_12px_3px_rgba(96,165,250,0.7)]' : 'bg-gray-600'}`} />
      <p className="font-heading font-semibold text-white text-lg">
        <span className="font-mono text-sm text-blue-300 mr-2">{i + 1}</span>{step.title}
      </p>
      <p className={`text-sm text-gray-400 leading-relaxed mt-1 overflow-hidden transition-all duration-500 ${active ? 'max-h-32' : 'max-h-0 lg:max-h-32'}`}>{step.body}</p>
    </li>
  )
}

export default function StepCube() {
  const reduced = useReducedMotion()
  // Big cube only when the text sits beside it and there's height for it.
  const wide = useMediaQuery('(min-width: 1024px) and (min-height: 640px)')
  const pinRef = useRef(null)
  const p = usePinProgress(pinRef)

  // Hold on each face, then turn: 0..3 with eased transitions in between.
  const raw = p * (STEPS.length - 1)
  const seg = Math.min(STEPS.length - 2, Math.floor(raw))
  const pos = seg + smoothstep(clamp((raw - seg - 0.25) / 0.5))
  const active = Math.round(pos)
  const size = wide ? 320 : 240
  const half = size / 2

  if (reduced) {
    return (
      <section id="how-it-works" className="scroll-mt-14 bg-gray-950 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="font-heading text-3xl sm:text-5xl font-bold text-white tracking-tight">How it works</h2>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FACES.map((Face, i) => (
              <div key={i} className="relative h-[280px]"><Face active /></div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  const faceTransforms = [
    `translateZ(${half}px)`,
    `rotateY(90deg) translateZ(${half}px)`,
    `rotateY(180deg) translateZ(${half}px)`,
    `rotateY(270deg) translateZ(${half}px)`,
  ]

  return (
    <section id="how-it-works" ref={pinRef} className="relative bg-gray-950 h-[320vh] scroll-mt-14">
      <div className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-hidden flex items-center">
        <div className="hero-glow opacity-60" aria-hidden="true" />
        <div className="relative max-w-6xl w-full mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-6 lg:gap-12 items-center">
          <div>
            <h2 className="font-heading text-3xl lg:text-5xl font-bold text-white tracking-tight">How it works</h2>
            <div className="mt-4 h-1 w-40 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${p * 100}%` }} />
            </div>
            <ol className="mt-5 lg:mt-8 space-y-3 lg:space-y-6">
              {STEPS.map((s, i) => <StepText key={s.title} step={s} i={i} active={i === active} />)}
            </ol>
          </div>

          <div className="stage-3d flex justify-center py-4" style={{ perspective: 1100 }}>
            <div
              className="preserve-3d relative"
              style={{ width: size, height: size, transform: `rotateX(-14deg) rotateY(${-pos * 90}deg)` }}
            >
              {FACES.map((Face, i) => (
                <div key={i} className="absolute inset-0 preserve-3d" style={{ transform: faceTransforms[i], backfaceVisibility: 'hidden' }}>
                  <Face active={i === active} />
                </div>
              ))}
              <div
                className="absolute rounded-full bg-blue-600/40 blur-2xl"
                style={{ width: size, height: size / 3, left: 0, top: size + 30, transform: `rotateX(90deg)` }}
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
