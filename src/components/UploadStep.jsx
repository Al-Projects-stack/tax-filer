import { useState, useRef, useCallback, useEffect } from 'react'
import UploadSuccessPopup from './UploadSuccessPopup'

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png']
const MAX_SIZE = 10 * 1024 * 1024
const ACCEPT = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png'
const SAMPLE_URL = '/sample-irp5.pdf'

// Phone photos are often 4000px+ and several MB. Shrink them so they stay
// under the upload limit and OCR faster. Text stays sharp at 2400px.
const MAX_IMAGE_EDGE = 2400
const RESIZE_ABOVE_BYTES = 4 * 1024 * 1024

async function downscaleImage(f) {
  if (!f.type.startsWith('image/') || typeof createImageBitmap !== 'function') return f
  try {
    const bmp = await createImageBitmap(f)
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(bmp.width, bmp.height))
    if (scale === 1 && f.size <= RESIZE_ABOVE_BYTES) { bmp.close(); return f }
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bmp.width * scale)
    canvas.height = Math.round(bmp.height * scale)
    canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height)
    bmp.close()
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9))
    if (!blob) return f
    const name = f.name.replace(/\.[^.]+$/, '') + '.jpg'
    return new File([blob], name, { type: 'image/jpeg' })
  } catch {
    return f
  }
}

function useIsTouchDevice() {
  const [touch, setTouch] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia?.('(pointer: coarse)')
    if (!mq) return
    setTouch(mq.matches)
    const onChange = (e) => setTouch(e.matches)
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])
  return touch
}

export default function UploadStep({ onComplete, startWithSample = false }) {
  const [dragOver, setDragOver] = useState(false)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [loadingSample, setLoadingSample] = useState(false)
  const [error, setError] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [showPopup, setShowPopup] = useState(false)
  const [uploadedId, setUploadedId] = useState(null)
  const inputRef = useRef(null)
  const cameraRef = useRef(null)
  const sampleStarted = useRef(false)
  const isTouch = useIsTouchDevice()

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }
  }, [previewUrl])

  const validateFile = useCallback((f) => {
    const ext = '.' + f.name.split('.').pop().toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext) || (f.type && !ALLOWED_TYPES.includes(f.type))) {
      setError('This file type is not supported. Please upload a PDF, JPG, or PNG document.')
      setFile(null)
      return false
    }
    if (f.size > MAX_SIZE) {
      setError('File is too large. Maximum size is 10 MB.')
      setFile(null)
      return false
    }
    setError(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(f))
    setFile(f)
    return true
  }, [previewUrl])

  const handleFile = useCallback(async (f) => {
    const prepared = await downscaleImage(f)
    return validateFile(prepared) ? prepared : null
  }, [validateFile])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }
  const handleDragLeave = () => setDragOver(false)

  const handleUpload = async (f = file) => {
    if (!f) return
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', f)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json.uploadId) {
        throw new Error(json.error || 'Upload failed')
      }
      setUploadedId(json.uploadId)
      setUploading(false)
      setShowPopup(true)
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.')
      setUploading(false)
    }
  }

  // Fetch the bundled fictional IRP5 and treat it like a user-picked file.
  // With autoUpload (coming from the landing page) it goes straight through.
  const loadSample = async (autoUpload = false) => {
    setLoadingSample(true)
    setError(null)
    try {
      const res = await fetch(SAMPLE_URL)
      if (!res.ok) throw new Error('missing')
      const blob = await res.blob()
      const sample = new File([blob], 'sample-irp5.pdf', { type: 'application/pdf' })
      const accepted = await handleFile(sample)
      if (accepted && autoUpload) await handleUpload(accepted)
    } catch {
      setError('Could not load the sample document. Please upload your own file instead.')
    }
    setLoadingSample(false)
  }

  useEffect(() => {
    if (startWithSample && !sampleStarted.current) {
      sampleStarted.current = true
      loadSample(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startWithSample])

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3 pt-4 anim-fade-up">
        <h1 className="text-4xl sm:text-5xl font-heading font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          Return
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
          Upload your tax document and we will handle the rest.
        </p>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        style={{ animationDelay: '90ms' }}
        className={`anim-fade-up relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${
          dragOver
            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 scale-[1.01]'
            : file
            ? 'border-blue-300 dark:border-blue-600 bg-blue-50/30 dark:bg-blue-900/10'
            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50/50 dark:hover:bg-gray-800/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => { const f = e.target.files[0]; e.target.value = ''; if (f) handleFile(f) }}
        />

        {!file ? (
          <>
            <div className="anim-float mx-auto w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <svg className="w-7 h-7 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <p className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-200">Drag &amp; drop your file here</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">or click to browse</p>
            <p className="text-xs text-gray-300 dark:text-gray-600 mt-3">PDF &middot; JPG &middot; PNG</p>
          </>
        ) : (
          <div className="space-y-4">
            {previewUrl && file.type.startsWith('image/') && (
              <img src={previewUrl} alt="Preview" className="max-h-48 mx-auto rounded-lg object-contain bg-black/5 dark:bg-white/5" />
            )}
            {previewUrl && file.type === 'application/pdf' && (
              <iframe src={previewUrl} title="PDF preview" className="w-full h-48 mx-auto rounded-lg bg-gray-100 dark:bg-gray-800" />
            )}
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-gray-100">{file.name}</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">{formatSize(file.size)}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); setFile(null); setError(null) }}
                className="ml-2 p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => { const f = e.target.files[0]; e.target.value = ''; if (f) handleFile(f) }}
      />

      {!file && (
        <div className="anim-fade-up flex flex-col sm:flex-row items-center justify-center gap-3 -mt-2" style={{ animationDelay: '135ms' }}>
          {isTouch && (
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="press w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
              Take a photo
            </button>
          )}
          <button
            type="button"
            onClick={() => loadSample(false)}
            disabled={loadingSample}
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50 transition-colors"
          >
            {loadingSample ? 'Loading sample...' : 'No document? Use a sample IRP5'}
          </button>
        </div>
      )}

      {error && (
        <div key={error} role="alert" className="anim-shake bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <button
        onClick={() => handleUpload()}
        disabled={!file || uploading}
        style={{ animationDelay: '180ms' }}
        className={`press anim-fade-up w-full py-3.5 rounded-xl font-semibold text-base transition-all duration-200 ${
          !file || uploading
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-sm'
        }`}
      >
        {uploading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Uploading...
          </span>
        ) : (
          'Upload'
        )}
      </button>

      {showPopup && file && (
        <UploadSuccessPopup
          fileName={file.name}
          fileSize={formatSize(file.size)}
          onContinue={() => { setShowPopup(false); onComplete(uploadedId) }}
        />
      )}
    </div>
  )
}
