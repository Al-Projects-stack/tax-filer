import { useState } from 'react'
import StepIndicator from './components/StepIndicator'
import UploadStep from './components/UploadStep'
import ExtractStep from './components/ExtractStep'
import CalculateStep from './components/CalculateStep'
import FileStep from './components/FileStep'

export default function App() {
  const [step, setStep] = useState(1)
  const [extractedData, setExtractedData] = useState(null)
  const [calculation, setCalculation] = useState(null)
  const [referenceNumber, setReferenceNumber] = useState(null)
  const [filingStatus, setFilingStatus] = useState(null)

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
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">Taxes That File Themselves</h1>
              <p className="text-sm text-gray-400">AI-powered filing &middot; Demo</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-24">
        <StepIndicator currentStep={step} />

        <div className="mt-8">
          {step === 1 && <UploadStep onComplete={handleUploaded} />}
          {step === 2 && <ExtractStep onComplete={handleExtracted} />}
          {step === 3 && extractedData && (
            <CalculateStep data={extractedData} onComplete={handleCalculated} />
          )}
          {step === 4 && calculation && (
            <FileStep
              calculation={calculation}
              onComplete={handleFiled}
              onReset={handleReset}
            />
          )}
        </div>
      </main>

      {step <= 4 && (
        <footer className="fixed bottom-0 inset-x-0 bg-white/80 backdrop-blur-sm border-t border-gray-100 py-3">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center text-xs text-gray-400">
            Demo MVP &middot; No real tax filing &middot; Not financial advice
          </div>
        </footer>
      )}
    </div>
  )
}
