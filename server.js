import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { createRequire } from 'module'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import TesseractWorker from 'tesseract.js'
import OpenAI from 'openai'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const DATA_DIR = join(__dirname, 'data')
const HISTORY_FILE = join(DATA_DIR, 'history.json')

function loadHistory() {
  try {
    if (existsSync(HISTORY_FILE)) {
      return JSON.parse(readFileSync(HISTORY_FILE, 'utf-8'))
    }
  } catch {}
  return []
}

function saveHistory(history) {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
    writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8')
  } catch {}
}

const require = createRequire(import.meta.url)
const pdfParse = require('pdf-parse')

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json({ limit: '10mb' }))

const ALLOWED_MIMES = ['application/pdf', 'image/jpeg', 'image/png']
const MAX_FILE_SIZE = 10 * 1024 * 1024

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only PDF, JPG, and PNG files are accepted.'))
    }
  },
})

const MOCK_EXTRACTED = {
  employerName: 'Acme Corp',
  employerEIN: 'XX-XXXXXXX',
  income: 450000.00,
  wagesSalary: 450000.00,
  federalTaxWithheld: 85000.00,
  stateTaxWithheld: 0,
  socialSecurityWages: 450000.00,
  medicareWages: 450000.00,
  taxYear: 2025,
}

let uploadedFileInfo = null
const jobs = {}
const filingHistory = loadHistory()

function addStage(job, name) {
  job.stages.push({ name, status: 'active' })
}

function completeStage(job) {
  const s = job.stages[job.stages.length - 1]
  if (s) s.status = 'done'
}

function parseWithRegex(rawText) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean)
  const full = rawText

  const numbers = [...full.matchAll(/[Rr$]\s*([\d,]+\.?\d*)|(\d{3,}[,\d]*\.?\d*)/g)]
    .map(m => parseFloat((m[1] || m[2]).replace(/,/g, '')))
    .filter(n => !isNaN(n) && n > 0)

  const incomeCandidates = numbers.filter(n => n >= 10000 && n <= 9999999)
  const income = incomeCandidates.length > 0 ? Math.max(...incomeCandidates) : 0

  const taxCandidates = numbers.filter(n => n >= 1000 && n <= income && n < income * 0.6)
  const tax = taxCandidates.length > 0 ? Math.max(...taxCandidates) : 0

  let employerName = ''
  for (const line of lines) {
    if (/employer|company|pty\s*ltd|\(pty\)|inc\.?|corp\.?|llc/i.test(line) && line.length < 100) {
      employerName = line.replace(/employer\s*:?\s*/i, '').trim()
      break
    }
  }
  if (!employerName) {
    for (const line of lines) {
      if (/^[A-Z][a-z]+.*(?:ltd|inc|corp|pty|cc)$/i.test(line) && line.length < 80) {
        employerName = line.trim()
        break
      }
    }
  }
  if (!employerName && lines.length > 0) {
    const nonEmpty = lines.filter(l => l.length > 3 && !/^\d/.test(l))
    employerName = nonEmpty[0] || ''
  }

  const yearMatch = full.match(/\b(20\d{2})\b/)
  const taxYear = yearMatch ? parseInt(yearMatch[1]) : 2025

  return {
    employerName,
    employerEIN: '',
    taxYear,
    income,
    wagesSalary: income,
    federalTaxWithheld: tax,
    stateTaxWithheld: 0,
    socialSecurityWages: income,
    medicareWages: income,
  }
}

function mergeWithFallback(extracted) {
  return {
    employerName: typeof extracted.employerName === 'string' ? extracted.employerName : MOCK_EXTRACTED.employerName,
    employerEIN: typeof extracted.employerEIN === 'string' ? extracted.employerEIN : MOCK_EXTRACTED.employerEIN,
    taxYear: typeof extracted.taxYear === 'number' ? extracted.taxYear : MOCK_EXTRACTED.taxYear,
    income: typeof extracted.income === 'number' ? extracted.income : MOCK_EXTRACTED.income,
    wagesSalary: typeof extracted.wagesSalary === 'number' ? extracted.wagesSalary : (typeof extracted.income === 'number' ? extracted.income : MOCK_EXTRACTED.income),
    federalTaxWithheld: typeof extracted.federalTaxWithheld === 'number' ? extracted.federalTaxWithheld : MOCK_EXTRACTED.federalTaxWithheld,
    stateTaxWithheld: typeof extracted.stateTaxWithheld === 'number' ? extracted.stateTaxWithheld : MOCK_EXTRACTED.stateTaxWithheld,
    socialSecurityWages: typeof extracted.socialSecurityWages === 'number' ? extracted.socialSecurityWages : MOCK_EXTRACTED.socialSecurityWages,
    medicareWages: typeof extracted.medicareWages === 'number' ? extracted.medicareWages : MOCK_EXTRACTED.medicareWages,
  }
}

async function structureWithLLM(rawText) {
  const openai = new OpenAI({
    apiKey: process.env.LLM_API_KEY,
    baseURL: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
  })
  const model = process.env.LLM_MODEL || 'gpt-4o-mini'

  const prompt = `Extract tax document (W-2) fields from the raw text below. Return ONLY valid JSON with these exact fields:
{
  "employerName": "string",
  "employerEIN": "string",
  "taxYear": number,
  "income": number,
  "federalTaxWithheld": number,
  "stateTaxWithheld": number,
  "socialSecurityWages": number,
  "medicareWages": number
}

Rules:
- Numbers must be plain numbers — no formatting, no dollar signs, no commas
- Use 0 for any numeric field not found in the text
- Use "" for any string field not found
- Do NOT include markdown fences, explanations, or anything other than the JSON object

Raw text:
${rawText}`

  const completion = await openai.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.05,
  })

  let content = completion.choices[0].message.content
  if (content.includes('```')) {
    content = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
  }
  return JSON.parse(content)
}

async function processExtraction(jobId) {
  const job = jobs[jobId]
  const fileInfo = job.fileInfo

  if (!fileInfo || !fileInfo.buffer) {
    job.status = 'error'
    job.error = 'No file available for extraction'
    return
  }

  try {
    let rawText = ''
    const isPdf = fileInfo.mimetype === 'application/pdf'
    const isImage = fileInfo.mimetype.startsWith('image/')

    if (isPdf) {
      addStage(job, 'Reading PDF document')
      const pdfData = await pdfParse(fileInfo.buffer)
      rawText = (pdfData.text || '').trim()
      completeStage(job)

      if (rawText.length < 50) {
        addStage(job, 'Running OCR on scanned document')
        const worker = await TesseractWorker.createWorker('eng')
        const { data } = await worker.recognize(fileInfo.buffer)
        await worker.terminate()
        rawText = (data.text || '').trim()
        completeStage(job)
      }
    } else if (isImage) {
      addStage(job, 'Running OCR on image')
      const worker = await TesseractWorker.createWorker('eng')
      const { data } = await worker.recognize(fileInfo.buffer)
      await worker.terminate()
      rawText = (data.text || '').trim()
      completeStage(job)
    } else {
      addStage(job, 'Reading file')
      completeStage(job)
    }

    let result
    const llmAvailable = process.env.LLM_API_KEY && rawText.length >= 10

    if (llmAvailable) {
      addStage(job, 'Structuring data with AI')
      try {
        const extracted = await structureWithLLM(rawText)
        result = mergeWithFallback(extracted)
      } catch {
        result = { ...MOCK_EXTRACTED, _warning: 'AI structuring failed. Default values shown.' }
      }
      completeStage(job)
    } else if (!process.env.LLM_API_KEY) {
      if (rawText.length >= 10) {
        addStage(job, 'Parsing extracted text')
        const parsed = parseWithRegex(rawText)
        completeStage(job)
        result = mergeWithFallback(parsed)
        if (!result.income) {
          result._warning = 'Could not find income figures in the document. Please fill in fields manually.'
        }
      } else {
        result = { ...MOCK_EXTRACTED, _warning: 'Could not read any text from the document. Please fill in fields manually.' }
      }
    } else if (rawText.length < 10) {
      result = { ...MOCK_EXTRACTED, _warning: 'Could not extract meaningful text. Please fill in fields manually.' }
    } else {
      result = { ...MOCK_EXTRACTED, _warning: 'Default values shown.' }
    }

    job.status = 'complete'
    job.result = result
  } catch (err) {
    console.error('Extraction failed:', err)
    job.status = 'complete'
    job.result = { ...MOCK_EXTRACTED, _warning: 'Extraction encountered an error. Default values shown.' }
  }
}

function calculateSA(income, payeWithheld) {
  const brackets = [
    { from: 0, to: 237100, rate: 0.18 },
    { from: 237101, to: 370500, rate: 0.26 },
    { from: 370501, to: 512800, rate: 0.31 },
    { from: 512801, to: 673000, rate: 0.36 },
    { from: 673001, to: 857900, rate: 0.39 },
    { from: 857901, to: 1817000, rate: 0.41 },
    { from: 1817001, to: Infinity, rate: 0.45 },
  ]

  let grossTax = 0
  const breakdown = []

  for (const b of brackets) {
    if (income <= b.from) break
    const taxableInBracket = Math.min(income, b.to) - b.from
    const taxAmount = +(taxableInBracket * b.rate).toFixed(2)
    grossTax += taxAmount
    breakdown.push({
      label: `R ${b.from.toLocaleString('en-ZA')} – R ${b.to === Infinity ? '+' : b.to.toLocaleString('en-ZA')}`,
      rate: `${(b.rate * 100).toFixed(0)}%`,
      amount: taxAmount,
      taxable: taxableInBracket,
    })
  }

  grossTax = +grossTax.toFixed(2)
  const primaryRebate = 17235
  const taxAfterRebate = +Math.max(0, grossTax - primaryRebate).toFixed(2)
  const refund = +(payeWithheld - taxAfterRebate).toFixed(2)

  return {
    income,
    payeWithheld,
    totalWithheld: payeWithheld,
    totalTax: taxAfterRebate,
    grossTax,
    primaryRebate,
    refund,
    breakdown,
    isRefund: refund >= 0,
    isOwed: refund < 0,
    currency: 'ZAR',
    taxYear: '2025/2026',
  }
}

app.post('/api/upload', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File is too large. Maximum size is 10 MB.' })
    }
    if (err) {
      return res.status(400).json({ error: err.message || 'Upload failed.' })
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided.' })
    }

    uploadedFileInfo = {
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      buffer: req.file.buffer,
    }
    res.json({
      success: true,
      file: {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
    })
  })
})

app.post('/api/extract', (req, res) => {
  if (!uploadedFileInfo || !uploadedFileInfo.buffer) {
    return res.status(400).json({ error: 'No file has been uploaded yet' })
  }

  const jobId = Date.now().toString(36) + Math.random().toString(36).substring(2, 7)

  jobs[jobId] = {
    status: 'processing',
    stages: [],
    result: null,
    error: null,
    fileInfo: {
      ...uploadedFileInfo,
      buffer: Buffer.from(uploadedFileInfo.buffer),
    },
  }

  processExtraction(jobId)

  res.json({ jobId })
})

app.get('/api/extract/:jobId', (req, res) => {
  const job = jobs[req.params.jobId]
  if (!job) return res.status(404).json({ error: 'Job not found' })
  res.json({
    status: job.status,
    stages: job.stages,
    result: job.result,
    error: job.error,
  })
})

app.post('/api/calculate', (req, res) => {
  const data = req.body
  const income = data.income || 450000
  const paye = data.federalTaxWithheld || 0
  res.json(calculateSA(income, paye))
})

app.post('/api/file', (req, res) => {
  const ref = 'TAX-' + Array.from({ length: 8 }, () =>
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]
  ).join('')
  const calc = req.body.calculation || {}

  const record = {
    referenceNumber: ref,
    filedAt: new Date().toISOString(),
    employerName: req.body.employerName || '',
    income: calc.income || 0,
    totalTax: calc.totalTax || 0,
    payeWithheld: calc.payeWithheld || 0,
    refund: calc.refund || 0,
    isRefund: calc.isRefund ?? true,
    breakdown: calc.breakdown || [],
    grossTax: calc.grossTax || 0,
    primaryRebate: calc.primaryRebate || 0,
  }

  filingHistory.unshift(record)
  saveHistory(filingHistory)

  res.json({ success: true, referenceNumber: ref, filedAt: record.filedAt })
})

app.get('/api/history', (_req, res) => {
  res.json(filingHistory)
})

app.delete('/api/history/:referenceNumber', (req, res) => {
  const { referenceNumber } = req.params
  const index = filingHistory.findIndex(r => r.referenceNumber === referenceNumber)
  if (index === -1) {
    return res.status(404).json({ error: 'Filing not found' })
  }
  filingHistory.splice(index, 1)
  saveHistory(filingHistory)
  res.json({ success: true })
})

app.post('/api/receipt', async (req, res) => {
  try {
    const d = req.body
    const fmt = (n) => 'R ' + Math.abs(n).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

    const pdfDoc = await PDFDocument.create()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const mono = await pdfDoc.embedFont(StandardFonts.Courier)
    const page = pdfDoc.addPage([595.28, 841.89])
    const pw = 595.28
    let y = 800

    const section = (title) => {
      y -= 6
      page.drawLine({ start: { x: 50, y }, end: { x: pw - 50, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) })
      y -= 14
      page.drawText(title, { x: 50, y, size: 10, font: bold, color: rgb(0.4, 0.4, 0.4) })
      y -= 8
    }
    const row = (label, value) => {
      page.drawText(label, { x: 50, y, size: 10, font: font, color: rgb(0.3, 0.3, 0.3) })
      page.drawText(String(value), { x: 320, y, size: 10, font: bold, color: rgb(0.1, 0.1, 0.1) })
      y -= 16
    }

    page.drawText('RETURN', { x: 50, y, size: 22, font: bold, color: rgb(0.15, 0.3, 0.9) })
    y -= 8
    page.drawText('Tax Filing Summary', { x: 50, y, size: 11, font: font, color: rgb(0.5, 0.5, 0.5) })
    y -= 18
    page.drawText(`Reference: ${d.referenceNumber || '—'}`, { x: 50, y, size: 9, font: mono, color: rgb(0.4, 0.4, 0.4) })
    y -= 14
    page.drawText(`Filed: ${d.filedAt ? new Date(d.filedAt).toLocaleDateString('en-ZA') : '—'}`, { x: 50, y, size: 9, font: font, color: rgb(0.4, 0.4, 0.4) })

    y -= 24
    section('Taxpayer')
    row('Employer', d.employerName || '—')
    row('Tax Year', d.taxYear || '2025/2026')

    y -= 8
    section('Income & Tax')
    row('Gross Income', fmt(d.income || 0))
    row('PAYE Withheld', fmt(d.payeWithheld || 0))

    y -= 8
    section('Bracket Breakdown')
    const brk = d.breakdown || []
    for (const b of brk) {
      page.drawText(b.label || '', { x: 50, y, size: 9, font: font, color: rgb(0.3, 0.3, 0.3) })
      page.drawText(b.rate || '', { x: 320, y, size: 9, font: font, color: rgb(0.5, 0.5, 0.5) })
      page.drawText(fmt(b.amount || 0), { x: 420, y, size: 9, font: font, color: rgb(0.1, 0.1, 0.1) })
      y -= 14
    }
    row('Gross Tax Liability', fmt(d.grossTax || 0))
    row('Primary Rebate', '- ' + fmt(d.primaryRebate || 0))
    row('Tax After Rebate', fmt(d.totalTax || 0))

    y -= 8
    section('Result')
    const isRefund = d.isRefund ?? true
    const resultColor = isRefund ? rgb(0.15, 0.6, 0.2) : rgb(0.8, 0.15, 0.15)
    page.drawText(isRefund ? 'Estimated Refund' : 'Amount Owing', { x: 50, y, size: 12, font: bold, color: rgb(0.2, 0.2, 0.2) })
    page.drawText((isRefund ? '' : '-') + fmt(d.refund || 0), { x: 320, y, size: 14, font: bold, color: resultColor })

    y -= 40
    page.drawText('This is a computer-generated summary. No signature required.', { x: 50, y, size: 8, font: font, color: rgb(0.6, 0.6, 0.6) })

    const pdfBytes = await pdfDoc.save()
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="return-${d.referenceNumber || 'receipt'}.pdf"`,
    })
    res.send(Buffer.from(pdfBytes))
  } catch (err) {
    console.error('PDF generation error:', err)
    res.status(500).json({ error: 'Could not generate receipt.' })
  }
})

app.listen(PORT, () => {
  console.log(`Tax API server running on http://localhost:${PORT}`)
})
