import { useState, useEffect } from 'react'

function fmt(n) {
  return 'R ' + Math.abs(n).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function shortDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Dashboard({ onNewFiling }) {
  const [records, setRecords] = useState(() => {
    try { return JSON.parse(localStorage.getItem('filingHistory')) || [] } catch { return [] }
  })
  const [expanded, setExpanded] = useState(null)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    fetch('/api/history')
      .then((r) => r.json())
      .then((data) => { setRecords(data); localStorage.setItem('filingHistory', JSON.stringify(data)) })
      .catch(() => {})
  }, [])

  const toggle = (ref) => setExpanded(expanded === ref ? null : ref)

  const handleDelete = async (ref) => {
    setDeleting(ref)
    try {
      const res = await fetch(`/api/history/${ref}`, { method: 'DELETE' })
      if (res.ok) {
        const next = records.filter(r => r.referenceNumber !== ref)
        setRecords(next)
        localStorage.setItem('filingHistory', JSON.stringify(next))
        if (expanded === ref) setExpanded(null)
      }
    } catch {}
    setDeleting(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-gray-100">Filing History</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
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
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-12 text-center shadow-sm">
          <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">No filings have been submitted yet.</p>
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
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm"
          >
            <button
              onClick={() => toggle(r.referenceNumber)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 dark:text-gray-500 text-xs">Date</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{shortDate(r.filedAt)}</p>
                </div>
                <div className="hidden sm:block">
                  <p className="text-gray-400 dark:text-gray-500 text-xs">Employer</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{r.employerName || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-400 dark:text-gray-500 text-xs">Income</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100 tabular-nums">{fmt(r.income)}</p>
                </div>
                <div>
                  <p className="text-gray-400 dark:text-gray-500 text-xs">Outcome</p>
                  <p className={`font-semibold tabular-nums ${r.isRefund ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {r.isRefund ? '' : '-'}{fmt(r.refund)}
                  </p>
                </div>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0 ml-4 transition-transform ${
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
              <div className="px-5 pb-4 border-t border-gray-100 dark:border-gray-700">
                <div className="pt-4 grid grid-cols-2 gap-x-8 gap-y-2.5 text-sm">
                  <div>
                    <span className="text-gray-400 dark:text-gray-500">Reference</span>
                    <p className="font-mono font-medium text-gray-900 dark:text-gray-100 text-xs mt-0.5">{r.referenceNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-gray-500">Employer</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{r.employerName || '—'}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-gray-500">Gross Income</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100 tabular-nums">{fmt(r.income)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-gray-500">PAYE Withheld</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100 tabular-nums">{fmt(r.payeWithheld)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-gray-500">Gross Tax</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100 tabular-nums">{fmt(r.grossTax)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-gray-500">Primary Rebate</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100 tabular-nums">- {fmt(r.primaryRebate)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-gray-500">Tax After Rebate</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100 tabular-nums">{fmt(r.totalTax)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-gray-500">Net Result</span>
                    <p className={`font-semibold tabular-nums ${r.isRefund ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {r.isRefund ? 'Refund ' : 'Owing '}
                      {r.isRefund ? '' : '-'}{fmt(r.refund)}
                    </p>
                  </div>
                </div>

                {(r.breakdown || []).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Bracket Breakdown</p>
                    <div className="space-y-1.5">
                      {r.breakdown.map((b, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-gray-500 dark:text-gray-400">{b.label}</span>
                          <span className="text-gray-700 dark:text-gray-300 font-medium tabular-nums">{b.rate} &middot; {fmt(b.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                  <button
                    onClick={() => handleDelete(r.referenceNumber)}
                    disabled={deleting === r.referenceNumber}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {deleting === r.referenceNumber ? (
                      <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
