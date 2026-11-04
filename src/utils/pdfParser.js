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
const symbolFontGlyphs = {
  '\uf0b8': '÷', '\uf0b4': '×', '\uf03d': '=', '\uf02b': '+',
  '\uf02d': '−', '\uf028': '(', '\uf029': ')', '\uf020': ' ',
  '\uf0e9': '[', '\uf0f9': ']', '\uf0ea': '[', '\uf0fa': ']',
  '\uf0eb': '[', '\uf0fb': ']',
};
const normalizePdfMath = value => value.normalize('NFKC').replace(/[\uf020-\uf0ff]/g, ch => symbolFontGlyphs[ch] || ch);

/**
 * Reconstruct text from PDF.js items while preserving mathematical notation:
 * - Vertical fractions (numerator over denominator separated by a drawn bar)
 * - Exponents / superscripts (powers like 2, 3, 1/2, 1/3)
 * - Mixed fractions (e.g. 22 1/3 %)
 */
export function extractTextWithMathPreservation(textContent) {
  if (!textContent || !textContent.items || textContent.items.length === 0) return "";

  // Split genuine two-column papers before reconstructing visual lines. A
  // single line can contain Q1 on the left and Q13 on the right; reading it
  // across the page turns the right question into Q1's options.
  const questionMarkers = textContent.items.filter(it =>
    it?.transform && /^(?:(?:Q|S)\s*)?\d{1,3}[.):]$/i.test(String(it.str || '').trim()))
    .map(it => it.transform[4]).sort((a, b) => a - b);
  if (questionMarkers.length >= 6) {
    let largestGap = 0;
    let gapIndex = -1;
    for (let i = 1; i < questionMarkers.length; i++) {
      const gap = questionMarkers[i] - questionMarkers[i - 1];
      if (gap > largestGap) { largestGap = gap; gapIndex = i; }
    }
    if (largestGap >= 90 && gapIndex >= 3 && questionMarkers.length - gapIndex >= 3) {
      const splitAt = questionMarkers[gapIndex] - 15;
      // Running footers at the extreme bottom are not part of a question,
      // including when the final question's options continue on the next page.
      const contentItems = textContent.items.filter(it =>
        (it.transform?.[5] ?? 100) >= 35 &&
        !(/^\(\d{1,3}\)$/.test(String(it.str || '').trim()) && (it.transform?.[5] ?? 0) > 795));
      const left = contentItems.filter(it => (it.transform?.[4] ?? 0) < splitAt);
      const right = contentItems.filter(it => (it.transform?.[4] ?? 0) >= splitAt);
      return `${extractTextWithMathPreservation({ items: left })}\n${extractTextWithMathPreservation({ items: right })}`;
    }
  }

  const rawItems = textContent.items
    .filter(it => it && typeof it.str === "string" && it.str.length > 0)
    .map(it => {
      const transform = it.transform || [1, 0, 0, 1, 0, 0];
      const x = transform[4];
      const y = transform[5];
      const w = it.width || (it.str.length * 6);
      const h = it.height || Math.abs(transform[0]) || 10;
      return {
        str: normalizePdfMath(it.str),
        x,
        y,
        w,
        h,
        hasEOL: Boolean(it.hasEOL),
      };
    });

  if (rawItems.length === 0) return "";

  // A stacked fraction may span three visual lines. Join its small numerator
  // and denominator before line clustering, so mixed fractions stay with the
  // surrounding question instead of becoming stray lines.
  const consumed = new Set();
  const fractions = [];
  for (let i = 0; i < rawItems.length; i++) {
    const top = rawItems[i];
    if (consumed.has(i) || !/^\d+$/.test(top.str.trim()) || top.h > 11) continue;
    const partner = rawItems.findIndex((bottom, j) => j !== i && !consumed.has(j) &&
      /^\d+$/.test(bottom.str.trim()) && bottom.h <= 11 &&
      Math.abs(top.x - bottom.x) < 5 && top.y - bottom.y >= 10 && top.y - bottom.y <= 24 &&
      rawItems.some(base => base.h >= 12 && Math.abs(base.y - (top.y + bottom.y) / 2) < 4 &&
        base.x < top.x && top.x - (base.x + base.w) < 40));
    if (partner < 0) continue;
    const bottom = rawItems[partner];
    consumed.add(i);
    consumed.add(partner);
    fractions.push({ ...top, str: `${top.str.trim()}/${bottom.str.trim()}`,
      y: (top.y + bottom.y) / 2, h: 13, w: Math.max(top.w, bottom.w) });
  }
  const layoutItems = rawItems.filter((_, index) => !consumed.has(index)).concat(fractions);

  // Sort items from top of page to bottom of page (Y descending in standard PDF coords)
  layoutItems.sort((a, b) => b.y - a.y || a.x - b.x);

  // Powers in this paper sit up to 11 points above the baseline.
  const lines = [];
  for (const item of layoutItems) {
    let matchedLine = null;
    for (const line of lines) {
      if (Math.abs(line.baseY - item.y) <= 13) {
        matchedLine = line;
        break;
      }
    }
    if (matchedLine) {
      matchedLine.items.push(item);
      // Anchor to normal-size text, never to a small superscript.
      if (item.h >= 12) matchedLine.baseY = item.y;
    } else {
      lines.push({ baseY: item.y, items: [item] });
    }
  }

  // Sort lines from top to bottom
  lines.sort((a, b) => b.baseY - a.baseY);

  // Banking papers commonly use two independent columns. PDF.js returns both
  // columns at the same Y coordinate, so a plain Y/X sort interleaves Q3 with
  // Q7 and corrupts passages, options, and solutions. Locate the gutter from
  // repeated Q/S number markers, then read the complete left column before the
  // complete right column. Pages without strong two-column evidence retain
  // their original full-width order.
  const orderColumns = (sourceLines) => {
    const markerXs = sourceLines.flatMap(line => line.items)
      .filter(item => /^(?:Q|S)\s*\d{1,3}[.):]?/i.test(item.str.trim()))
      .map(item => item.x)
      .sort((a, b) => a - b);
    if (markerXs.length < 4) return sourceLines;
    let splitAt = -1;
    let largestGap = 0;
    for (let j = 1; j < markerXs.length; j++) {
      const gap = markerXs[j] - markerXs[j - 1];
      if (gap > largestGap) {
        largestGap = gap;
        splitAt = (markerXs[j] + markerXs[j - 1]) / 2;
      }
    }
    const leftMarkers = markerXs.filter(x => x < splitAt).length;
    const rightMarkers = markerXs.length - leftMarkers;
    if (largestGap >= 70 && leftMarkers >= 2 && rightMarkers >= 2) {
      const leftLines = sourceLines
        .map(line => ({ ...line, items: line.items.filter(item => item.x < splitAt) }))
        .filter(line => line.items.length);
      const rightLines = sourceLines
        .map(line => ({ ...line, items: line.items.filter(item => item.x >= splitAt) }))
        .filter(line => line.items.length);
      return [...leftLines, ...rightLines];
    }
    return sourceLines;
  };
  // A section heading can begin halfway down the final question page. Treat it
  // as a horizontal band boundary so S1/S2 below it are not emitted before
  // Q96-Q100 in the upper-right column.
  const solutionDivider = lines.findIndex(line => line.items.some(item => /^Solutions?$/i.test(item.str.trim())));
  const orderedLines = solutionDivider >= 0
    ? [
        ...orderColumns(lines.slice(0, solutionDivider)),
        lines[solutionDivider],
        ...orderColumns(lines.slice(solutionDivider + 1)),
      ]
    : orderColumns(lines);

  let fullPageText = "";

  for (const line of orderedLines) {
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
      const isDigitOrFrac = /^[0-9?\+\-\/\(\)]+$/.test(cur.str.trim());

      // A small 3 immediately to the upper left of √ is the cube-root index.
      if (cur.str.trim() === '3' && cur.h < 9 && isSuper && next?.str.startsWith('√') &&
        next.x - (cur.x + cur.w) < 6) {
        lineText += '∛';
        next.str = next.str.slice(1);
        i++;
        continue;
      }

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

    const trimmedLine = lineText.trim().replace(/(∛\d+)\.\s+(\d+)/g, '$1.$2');
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

