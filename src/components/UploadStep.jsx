import { useState, useRef, useCallback, useEffect } from 'react'

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png']
const MAX_SIZE = 10 * 1024 * 1024

export default function UploadStep({ onComplete }) {
  const [dragOver, setDragOver] = useState(false)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }
  }, [previewUrl])

  const validateFile = useCallback((f) => {
    const ext = '.' + f.name.split('.').pop().toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
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

  const handleFile = useCallback((f) => {
    validateFile(f)
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

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Upload failed')
      await res.json()
      onComplete()
    } catch {
      setError('Something went wrong. Please try again.')
      setUploading(false)
    }
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3 pt-4">
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
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${
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
          className="hidden"
          onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
        />

        {!file ? (
          <>
            <div className="mx-auto w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
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

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className={`w-full py-3.5 rounded-xl font-semibold text-base transition-all duration-200 ${
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
    </div>
  )
}
