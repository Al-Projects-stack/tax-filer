# Return
### AI-Assisted Tax Filing

Upload a tax document, extract data, calculate your return and file, all in one flow.

## How it works

| Step | What happens |
|---|---|
| **Upload** | Drag-and-drop or browse to upload a PDF or image of your tax document |
| **Extract** | Reads the file: text PDFs via `pdf-parse`, scanned docs/images via `tesseract.js` OCR. Optionally, the raw text is sent to an LLM (OpenAI-compatible) to extract structured fields. Results appear in an editable form for correction |
| **Calculate** | Runs the extracted income through SARS 2025/2026 progressive tax brackets (18% to 45%) with the primary rebate (R17,235) to determine a refund or amount owing |
| **File** | Review the summary, submit, and get a confirmation with a reference number. Past filings are saved to a history dashboard accessible from the success screen |

## Features

- PDF text extraction via `pdf-parse` with OCR fallback via `tesseract.js`
- Optional LLM-based field extraction (OpenAI-compatible, configured via `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL`)
- **Try a sample IRP5**: one click from the landing page runs a fictional certificate through the whole flow, so no real tax document is needed. Regenerate it with `npm run sample`, which writes `public/sample-irp5.pdf`
- **Phone camera capture**: on touch devices, "Take a photo" opens the rear camera. Large photos are downscaled to 2400px before upload
- **History export**: download all filings as CSV (opens in Excel) or JSON from the Filing History page
- Editable form to review and correct extracted data
- Live progress display during extraction (reading → OCR → structuring)
- SARS 2025/2026 progressive tax brackets with primary rebate
- Filing history dashboard with expandable breakdowns
- Clean, flat fintech UI built with React + Tailwind CSS
- In-memory only for extracted data and processing. Filing history is persisted to `data/history.json`, and there is no auth or production database

## Run locally

Requires Node.js 18 or newer.

From the project folder, run these two commands one after the other:

```bash
npm install
npm run dev
```

This starts two servers together:

- **App:** `http://localhost:5173`. Open this one in your browser.
- **API:** `http://localhost:3001`. The app proxies `/api` requests here. Opening it directly shows `Cannot GET /`, which is expected.

### Windows notes

- **Windows PowerShell 5.1 doesn't support `&&`.** A one-liner like `npm install && npm run dev` fails with *"The token '&&' is not a valid statement separator"*. Run the commands separately as shown above, or chain them with `;`.
- **Quote the folder path, because it contains a space:** `cd "C:\path\to\Tax filer"`.

### Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `Port 3001 is already in use` or `Port 5173 is already in use` | An earlier `npm run dev` is still running. Close that terminal (Ctrl+C) and start again. To see what's holding the ports, run `netstat -ano \| findstr ":3001 :5173"`. If either port is busy, both servers stop, so you never end up with a half-working app. |
| `Cannot GET /` in the browser | You opened the API port (3001). Use `http://localhost:5173`. |
| *"Upload not found. Please upload the file again."* after restarting the server | Uploads only live in memory, so they're lost when the server restarts. Upload the document again. |

## Environment variables (optional)

| Variable | Default | Description |
|---|---|---|
| `LLM_API_KEY` | None | API key for OpenAI-compatible endpoint (without this, extraction uses the built-in regex parser) |
| `LLM_BASE_URL` | `https://api.openai.com/v1` | Base URL for the LLM provider |
| `LLM_MODEL` | `gpt-4o-mini` | Model used for structuring extracted text |

None of these are needed to run the app. Without `LLM_API_KEY`, extraction uses a label-aware regex parser that reads fields such as Gross Income (3601) and PAYE (4102) directly from the document text, and the results show up in an editable form. If the LLM call fails, extraction falls back to the same parser.
