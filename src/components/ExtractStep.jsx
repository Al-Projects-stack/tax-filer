import { useState, useEffect, useRef } from 'react'

const INITIAL_FORM = {
  employerName: '',
  employerEIN: '',
  taxYear: 2025,
  income: 0,
  wagesSalary: 0,
  federalTaxWithheld: 0,
  stateTaxWithheld: 0,
  socialSecurityWages: 0,
  medicareWages: 0,
}

const NUMERIC_FIELDS = new Set([
  'taxYear', 'income', 'wagesSalary',
  'federalTaxWithheld', 'stateTaxWithheld',
  'socialSecurityWages', 'medicareWages',
])

const FIELD_LABELS = {
  employerName: 'Employer Name',
  employerEIN: 'Employer EIN',
  taxYear: 'Tax Year',
  income: 'Total Income (Box 1)',
  wagesSalary: 'Wages & Salary',
  federalTaxWithheld: 'Federal Tax Withheld (Box 2)',
  stateTaxWithheld: 'State Tax Withheld (Box 17)',
  socialSecurityWages: 'Social Security Wages (Box 3)',
  medicareWages: 'Medicare Wages (Box 5)',
}

function StageIcon({ status }) {
  if (status === 'done') {
    return (
      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
        <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    )
  }
  if (status === 'active') {
    return (
      <div className="w-6 h-6 rounded-full border-2 border-blue-500 flex items-center justify-center flex-shrink-0">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
      </div>
    )
  }
  return (
    <div className="w-6 h-6 rounded-full border-2 border-gray-200 flex items-center justify-center flex-shrink-0">
      <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
    </div>
  )
}

export default function ExtractStep({ onComplete }) {
  const [phase, setPhase] = useState('starting') // starting | processing | ready | failed
  const [stages, setStages] = useState([])
  const [warning, setWarning] = useState('')
  const [formData, setFormData] = useState({ ...INITIAL_FORM })
  const [errors, setErrors] = useState({})
  const pollRef = useRef(null)
  const jobIdRef = useRef(null)

  const resetAndRetry = () => {
    setPhase('starting')
    setStages([])
    setWarning('')
    setFormData({ ...INITIAL_FORM })
    setErrors({})
    jobIdRef.current = null
  }

  const startExtraction = useRef(() => {})

  useEffect(() => {
    startExtraction.current = async () => {
      try {
        const res = await fetch('/api/extract', { method: 'POST' })
        if (!res.ok) throw new Error('Failed to start extraction')
        const { jobId } = await res.json()
        jobIdRef.current = jobId
        setPhase('processing')
      } catch {
        setWarning('We could not start the extraction process. This is usually a temporary issue.')
        setPhase('failed')
      }
    }
  }, [])

  useEffect(() => {
    if (phase === 'starting') {
      startExtraction.current()
    }
  }, [phase])

  useEffect(() => {
    if (phase !== 'processing' || !jobIdRef.current) return

    let cancelled = false

    const poll = async () => {
      try {
        const res = await fetch(`/api/extract/${jobIdRef.current}`)
        if (!res.ok) throw new Error('Poll failed')
        const data = await res.json()
        if (cancelled) return

        setStages(data.stages || [])

        if (data.status === 'complete') {
          const r = data.result || {}
          const allZeros = !r.income && !r.federalTaxWithheld
          const hasWarning = r._warning && r._warning.length > 0

          if (allZeros && hasWarning && r._warning.includes('Could not extract')) {
            setWarning('The document could not be read. No text was found in the file.')
            setPhase('failed')
            return
          }

          setFormData({
            employerName: r.employerName || '',
            employerEIN: r.employerEIN || '',
            taxYear: r.taxYear || 2025,
            income: typeof r.income === 'number' ? r.income : 0,
            wagesSalary: typeof r.wagesSalary === 'number' ? r.wagesSalary : (typeof r.income === 'number' ? r.income : 0),
            federalTaxWithheld: typeof r.federalTaxWithheld === 'number' ? r.federalTaxWithheld : 0,
            stateTaxWithheld: typeof r.stateTaxWithheld === 'number' ? r.stateTaxWithheld : 0,
            socialSecurityWages: typeof r.socialSecurityWages === 'number' ? r.socialSecurityWages : 0,
            medicareWages: typeof r.medicareWages === 'number' ? r.medicareWages : 0,
          })
          if (r._warning) setWarning(r._warning)
          setPhase('ready')
        } else if (data.status === 'error') {
          setWarning(data.error || 'Extraction failed.')
          setPhase('failed')
        }
      } catch {
        if (!cancelled) {
          setWarning('Connection lost. Please try again.')
          setPhase('failed')
        }
      }
    }

    poll()
    const interval = setInterval(poll, 400)
    pollRef.current = interval

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [phase])

  const handleChange = (field) => (e) => {
    const raw = e.target.value
    if (NUMERIC_FIELDS.has(field)) {
      if (raw === '' || raw === '-') {
        setFormData((prev) => ({ ...prev, [field]: raw }))
        return
      }
      const num = Number(raw)
      if (!isNaN(num)) {
        setFormData((prev) => ({ ...prev, [field]: num }))
        setErrors((prev) => {
          const next = { ...prev }
          delete next[field]
          return next
        })
      }
    } else {
      setFormData((prev) => ({ ...prev, [field]: raw }))
    }
  }

  const handleBlur = (field) => () => {
    const val = formData[field]
    if (NUMERIC_FIELDS.has(field)) {
      if (val === '' || val === '-' || val === 0) {
        setFormData((prev) => ({ ...prev, [field]: 0 }))
      }
      if (val === '' || isNaN(Number(val))) {
        setErrors((prev) => ({ ...prev, [field]: 'Must be a number' }))
      }
    }
  }

  const handleContinue = () => {
    const cleaned = { ...formData }
    let hasError = false
    const newErrors = {}

    for (const key of NUMERIC_FIELDS) {
      const v = cleaned[key]
      if (typeof v !== 'number' || isNaN(v)) {
        cleaned[key] = 0
        newErrors[key] = 'Invalid number, reset to 0'
        hasError = true
      }
    }

    setErrors(newErrors)
    if (!hasError) {
      onComplete(cleaned)
    }
  }

  const stageDots = stages.map((s) => s.status === 'active' || s.status === 'done')

  if (phase === 'starting' || phase === 'processing') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Extracting your data</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Reading your document to extract tax information</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 shadow-sm">
          <div className="space-y-4">
            {stages.length === 0 && (
              <div className="flex items-center gap-3 py-2">
                <div className="w-6 h-6 rounded-full border-2 border-blue-500 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                </div>
                <span className="text-sm text-gray-500">Initializing extraction...</span>
              </div>
            )}

            {stages.map((s, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <StageIcon status={s.status} />
                <span
                  className={`text-sm ${
                    s.status === 'done'
                      ? 'text-gray-500 dark:text-gray-400 line-through'
                      : s.status === 'active'
                      ? 'text-gray-900 dark:text-gray-100 font-medium'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                >
                  {s.name}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-center gap-1.5">
            {(stageDots.length > 0 ? stageDots : [true]).map((active, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  active ? 'bg-blue-500 animate-pulse' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'failed') {
    return (
      <div className="space-y-6">
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-5">Could not read your document</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1.5 max-w-sm mx-auto">
            {warning || 'The file could not be processed. This can happen with scanned documents or damaged files.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={resetAndRetry}
            className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors shadow-sm"
          >
            Try Uploading Again
          </button>
          <button
            onClick={() => setPhase('ready')}
            className="flex-1 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Enter Details Manually
          </button>
        </div>
      </div>
    )
  }

  const fields = Object.keys(FIELD_LABELS)

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-full px-4 py-1.5 text-sm text-green-700 dark:text-green-400 mb-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Document processed
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Review extracted information</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Edit any field if the data needs correction</p>
      </div>

      {warning && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-5 py-3.5 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-amber-800 dark:text-amber-300">{warning}</p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {fields.map((key) => (
            <div key={key} className="px-6 py-3.5">
              <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">{FIELD_LABELS[key]}</label>
              <input
                type="text"
                value={formData[key] ?? ''}
                onChange={handleChange(key)}
                onBlur={handleBlur(key)}
                inputMode={NUMERIC_FIELDS.has(key) ? 'decimal' : 'text'}
                className={`w-full px-3 py-2 text-sm font-medium text-gray-900 dark:text-gray-100 border rounded-lg outline-none transition-colors tabular-nums ${
                  errors[key]
                    ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 focus:ring-2 focus:ring-red-300 dark:focus:ring-red-700'
                    : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-700 focus:border-blue-400'
                }`}
              />
              {errors[key] && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors[key]}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleContinue}
        className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold text-base hover:bg-blue-700 active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md"
      >
        Continue to Calculation
      </button>
    </div>
  )
}
