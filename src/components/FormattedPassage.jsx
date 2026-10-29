import React from "react";

/**
 * Convert inline math notation (caret exponents, fractions) into
 * Unicode superscript / vulgar-fraction characters for display.
 */
export function renderMathInline(text) {
  if (!text || typeof text !== "string") return text;

  const superDigits = { '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹' };
  const subDigits = { '0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉' };
  const toSuperDigits = (s) => s.split('').map(c => superDigits[c] || c).join('');
  const toSubDigits = (s) => s.split('').map(c => subDigits[c] || c).join('');

  let res = text;

  // 0. Repair dangling carets from PDF OCR extraction noise for common speed math powers
  res = res
    .replace(/(\b1681\b|\(1681\))\^(\s*(?:[\+\-\*\/=]|$))/g, "$1¹⁄₂$2")
    .replace(/(\b409[4-6]\b|\(409[4-6]\))\^(\s*(?:[\+\-\*\/=]|$))/g, "$1¹⁄₃$2")
    .replace(/(\b219[6-8]\b|\(219[6-8]\))\^(\s*(?:[\+\-\*\/=]|$))/g, "$1¹⁄₃$2")
    .replace(/(\b172[7-9]\b|\(172[7-9]\))\^(\s*(?:[\+\-\*\/=]|$))/g, "$1¹⁄₃$2")
    .replace(/(\b274[3-5]\b|\(274[3-5]\))\^(\s*(?:[\+\-\*\/=]|$))/g, "$1¹⁄₃$2")
    .replace(/(\b337[4-6]\b|\(337[4-6]\))\^(\s*(?:[\+\-\*\/=]|$))/g, "$1¹⁄₃$2")
    .replace(/(\b583[1-3]\b|\(583[1-3]\))\^(\s*(?:[\+\-\*\/=]|$))/g, "$1¹⁄₃$2")
    .replace(/(\b685[8-9]\b|\(685[8-9]\))\^(\s*(?:[\+\-\*\/=]|$))/g, "$1¹⁄₃$2")
    .replace(/(\b926[0-2]\b|\(926[0-2]\))\^(\s*(?:[\+\-\*\/=]|$))/g, "$1¹⁄₃$2")
    .replace(/(\b1382[3-5]\b|\(1382[3-5]\))\^(\s*(?:[\+\-\*\/=]|$))/g, "$1¹⁄₃$2")
    .replace(/(\b2438[8-9]\b|\(2438[8-9]\))\^(\s*(?:[\+\-\*\/=]|$))/g, "$1¹⁄₃$2");

  // 1. Convert fractional exponents: ^(1/2) -> ¹⁄₂, ^1/2 -> ¹⁄₂, ^(1/3) -> ¹⁄₃, etc.
  res = res.replace(/\^\s*[\(\{]?(\d+)\/(\d+)[\)\}]?/g, (_, num, den) => {
    return toSuperDigits(num) + '⁄' + toSubDigits(den);
  });

  // ^(n) or ^{n} — parenthesized exponents
  res = res.replace(/\^[\(\{](\d+)[\)\}]/g, (_, exp) => toSuperDigits(exp));

  // Simple caret: ^2 -> ², ^3 -> ³, etc.
  res = res
    .replace(/\^0/g, "⁰")
    .replace(/\^1(?![0-9\/])/g, "¹")
    .replace(/\^2/g, "²")
    .replace(/\^3/g, "³")
    .replace(/\^4/g, "⁴")
    .replace(/\^5/g, "⁵")
    .replace(/\^6/g, "⁶")
    .replace(/\^7/g, "⁷")
    .replace(/\^8/g, "⁸")
    .replace(/\^9/g, "⁹");

  // Common text fractions -> Unicode vulgar fractions (standalone only)
  res = res
    .replace(/(?<![0-9])1\/2(?![0-9])/g, "½")
    .replace(/(?<![0-9])1\/3(?![0-9])/g, "⅓")
    .replace(/(?<![0-9])2\/3(?![0-9])/g, "⅔")
    .replace(/(?<![0-9])1\/4(?![0-9])/g, "¼")
    .replace(/(?<![0-9])3\/4(?![0-9])/g, "¾")
    .replace(/(?<![0-9])1\/5(?![0-9])/g, "⅕")
    .replace(/(?<![0-9])2\/5(?![0-9])/g, "⅖")
    .replace(/(?<![0-9])3\/5(?![0-9])/g, "⅗")
    .replace(/(?<![0-9])4\/5(?![0-9])/g, "⅘")
    .replace(/(?<![0-9])1\/6(?![0-9])/g, "⅙")
    .replace(/(?<![0-9])5\/6(?![0-9])/g, "⅚")
    .replace(/(?<![0-9])1\/8(?![0-9])/g, "⅛")
    .replace(/(?<![0-9])3\/8(?![0-9])/g, "⅜")
    .replace(/(?<![0-9])5\/8(?![0-9])/g, "⅝")
    .replace(/(?<![0-9])7\/8(?![0-9])/g, "⅞");

  return res;
}
export function parsePassageBlocks(passage) {
  if (!passage || typeof passage !== "string") return [];

  const lines = passage.split(/\r?\n/);
  const blocks = [];
  let currentTable = [];
  let currentText = [];

  const flushText = () => {
    if (currentText.length > 0) {
      blocks.push({ type: "text", content: currentText.join("\n") });
      currentText = [];
    }
  };

  const flushTable = () => {
    if (currentTable.length > 0) {
      blocks.push({ type: "table", lines: [...currentTable] });
      currentTable = [];
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    // Match Markdown table rows (starting and ending with | or containing multiple |)
    if (trimmed.startsWith("|") && trimmed.endsWith("|") && trimmed.includes("|", 1)) {
      flushText();
      // Skip markdown separator line like |---|---|
      if (!/^\|(?:\s*:?-+:?\s*\|)+$/.test(trimmed)) {
        currentTable.push(trimmed);
      }
    } else {
      flushTable();
      currentText.push(line);
    }
  });

  flushText();
  flushTable();

  return blocks;
}

export default function FormattedPassage({ passage, className = "" }) {
  if (!passage) return null;
  const blocks = parsePassageBlocks(passage);

  return (
    <div className={`space-y-3 ${className}`}>
      {blocks.map((block, bIdx) => {
        if (block.type === "text") {
          return (
            <p key={bIdx} className="whitespace-pre-line leading-relaxed">
              {renderMathInline(block.content)}
            </p>
          );
        }

        if (block.type === "table") {
          const parsedRows = block.lines.map((l) =>
            l
              .split("|")
              .slice(1, -1)
              .map((c) => c.trim())
          );
          const headers = parsedRows[0] || [];
          const dataRows = parsedRows.slice(1);

          return (
            <div key={bIdx} className="overflow-x-auto my-2 rounded-xl border border-slate-300 shadow-2xs bg-white">
              <table className="min-w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300">
                    {headers.map((h, hIdx) => (
                      <th
                        key={hIdx}
                        className="px-3 py-2 text-left font-bold text-slate-800 border-r border-slate-200 last:border-r-0"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {dataRows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className={rIdx % 2 === 0 ? "bg-white hover:bg-blue-50/30" : "bg-slate-50/70 hover:bg-blue-50/30"}
                    >
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className="px-3 py-2 text-slate-700 border-r border-slate-200 last:border-r-0 font-medium"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
