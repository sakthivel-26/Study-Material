import React from "react";

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
              {block.content}
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
