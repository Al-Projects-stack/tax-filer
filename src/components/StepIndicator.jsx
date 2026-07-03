const STEPS = [
  { num: 1, label: 'Upload' },
  { num: 2, label: 'Extract' },
  { num: 3, label: 'Calculate' },
  { num: 4, label: 'File' },
]

export default function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center justify-center">
      {STEPS.map((s, i) => {
        const isCompleted = currentStep > s.num
        const isCurrent = currentStep === s.num

        return (
          <div key={s.num} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  isCompleted
                    ? 'bg-indigo-600 text-white'
                    : isCurrent
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                    : 'bg-gray-100 text-gray-400'
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
                  isCompleted || isCurrent ? 'text-indigo-600' : 'text-gray-400'
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`w-12 sm:w-20 h-0.5 mx-3 mb-6 rounded transition-colors duration-300 ${
                  currentStep > s.num ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
