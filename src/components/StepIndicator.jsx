export default function StepIndicator({ currentStep, steps }) {
  const STEPS = steps || [
    { num: 1, label: 'Upload' },
    { num: 2, label: 'Extract' },
    { num: 3, label: 'Calculate' },
    { num: 4, label: 'File' },
  ]

  const items = Array.isArray(STEPS) && typeof STEPS[0] === 'string'
    ? STEPS.map((label, i) => ({ num: i + 1, label }))
    : STEPS
  return (
    <div className="flex items-center justify-center">
      {items.map((s, i) => {
        const isCompleted = currentStep > s.num
        const isCurrent = currentStep === s.num

        return (
          <div key={s.num} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  isCompleted
                    ? 'bg-blue-600 text-white'
                    : isCurrent
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  s.num
                )}
              </div>
              <span
                className={`mt-2 text-xs font-medium transition-colors ${
                  isCompleted || isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < items.length - 1 && (
              <div
                className={`w-12 sm:w-20 h-0.5 mx-3 mb-6 rounded transition-colors duration-300 ${
                  currentStep > s.num ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
