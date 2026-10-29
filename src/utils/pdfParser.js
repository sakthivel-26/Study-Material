// ------------------------------------------------------------------
// PDF Text Extractor for Previous Year Question Paper Analysis
// Uses pdfjs-dist with math-preserving layout reconstruction
// ------------------------------------------------------------------

import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// Set worker using Vite's ?url import for correct bundling
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const superDigits = { '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹' };
const subDigits = { '0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉' };

/**
 * Reconstruct text from PDF.js items while preserving mathematical notation:
 * - Vertical fractions (numerator over denominator separated by a drawn bar)
 * - Exponents / superscripts (powers like 2, 3, 1/2, 1/3)
 * - Mixed fractions (e.g. 22 1/3 %)
 */
export function extractTextWithMathPreservation(textContent) {
  if (!textContent || !textContent.items || textContent.items.length === 0) return "";

  const rawItems = textContent.items
    .filter(it => it && typeof it.str === "string" && it.str.length > 0)
    .map(it => {
      const transform = it.transform || [1, 0, 0, 1, 0, 0];
      const x = transform[4];
      const y = transform[5];
      const w = it.width || (it.str.length * 6);
      const h = it.height || Math.abs(transform[0]) || 10;
      return {
        str: it.str,
        x,
        y,
        w,
        h,
        hasEOL: Boolean(it.hasEOL),
      };
    });

  if (rawItems.length === 0) return "";

  // Sort items from top of page to bottom of page (Y descending in standard PDF coords)
  rawItems.sort((a, b) => b.y - a.y || a.x - b.x);

  // Cluster items into visual lines (tolerance: 8 points to catch baselines + sub/superscripts)
  const lines = [];
  for (const item of rawItems) {
    let matchedLine = null;
    for (const line of lines) {
      if (Math.abs(line.baseY - item.y) <= 8) {
        matchedLine = line;
        break;
      }
    }
    if (matchedLine) {
      matchedLine.items.push(item);
      // Keep baseY anchored to dominant standard font items (height >= 9)
      if (item.h >= 9) {
        matchedLine.baseY = (matchedLine.baseY * matchedLine.items.length + item.y) / (matchedLine.items.length + 1);
      }
    } else {
      lines.push({ baseY: item.y, items: [item] });
    }
  }

  // Sort lines from top to bottom
  lines.sort((a, b) => b.baseY - a.baseY);

  let fullPageText = "";

  for (const line of lines) {
    // Sort items horizontally within the line
    line.items.sort((a, b) => a.x - b.x);

    let lineText = "";
    let i = 0;

    while (i < line.items.length) {
      const cur = line.items[i];
      const next = line.items[i + 1];

      // 1. Detect vertical fraction (numerator higher Y, denominator lower Y at nearly same X)
      if (
        next &&
        Math.abs(cur.x - next.x) < 12 &&
        Math.abs(cur.y - next.y) >= 3.5 &&
        Math.abs(cur.y - next.y) <= 24 &&
        /^\d+$/.test(cur.str.trim()) &&
        /^\d+$/.test(next.str.trim())
      ) {
        const topItem = cur.y > next.y ? cur : next;
        const btmItem = cur.y > next.y ? next : cur;
        const num = topItem.str.trim();
        const den = btmItem.str.trim();

        // Check if preceding token was an exponent caret '^'
        if (lineText.endsWith("^") || lineText.endsWith(" ^")) {
          lineText += `(${num}/${den})`;
        } else if (lineText.length > 0 && !lineText.endsWith(" ") && !lineText.endsWith("(")) {
          // Mixed fraction like "22 1/3" or preceding operator
          lineText += ` ${num}/${den}`;
        } else {
          lineText += `${num}/${den}`;
        }
        i += 2;
        continue;
      }

      // 2. Detect superscript exponent (higher Y by 3-12pt and smaller height)
      const isSuper = (cur.y - line.baseY >= 2.8) && (cur.y - line.baseY <= 14);
      const isDigitOrFrac = /^[0-9\+\-\/\(\)]+$/.test(cur.str.trim());

      if (isSuper && isDigitOrFrac && lineText.length > 0 && !lineText.endsWith(" ") && !lineText.endsWith("\n")) {
        const trimmed = cur.str.trim();
        if (lineText.endsWith("^")) {
          lineText += `(${trimmed})`;
        } else if (/^[0-9]+$/.test(trimmed)) {
          // Convert pure digits to superscripts (e.g. 2 -> ², 3 -> ³, 4 -> ⁴)
          const sup = trimmed.split('').map(c => superDigits[c] || c).join('');
          lineText += sup;
        } else {
          lineText += `^(${trimmed})`;
        }
        i++;
        continue;
      }

      // 3. Normal text item placement: maintain natural word spacing
      if (lineText.length > 0) {
        const prev = line.items[i - 1];
        const gap = cur.x - (prev ? prev.x + prev.w : cur.x);
        if (gap > 2.5 && !lineText.endsWith(" ") && !cur.str.startsWith(" ")) {
          lineText += " ";
        }
      }

      lineText += cur.str;
      i++;
    }

    const trimmedLine = lineText.trim();
    if (trimmedLine) {
      fullPageText += trimmedLine + "\n";
    }
  }

  return fullPageText;
}

/**
 * Extract all text content from a PDF file using math-preserving layout reconstruction.
 * @param {File} file - The PDF file object from an <input type="file">
 * @param {function} onProgress - Optional callback (pageNum, totalPages)
 * @returns {Promise<{ text: string, pageCount: number }>}
 */
export async function extractTextFromPDF(file, onProgress) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdf.numPages;
  let fullText = "";

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = extractTextWithMathPreservation(content);

    fullText += `\n--- Page ${pageNum} ---\n${pageText}\n`;

    if (onProgress) onProgress(pageNum, totalPages);
  }

  return { text: fullText.trim(), pageCount: totalPages };
}

