# Return
### AI-Assisted Tax Filing

Upload a tax document, extract data, calculate your return and file, all in one flow.

## How it works

| Step | What happens |
|---|---|
| **Upload** | Drag-and-drop or browse to upload a PDF or image of your tax document |
| **Extract** | Reads the file — text PDFs via `pdf-parse`, scanned docs/images via `tesseract.js` OCR. Optionally, the raw text is sent to an LLM (OpenAI-compatible) to extract structured fields. Results appear in an editable form for correction |
| **Calculate** | Runs the extracted income through SARS 2025/2026 progressive tax brackets (18%–45%) with the primary rebate (R17,235) to determine a refund or amount owing |
| **File** | Review the summary, submit, and get a confirmation with a reference number. Past filings are saved to a history dashboard accessible from the success screen |

## Features

- PDF text extraction via `pdf-parse` with OCR fallback via `tesseract.js`
- Optional LLM-based field extraction (OpenAI-compatible — configure via `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL`)
- Editable form to review and correct extracted data
- Live progress display during extraction (reading → OCR → structuring)
- SARS 2025/2026 progressive tax brackets with primary rebate
- Filing history dashboard with expandable breakdowns
- Clean, flat fintech UI built with React + Tailwind CSS
- In-memory only — no database, no auth, no persistence

## Run locally

```bash
npm install && npm run dev
```

Opens at `http://localhost:5173`. API runs on port 3001.

## Environment variables (optional)

| Variable | Default | Description |
|---|---|---|
| `LLM_API_KEY` | — | API key for OpenAI-compatible endpoint (without this, extraction uses hardcoded defaults) |
| `LLM_BASE_URL` | `https://api.openai.com/v1` | Base URL for the LLM provider |
| `LLM_MODEL` | `gpt-4o-mini` | Model used for structuring extracted text |

Without `LLM_API_KEY`, extraction falls back to hardcoded default values shown in an editable form.
