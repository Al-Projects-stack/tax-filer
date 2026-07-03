import { useState } from 'react'

export default function FileStep({ calculation, onComplete, onReset }) {
  const [status, setStatus] = useState('confirm')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [filedAt, setFiledAt] = useState('')

  const fmt = (n) => '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const handleSubmit = async () => {
    setStatus('submitting')
    try {
      const res = await fetch('/api/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calculation }),
      })
      const json = await res.json()
      setReferenceNumber(json.referenceNumber)
      setFiledAt(json.filedAt)
      onComplete(json.referenceNumber, json.filedAt)
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'confirm') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Ready to file</h2>
          <p className="text-gray-500 mt-1">Review your filing summary before submitting</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Tax Year</span>
            <span className="font-medium text-gray-900">2025</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Filing Status</span>
            <span className="font-medium text-gray-900">Single</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total Income</span>
            <span className="font-medium text-gray-900 tabular-nums">{fmt(calculation.income)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total Tax</span>
            <span className="font-medium text-gray-900 tabular-nums">{fmt(calculation.totalTax)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total Withheld</span>
            <span className="font-medium text-gray-900 tabular-nums">{fmt(calculation.totalWithheld)}</span>
          </div>
          <div className={`flex justify-between text-sm pt-3 border-t ${calculation.isRefund ? 'border-green-200' : 'border-red-200'}`}>
            <span className={`font-semibold ${calculation.isRefund ? 'text-green-700' : 'text-red-700'}`}>
              {calculation.isRefund ? 'Estimated Refund' : 'Amount Owed'}
            </span>
            <span className={`font-bold tabular-nums ${calculation.isRefund ? 'text-green-600' : 'text-red-600'}`}>
              {calculation.isRefund ? '' : '-'}{fmt(calculation.refund)}
            </span>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-semibold text-base hover:bg-indigo-700 active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md"
        >
          Submit Return
        </button>
      </div>
    )
  }

  if (status === 'submitting') {
    return (
      <div className="text-center py-12">
        <div className="relative inline-flex">
          <div className="w-20 h-20 border-4 border-indigo-100 rounded-full" />
          <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-indigo-600 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-9 h-9 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mt-6">Submitting your return</h3>
        <p className="text-gray-500 mt-2">Transmitting to IRS secure gateway...</p>
        <div className="mt-8 max-w-xs mx-auto">
          <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-indigo-600 h-1.5 rounded-full animate-pulse" style={{ width: '65%' }} />
          </div>
          <p className="text-xs text-gray-400 mt-2">Establishing secure connection</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mt-4">Submission failed</h3>
        <p className="text-gray-500 mt-1">Please try again.</p>
        <button
          onClick={() => setStatus('confirm')}
          className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8 text-center py-6">
      <div className="relative">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="absolute -top-1 -right-1 sm:right-20 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Return Filed Successfully!</h2>
        <p className="text-gray-500 mt-2">Your 2025 tax return has been accepted.</p>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 inline-block mx-auto shadow-sm">
        <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Reference Number</p>
        <p className="text-2xl font-mono font-bold text-gray-900 mt-1 tracking-wide">
          {referenceNumber}
        </p>
        <p className="text-xs text-gray-400 mt-2">
          {filedAt ? new Date(filedAt).toLocaleString() : ''}
        </p>
      </div>

      <div className={`bg-white border rounded-2xl p-6 shadow-sm max-w-sm mx-auto ${calculation.isRefund ? 'border-green-200' : 'border-red-200'}`}>
        <p className={`text-sm font-medium ${calculation.isRefund ? 'text-green-700' : 'text-red-700'}`}>
          {calculation.isRefund ? 'Your refund' : 'Amount to pay'}
        </p>
        <p className={`text-3xl font-extrabold tabular-nums mt-1 ${calculation.isRefund ? 'text-green-600' : 'text-red-600'}`}>
          {calculation.isRefund ? '' : '-'}{fmt(calculation.refund)}
        </p>
        <p className="text-xs text-gray-400 mt-2">
          {calculation.isRefund
            ? 'Expected to arrive within 21 days via direct deposit'
            : 'Payment instructions have been sent'}
        </p>
      </div>

      <button
        onClick={onReset}
        className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        File Another Return
      </button>
    </div>
  )
}
