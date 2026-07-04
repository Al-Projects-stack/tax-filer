import { useState, useEffect } from 'react'

function fmt(n) {
  return 'R ' + Math.abs(n).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function shortDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', yyyy: 'numeric' })
}

export default function Dashboard({ onNewFiling }) {
  const [records, setRecords] = useState([])
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    fetch('/api/history')
      .then((r) => r.json())
      .then(setRecords)
      .catch(() => {})
  }, [])

  const toggle = (ref) => setExpanded(expanded === ref ? null : ref)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold text-gray-900">Filing History</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {records.length === 0
              ? 'No filings yet'
              : `${records.length} filing${records.length === 1 ? '' : 's'} on record`}
          </p>
        </div>
        <button
          onClick={onNewFiling}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          New Filing
        </button>
      </div>

      {records.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="mt-4 text-gray-500">No filings have been submitted yet.</p>
          <button
            onClick={onNewFiling}
            className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Submit Your First Return
          </button>
        </div>
      )}

      <div className="space-y-3">
        {records.map((r) => (
          <div
            key={r.referenceNumber}
            className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
          >
            <button
              onClick={() => toggle(r.referenceNumber)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 text-xs">Date</p>
                  <p className="font-medium text-gray-900">{shortDate(r.filedAt)}</p>
                </div>
                <div className="hidden sm:block">
                  <p className="text-gray-400 text-xs">Employer</p>
                  <p className="font-medium text-gray-900 truncate">{r.employerName || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Income</p>
                  <p className="font-medium text-gray-900 tabular-nums">{fmt(r.income)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Outcome</p>
                  <p className={`font-semibold tabular-nums ${r.isRefund ? 'text-green-600' : 'text-red-600'}`}>
                    {r.isRefund ? '' : '-'}{fmt(r.refund)}
                  </p>
                </div>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 flex-shrink-0 ml-4 transition-transform ${
                  expanded === r.referenceNumber ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {expanded === r.referenceNumber && (
              <div className="px-5 pb-4 border-t border-gray-100">
                <div className="pt-4 grid grid-cols-2 gap-x-8 gap-y-2.5 text-sm">
                  <div>
                    <span className="text-gray-400">Reference</span>
                    <p className="font-mono font-medium text-gray-900 text-xs mt-0.5">{r.referenceNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Employer</span>
                    <p className="font-medium text-gray-900">{r.employerName || '—'}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Gross Income</span>
                    <p className="font-medium text-gray-900 tabular-nums">{fmt(r.income)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">PAYE Withheld</span>
                    <p className="font-medium text-gray-900 tabular-nums">{fmt(r.payeWithheld)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Gross Tax</span>
                    <p className="font-medium text-gray-900 tabular-nums">{fmt(r.grossTax)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Primary Rebate</span>
                    <p className="font-medium text-gray-900 tabular-nums">- {fmt(r.primaryRebate)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Tax After Rebate</span>
                    <p className="font-medium text-gray-900 tabular-nums">{fmt(r.totalTax)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Net Result</span>
                    <p className={`font-semibold tabular-nums ${r.isRefund ? 'text-green-600' : 'text-red-600'}`}>
                      {r.isRefund ? 'Refund ' : 'Owing '}
                      {r.isRefund ? '' : '-'}{fmt(r.refund)}
                    </p>
                  </div>
                </div>

                {(r.breakdown || []).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Bracket Breakdown</p>
                    <div className="space-y-1.5">
                      {r.breakdown.map((b, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-gray-500">{b.label}</span>
                          <span className="text-gray-700 font-medium tabular-nums">{b.rate} &middot; {fmt(b.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
