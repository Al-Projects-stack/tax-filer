import { useState, useEffect } from 'react'

export default function CalculateStep({ data, onComplete }) {
  const [calc, setCalc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [validationError, setValidationError] = useState(null)

  useEffect(() => {
    let cancelled = false

    const income = data.income
    const paye = data.federalTaxWithheld

    if (typeof income !== 'number' || income <= 0) {
      setValidationError('Your gross income is missing or invalid. Go back to the previous step and enter your income before calculating.')
      setLoading(false)
      return
    }

    const run = async () => {
      try {
        const res = await fetch('/api/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        const json = await res.json()
        if (!cancelled) {
          setCalc(json)
          setLoading(false)
        }
      } catch {
        if (!cancelled) {
          setValidationError('Calculation failed due to a connection issue. Please try again.')
          setLoading(false)
        }
      }
    }
    run()
    return () => { cancelled = true }
  }, [data])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Calculating your return</h2>
          <p className="text-gray-500 mt-1">Applying SARS tax tables to your income</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-12 shadow-sm flex justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Processing...</p>
          </div>
        </div>
      </div>
    )
  }

  if (validationError) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mt-5">Cannot calculate your return</h2>
          <p className="text-gray-500 mt-1.5 max-w-sm mx-auto">{validationError}</p>
        </div>
      </div>
    )
  }

  if (!calc) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Could not calculate your return.</p>
      </div>
    )
  }

  const fmt = (n) => 'R ' + Math.abs(n).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Your tax calculation</h2>
        <p className="text-gray-500 mt-1">SARS income tax tables &middot; {calc.taxYear}</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Income Summary</h3>
        </div>
        <div className="px-6 py-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-500">Gross Income</span>
            <span className="font-semibold text-gray-900 tabular-nums">{fmt(calc.income)}</span>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Tax Breakdown</h3>
        </div>
        <div className="px-6 py-4 space-y-3">
          {calc.breakdown.map((b, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-gray-500">{b.label}</span>
              <span className="text-gray-500 tabular-nums">{b.rate}</span>
              <span className="font-medium text-gray-900 tabular-nums">{fmt(b.amount)}</span>
            </div>
          ))}
          {calc.breakdown.length === 0 && (
            <div className="text-sm text-gray-400">Income falls below tax threshold</div>
          )}
          <div className="flex justify-between pt-3 border-t border-gray-200 font-medium">
            <span className="text-gray-800">Gross Tax Liability</span>
            <span className="text-gray-900 tabular-nums">{fmt(calc.grossTax)}</span>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Rebates</h3>
        </div>
        <div className="px-6 py-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-500">Primary Rebate (under 65)</span>
            <span className="font-medium text-gray-900 tabular-nums">- {fmt(calc.primaryRebate)}</span>
          </div>
          <div className="flex justify-between pt-3 border-t border-gray-200 font-semibold">
            <span className="text-gray-800">Tax After Rebate</span>
            <span className="text-gray-900 tabular-nums">{fmt(calc.totalTax)}</span>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">PAYE Summary</h3>
        </div>
        <div className="px-6 py-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-500">PAYE Already Withheld</span>
            <span className="font-medium text-gray-900 tabular-nums">{fmt(calc.payeWithheld)}</span>
          </div>
        </div>

        <div className={`px-6 py-5 border-t-2 ${calc.isRefund ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
          <div className="flex justify-between items-center">
            <div>
              <span className={`text-lg font-bold ${calc.isRefund ? 'text-green-700' : 'text-red-700'}`}>
                {calc.isRefund ? 'Estimated Refund' : 'Amount Owing'}
              </span>
              <p className="text-xs text-gray-500 mt-0.5">
                {calc.isRefund ? 'SARS typically processes refunds within 21 days' : 'Payment due upon filing'}
              </p>
            </div>
            <span className={`text-2xl font-extrabold tabular-nums ${calc.isRefund ? 'text-green-600' : 'text-red-600'}`}>
              {calc.isRefund ? '' : '-'}{fmt(calc.refund)}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={() => onComplete(calc)}
        className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold text-base hover:bg-blue-700 active:scale-[0.98] transition-all duration-200 shadow-sm"
      >
        Continue to File
      </button>
    </div>
  )
}
