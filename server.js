import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { createRequire } from 'module'
import Tesseract from 'tesseract.js'
import OpenAI from 'openai'

const require = createRequire(import.meta.url)
const pdfParse = require('pdf-parse')

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json({ limit: '50mb' }))

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
})

const MOCK_EXTRACTED = {
  employerName: 'Acme Corp',
  employerEIN: 'XX-XXXXXXX',
  income: 85000.00,
  wagesSalary: 85000.00,
  federalTaxWithheld: 12750.00,
  stateTaxWithheld: 4250.00,
  socialSecurityWages: 85000.00,
  medicareWages: 85000.00,
  taxYear: 2025,
}

let uploadedFileInfo = null

const jobs = {}

function addStage(job, name) {
  job.stages.push({ name, status: 'active' })
}

function completeStage(job) {
  const s = job.stages[job.stages.length - 1]
  if (s) s.status = 'done'
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
        const { data } = await Tesseract.recognize(fileInfo.buffer, 'eng')
        rawText = (data.text || '').trim()
        completeStage(job)
      }
    } else if (isImage) {
      addStage(job, 'Running OCR on image')
      const { data } = await Tesseract.recognize(fileInfo.buffer, 'eng')
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
      } catch (err) {
        console.error('LLM structuring error:', err)
        result = { ...MOCK_EXTRACTED, _warning: 'AI structuring failed — default values shown. Please correct.' }
      }
      completeStage(job)
    } else if (!process.env.LLM_API_KEY) {
      result = { ...MOCK_EXTRACTED, _warning: 'LLM API key not configured (set LLM_API_KEY). Default values shown — please correct.' }
    } else if (rawText.length < 10) {
      result = { ...MOCK_EXTRACTED, _warning: 'Could not extract meaningful text from the document. Please fill in fields manually.' }
    } else {
      result = { ...MOCK_EXTRACTED, _warning: 'Extraction issue — default values shown. Please correct.' }
    }

    job.status = 'complete'
    job.result = result
  } catch (err) {
    console.error('Extraction pipeline error:', err)
    job.status = 'complete'
    job.result = { ...MOCK_EXTRACTED, _warning: 'Extraction encountered an error. Default values shown — please correct.' }
  }
}

function taxBrackets(income) {
  const brackets = [
    { limit: 11000, rate: 0.10, label: '10% on first $11,000' },
    { limit: 33725, rate: 0.12, label: '12% on $11,001 \u2013 $44,725' },
    { limit: 50650, rate: 0.22, label: '22% on $44,726 \u2013 $95,375' },
  ]
  let remaining = income
  let totalTax = 0
  const breakdown = []
  for (const b of brackets) {
    const applicable = Math.min(remaining, b.limit)
    if (applicable <= 0) break
    const tax = +(applicable * b.rate).toFixed(2)
    totalTax += tax
    remaining -= applicable
    breakdown.push({ label: b.label, amount: tax })
  }
  if (remaining > 0) {
    const tax = +(remaining * 0.24).toFixed(2)
    totalTax += tax
    breakdown.push({ label: '24% on remaining balance', amount: tax })
  }
  return { totalTax: +totalTax.toFixed(2), breakdown }
}

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' })
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
  const income = data.income || 85000
  const federalWithheld = data.federalTaxWithheld || 0
  const stateWithheld = data.stateTaxWithheld || 0
  const totalWithheld = federalWithheld + stateWithheld
  const { totalTax, breakdown } = taxBrackets(income)
  const refund = +(totalWithheld - totalTax).toFixed(2)
  res.json({
    income,
    federalWithheld,
    stateWithheld,
    totalWithheld,
    totalTax,
    refund,
    breakdown,
    isRefund: refund >= 0,
    isOwed: refund < 0,
  })
})

app.post('/api/file', (_req, res) => {
  const ref = 'TAX-' + Array.from({ length: 8 }, () =>
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]
  ).join('')
  setTimeout(() => {
    res.json({ success: true, referenceNumber: ref, filedAt: new Date().toISOString() })
  }, 2000)
})

app.listen(PORT, () => {
  console.log(`Tax API server running on http://localhost:${PORT}`)
})
