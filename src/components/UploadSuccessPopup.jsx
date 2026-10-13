export default function UploadSuccessPopup({ fileName, fileSize, onContinue }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm anim-fade-in" />

      <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center anim-pop-in">
        <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center anim-float">
          <svg className="check-draw w-10 h-10" fill="none" viewBox="0 0 24 24" strokeWidth={2.5}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" className="text-green-200 dark:text-green-800" strokeWidth={2} />
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12.5l2.5 2.5L16 9.5" className="text-green-600 dark:text-green-400" />
          </svg>
        </div>

        <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-gray-100 mt-5">
          Well done for uploading!
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
          Your document is safe with us. Let's pull out the numbers.
        </p>

        <div className="mt-5 inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-full px-4 py-1.5 max-w-full">
          <svg className="w-4 h-4 text-blue-500 dark:text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-xs font-medium text-blue-700 dark:text-blue-300 truncate">{fileName}</span>
          <span className="text-xs text-blue-400 dark:text-blue-500 tabular-nums flex-shrink-0">{fileSize}</span>
        </div>

        <button
          onClick={onContinue}
          className="press mt-6 w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold text-base hover:bg-blue-700 active:scale-[0.98] transition-all duration-200 shadow-sm"
        >
          Start Extraction
        </button>
      </div>
    </div>
  )
}
