import React from "react";
import { BookOpen, CheckCircle2, Lightbulb } from "lucide-react";
import FormattedPassage from "./FormattedPassage.jsx";

export function parseExplanationSteps(rawText) {
  if (!rawText || typeof rawText !== "string") return [];
  const text = rawText.trim();

  // 0. Extract Markdown table if present (Puzzles, Seating Arrangements, DI tables)
  const lines = text.split(/\r?\n/);
  const tableLines = [];
  const nonTableLines = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("|") && trimmed.endsWith("|") && trimmed.includes("|", 1)) {
      tableLines.push(trimmed);
    } else {
      nonTableLines.push(line);
    }
  }

  const tableBlock = tableLines.length > 0 ? tableLines.join("\n") : null;
  const remainingText = nonTableLines.join("\n").replace(/###\s*(?:Solved\s*(?:Table|Matrix|Arrangement)|Reference\/Inference|Explanation)[^\n]*/gi, "").trim();

  const steps = [];

  // If a puzzle matrix / table was found, make it Step 1
  if (tableBlock) {
    steps.push({
      stepNum: 1,
      title: "Step 1: Solved Arrangement / Matrix",
      content: tableBlock,
      isTable: true,
    });
  }

  // 1. If text already has explicit "Step 1:", "Step 2:", etc.
  if (/step\s*\d+[:\-]/i.test(remainingText)) {
    const parts = remainingText.split(/(?=step\s*\d+[:\-])/i).map(s => s.trim()).filter(Boolean);
    if (parts.length > 0) {
      parts.forEach((p) => {
        const cleanContent = p.replace(/^step\s*\d+[:\-]\s*/i, "").trim();
        const titleMatch = p.match(/^step\s*\d+[:\-]\s*([^\n\:\.]+)/i);
        const title = titleMatch ? titleMatch[1].trim() : `Deduction ${steps.length + 1}`;
        steps.push({
          stepNum: steps.length + 1,
          title: `Step ${steps.length + 1}: ${title}`,
          content: cleanContent || p,
        });
      });
      return steps;
    }
  }

  // 2. If text has numbered lines like "1. ", "2. ", "3. "
  if (/^\s*\d+[\.\)]\s+/m.test(remainingText)) {
    const parts = remainingText.split(/(?=^\s*\d+[\.\)]\s+)/m).map(s => s.trim()).filter(Boolean);
    if (parts.length > 1) {
      parts.forEach((p) => {
        steps.push({
          stepNum: steps.length + 1,
          title: `Step ${steps.length + 1}: Inference`,
          content: p.replace(/^\s*\d+[\.\)]\s+/, "").trim(),
        });
      });
      return steps;
    }
  }

  // 3. If text has bullet lines (starting with - or * or •)
  const cleanLines = remainingText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (cleanLines.length >= 2 && cleanLines.some(l => /^[-*•]\s+/.test(l))) {
    cleanLines.forEach((l) => {
      steps.push({
        stepNum: steps.length + 1,
        title: `Step ${steps.length + 1}: Point`,
        content: l.replace(/^[-*•]\s+/, "").trim(),
      });
    });
    return steps;
  }

  // 4. If plain paragraph: Split by sentences
  const sentences = remainingText
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/g)
    .map(s => s.trim())
    .filter(Boolean);

  if (sentences.length <= 2) {
    if (remainingText) {
      steps.push({
        stepNum: steps.length + 1,
        title: `Step ${steps.length + 1}: Detailed Solution`,
        content: remainingText,
      });
    }
    return steps.length > 0 ? steps : [{ stepNum: 1, title: "Step 1: Solution", content: text }];
  }

  // Group sentences into 3-4 structured beginner steps
  const stepLabels = [
    "Given Data & Setup",
    "Formula & Working",
    "Step-by-Step Calculation",
    "Final Result & Conclusion"
  ];

  const numSteps = Math.min(4, Math.max(2, Math.ceil(sentences.length / 2.5)));
  const chunkSize = Math.ceil(sentences.length / numSteps);

  for (let i = 0; i < sentences.length; i += chunkSize) {
    const chunk = sentences.slice(i, i + chunkSize).join(" ");
    const stepIdx = steps.length;
    const label = stepLabels[stepIdx] || `Step ${stepIdx + 1}`;
    steps.push({
      stepNum: stepIdx + 1,
      title: `Step ${stepIdx + 1}: ${label}`,
      content: chunk,
    });
  }

  return steps;
}

export default function BeginnerSolutionView({
  explanation,
  correctAnswerIndex,
  options = [],
  compact = false
}) {
  const steps = parseExplanationSteps(explanation);
  const correctOptLetter = correctAnswerIndex != null && correctAnswerIndex >= 0
    ? String.fromCharCode(65 + correctAnswerIndex)
    : null;
  const correctOptText = correctOptLetter && options[correctAnswerIndex]
    ? options[correctAnswerIndex]
    : null;

  return (
    <div className={`rounded-2xl border border-blue-200/90 bg-gradient-to-b from-blue-50/80 to-indigo-50/50 p-4 sm:p-5 space-y-3.5 shadow-xs ${compact ? "text-xs" : "text-sm"}`}>
      {/* Solution Header with Beginner Tag */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-200/70 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#1B4F72] text-white flex items-center justify-center shrink-0 shadow-2xs">
            <BookOpen size={13} />
          </div>
          <span className="font-extrabold text-[#1B4F72] tracking-tight">
            Solution &amp; Step-by-Step Explanation
          </span>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-[#1B4F72] border border-blue-300">
          <Lightbulb size={11} className="text-amber-500" /> Beginner Friendly
        </span>
      </div>

      {/* Structured Steps for Beginners */}
      <div className="space-y-2.5">
        {steps.map((step) => (
          <div
            key={step.stepNum}
            className="rounded-xl border border-blue-100/90 bg-white/90 p-3 sm:p-3.5 shadow-2xs transition-all hover:border-blue-200"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-[#1B4F72] text-white tracking-wider shadow-2xs">
                Step {step.stepNum}
              </span>
              <span className="font-bold text-xs text-slate-800">
                {step.title.includes(":") ? step.title.split(":")[1]?.trim() : step.title}
              </span>
            </div>
            <FormattedPassage
              passage={step.content}
              className="text-xs sm:text-[13px] text-slate-700 leading-relaxed font-normal pl-0.5"
            />
          </div>
        ))}
      </div>

      {/* Correct Option Confirmation Box */}
      {correctOptLetter && (
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <div>
            <span className="font-extrabold uppercase text-emerald-800">Correct Option ({correctOptLetter})</span>
            {correctOptText && (
              <span className="text-emerald-700 ml-1.5 font-medium">
                : {correctOptText}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
