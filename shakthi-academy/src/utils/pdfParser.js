// ------------------------------------------------------------------
// PDF Text Extractor for Previous Year Question Paper Analysis
// Uses pdfjs-dist to extract text from uploaded PDF files client-side
// ------------------------------------------------------------------

import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// Set worker using Vite's ?url import for correct bundling
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * Extract all text content from a PDF file.
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
    const pageText = content.items.map((item) => item.str).join(" ");
    fullText += `\n--- Page ${pageNum} ---\n${pageText}\n`;

    if (onProgress) onProgress(pageNum, totalPages);
  }

  return { text: fullText.trim(), pageCount: totalPages };
}
