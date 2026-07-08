import { useState, useEffect } from 'react'
import StepIndicator from './components/StepIndicator'
import UploadStep from './components/UploadStep'
import ExtractStep from './components/ExtractStep'
import CalculateStep from './components/CalculateStep'
import FileStep from './components/FileStep'
import Dashboard from './components/Dashboard'

function useDarkMode() {
  const [dark, setDark] = useState(() => localStorage.getItem('darkMode') === 'true')
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('darkMode', dark)
  }, [dark])
  return [dark, () => setDark(d => !d)]
}

export default function App() {
  const [step, setStep] = useState(1)
  const [view, setView] = useState('flow') // 'flow' | 'history'
  const [extractedData, setExtractedData] = useState(null)
  const [calculation, setCalculation] = useState(null)
  const [referenceNumber, setReferenceNumber] = useState(null)
  const [filingStatus, setFilingStatus] = useState(null)
  const [dark, toggleDark] = useDarkMode()

  const handleUploaded = () => setStep(2)

  const handleExtracted = (data) => {
    setExtractedData(data)
    setStep(3)
  }

  const handleCalculated = (calc) => {
    setCalculation(calc)
    setStep(4)
  }

  const handleFiled = (ref, status) => {
    setReferenceNumber(ref)
    setFilingStatus(status)
  }

  const handleReset = () => {
    setStep(1)
    setExtractedData(null)
    setCalculation(null)
    setReferenceNumber(null)
    setFilingStatus(null)
    setView('flow')
  }

  const steps = ['Upload', 'Extract', 'Calculate', 'File']

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-10 transition-colors">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-lg font-heading font-semibold text-gray-900 dark:text-gray-100">Return</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleDark}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Toggle dark mode"
            >
              {dark ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {step === 4 && (
              <button
                onClick={() => setView(view === 'history' ? 'flow' : 'history')}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
              >
                {view === 'history' ? 'Close History' : 'Filing History'}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-24">
        {view === 'history' ? (
          <Dashboard onNewFiling={handleReset} />
        ) : (
          <>
            <StepIndicator currentStep={step} steps={steps} />

            <div className="mt-8">
              {step === 1 && <UploadStep onComplete={handleUploaded} />}
              {step === 2 && <ExtractStep onComplete={handleExtracted} onBack={() => setStep(1)} />}
              {step === 3 && extractedData && (
                <CalculateStep data={extractedData} onComplete={handleCalculated} />
              )}
              {step === 4 && calculation && (
                <FileStep
                  calculation={calculation}
                  extractedData={extractedData}
                  onComplete={handleFiled}
                  onReset={handleReset}
                  onViewHistory={() => setView('history')}
                />
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
