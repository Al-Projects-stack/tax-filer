# Taxes That File Themselves

AI-powered tax filing MVP demo. Upload a tax document, extract data, calculate your return, and file — all in one flow.

## How it works

| Step | What happens |
|---|---|
| **Upload** | Drag-and-drop or browse to upload a PDF or image of your tax document |
| **Extract** | Reads the file — text PDFs parsed directly, scanned docs/images processed via OCR — then sends the raw text to an LLM (OpenAI-compatible) to extract structured fields. Results appear in an editable form so you can fix anything the parser got wrong |
| **Calculate** | Runs the extracted income through 2025 progressive tax brackets (10/12/22/24%) and shows a full breakdown with refund or amount owed |
| **File** | Review the summary, click submit, and get a confirmation with a fake reference number |

## Features

- Real PDF text extraction via `pdf-parse`
- OCR fallback via `tesseract.js` for scanned documents and images
- LLM-powered field extraction (OpenAI-compatible — configure via `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL`)
- Editable form to review and correct extracted data before calculation
- Live progress display during extraction (reading → OCR → AI structuring)
- Honest loading states throughout — no fake timers
- Graceful fallbacks: missing LLM key, OCR failure, or invalid JSON all show an editable form instead of crashing
- Clean, professional UI built with React + Tailwind CSS
- In-memory only — no database, no auth, no persistence

## Run locally

```bash
npm install && npm run dev
```

Opens at `http://localhost:5173`. API runs on port 3001.

## Environment variables (optional)

| Variable | Default | Description |
|---|---|---|
| `LLM_API_KEY` | — | API key for OpenAI-compatible endpoint |
| `LLM_BASE_URL` | `https://api.openai.com/v1` | Base URL for the LLM provider |
| `LLM_MODEL` | `gpt-4o-mini` | Model name for structured extraction |

If `LLM_API_KEY` is not set, extraction uses default values and prompts the user to correct them manually.
