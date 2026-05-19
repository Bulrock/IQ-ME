// tools/generate-icar-stub-pdf.mjs
//
// One-off generator for ICAR-CONFIRMATION.pdf at v0.0.1 (Story 1.3).
// Hand-rolled minimal PDF 1.4 — no external dependencies, no font embedding
// (uses built-in Helvetica), no compression. Aligns with NFR33 (zero runtime
// deps) and the project's audit-first posture: the generator is ~120 LOC
// readable Node, and the output PDF (~1.5 KB) is human-inspectable in any
// text editor.
//
// Usage: node tools/generate-icar-stub-pdf.mjs > ICAR-CONFIRMATION.pdf
//
// Gate 9a will replace the stub output with the real signed confirmation
// from ICAR / SAPA; this script is preserved so the pending stub can be
// re-emitted reproducibly if needed (e.g. for the byte-stable build assertion
// audit trail).

import { writeFileSync } from "node:fs";
import { argv } from "node:process";

const TITLE = "ICAR License Confirmation - Pending";
const BODY_LINES = [
  "Pre-launch gate #1: the ICAR / SAPA project has been contacted for",
  "written confirmation that public free-self-assessment redistribution is",
  "permitted under CC BY-NC-SA. This page is replaced by the actual signed",
  "confirmation when it arrives. See",
  "/methodology/v0.0.1/en/provenance/icar-license/",
  "for current status.",
];

// Build a content stream of text operations.
// Coordinates: PDF origin is bottom-left. Page is US Letter (612 x 792 pt).
// Title at y=720, body lines wrapping below.
function escapePdfString(s) {
  // Backslash, parens must be escaped in PDF literal strings.
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

const TITLE_FONT_SIZE = 18;
const BODY_FONT_SIZE = 11;
const LEFT_MARGIN = 72;
const TITLE_Y = 720;
const BODY_START_Y = 670;
const LINE_HEIGHT = 16;

let stream = "BT\n";
stream += `/F1 ${TITLE_FONT_SIZE} Tf\n`;
stream += `${LEFT_MARGIN} ${TITLE_Y} Td\n`;
stream += `(${escapePdfString(TITLE)}) Tj\n`;
stream += "ET\n";
stream += "BT\n";
stream += `/F1 ${BODY_FONT_SIZE} Tf\n`;
stream += `${LEFT_MARGIN} ${BODY_START_Y} Td\n`;
for (let i = 0; i < BODY_LINES.length; i++) {
  if (i > 0) stream += `0 -${LINE_HEIGHT} Td\n`;
  stream += `(${escapePdfString(BODY_LINES[i])}) Tj\n`;
}
stream += "ET\n";

const streamBytes = Buffer.byteLength(stream, "latin1");

// Build objects.
const objects = [
  null, // 1-indexed
  // 1: Catalog
  "<< /Type /Catalog /Pages 2 0 R >>",
  // 2: Pages
  "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
  // 3: Page
  "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
  // 4: Content stream
  `<< /Length ${streamBytes} >>\nstream\n${stream}endstream`,
  // 5: Font
  "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
];

// Serialize, recording byte offsets for xref.
let out = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n"; // binary marker per spec recommendation
const offsets = [0]; // index 0 reserved (free object)
for (let i = 1; i < objects.length; i++) {
  offsets.push(Buffer.byteLength(out, "latin1"));
  out += `${i} 0 obj\n${objects[i]}\nendobj\n`;
}

const xrefOffset = Buffer.byteLength(out, "latin1");
out += "xref\n";
out += `0 ${objects.length}\n`;
out += "0000000000 65535 f \n";
for (let i = 1; i < objects.length; i++) {
  out += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
}
out += "trailer\n";
out += `<< /Size ${objects.length} /Root 1 0 R >>\n`;
out += "startxref\n";
out += `${xrefOffset}\n`;
out += "%%EOF\n";

const outPath = argv[2] ?? "ICAR-CONFIRMATION.pdf";
writeFileSync(outPath, out, "latin1");
process.stderr.write(`wrote ${outPath} (${Buffer.byteLength(out, "latin1")} bytes)\n`);
