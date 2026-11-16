// Generates public/sample-irp5.pdf: a fictional IRP5-style certificate used by
// the "Try a sample IRP5" demo. All names and figures are made up.
// Run with: node scripts/make-sample-irp5.mjs
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const out = path.join(root, 'public', 'sample-irp5.pdf')

const doc = await PDFDocument.create()
doc.setTitle('Sample IRP5 (fictional)')
const page = doc.addPage([595, 842]) // A4
const font = await doc.embedFont(StandardFonts.Helvetica)
const bold = await doc.embedFont(StandardFonts.HelveticaBold)

const blue = rgb(0.15, 0.39, 0.92)
const grey = rgb(0.45, 0.45, 0.5)
const dark = rgb(0.12, 0.12, 0.15)

// Header band
page.drawRectangle({ x: 0, y: 772, width: 595, height: 70, color: blue })
page.drawText('Employee Tax Certificate', { x: 50, y: 806, size: 20, font: bold, color: rgb(1, 1, 1) })
page.drawText('IRP5 sample for demo purposes only. Fictional data, not issued by SARS.', {
  x: 50, y: 786, size: 9, font, color: rgb(0.85, 0.9, 1),
})

let y = 735
const line = (label, value, opts = {}) => {
  page.drawText(label, { x: 50, y, size: 11, font: opts.bold ? bold : font, color: opts.muted ? grey : dark })
  if (value) page.drawText(value, { x: 360, y, size: 11, font: bold, color: dark })
  y -= opts.gap ?? 22
}
const heading = (text) => {
  y -= 10
  page.drawText(text, { x: 50, y, size: 10, font: bold, color: blue })
  y -= 6
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 0.6, color: rgb(0.8, 0.83, 0.9) })
  y -= 20
}

heading('CERTIFICATE DETAILS')
line('Employer: Karoo Ridge Trading (Pty) Ltd')
line('Employee: Sample Taxpayer')
line('Yr: 2026')
line('Age: 38')
line('Period: 1 March 2025 to 28 February 2026', null, { muted: true })

heading('INCOME')
line('Gross Income (3601)', 'R 486,000.00')

heading('DEDUCTIONS AND CONTRIBUTIONS')
line('Pension Fund Contributions (4001)', 'R 36,000.00')
line('Medical Scheme Fees (4116)', 'R 30,240.00')
line('Medical scheme members: 3', null)
line('UIF Contributions (4141)', 'R 2,125.44')

heading('TAX')
line('PAYE Tax Deducted (4102)', 'R 98,412.00')

page.drawText('Return demo document. Upload it to see extraction, calculation and filing end to end.', {
  x: 50, y: 60, size: 8, font, color: grey,
})

fs.mkdirSync(path.dirname(out), { recursive: true })
fs.writeFileSync(out, await doc.save())
console.log('Wrote', path.relative(root, out))
