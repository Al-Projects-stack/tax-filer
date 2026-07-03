import { useState, useEffect } from 'react'

export default function CalculateStep({ data, onComplete }) {
  const [calc, setCalc] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
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
        if (!cancelled) setLoading(false)
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
          <p className="text-gray-500 mt-1">Applying tax rates to your income data</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-12 shadow-sm flex justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Crunching numbers...</p>
          </div>
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

  const fmt = (n) => '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Your estimated return</h2>
        <p className="text-gray-500 mt-1">Based on the 2025 tax brackets (single filer)</p>
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
          <div className="flex justify-between">
            <span className="text-gray-500">Standard Deduction</span>
            <span className="font-semibold text-gray-900 tabular-nums">Not applicable</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-gray-100">
            <span className="text-gray-700 font-medium">Taxable Income</span>
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
              <span className="font-medium text-gray-900 tabular-nums">{fmt(b.amount)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-3 border-t border-gray-200 font-medium">
            <span className="text-gray-800">Total Federal Tax</span>
            <span className="text-gray-900 tabular-nums">{fmt(calc.totalTax)}</span>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Withholding Summary</h3>
        </div>
        <div className="px-6 py-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-500">Federal Withheld</span>
            <span className="font-medium text-gray-900 tabular-nums">{fmt(calc.federalWithheld)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">State Withheld</span>
            <span className="font-medium text-gray-900 tabular-nums">{fmt(calc.stateWithheld)}</span>
          </div>
          <div className="flex justify-between pt-3 border-t border-gray-200 font-medium">
            <span className="text-gray-800">Total Withheld</span>
            <span className="text-gray-900 tabular-nums">{fmt(calc.totalWithheld)}</span>
          </div>
        </div>

        <div className={`px-6 py-5 border-t-2 ${calc.isRefund ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
          <div className="flex justify-between items-center">
            <div>
              <span className={`text-lg font-bold ${calc.isRefund ? 'text-green-700' : 'text-red-700'}`}>
                {calc.isRefund ? 'Estimated Refund' : 'Amount Owed'}
              </span>
              <p className="text-xs text-gray-500 mt-0.5">
                {calc.isRefund ? 'Refund typically issued within 21 days' : 'Payment due upon filing'}
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
        className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-semibold text-base hover:bg-indigo-700 active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md"
      >
        Continue to File
      </button>
    </div>
  )
}
