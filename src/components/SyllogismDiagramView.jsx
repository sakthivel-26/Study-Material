import React, { useMemo, useState } from "react";
import { CircleDot, CheckCircle2, XCircle, Info, Maximize2, Minimize2, Eye } from "lucide-react";
import { getSimpleSetLayout, getSetRootCenters } from "../utils/syllogismLayout.js";

/**
 * Normalizes entity name for matching (singular, lowercase)
 */
function normalizeEntity(name) {
  if (!name) return "";
  let n = name.trim().toLowerCase().replace(/^(?:an?|the)\s+/, "");
  // Strip trailing 's' or 'es' for simple singularization in entity matching
  if (n.endsWith("ies")) n = n.slice(0, -3) + "y";
  else if (/(?:ches|shes|sses|xes|zes|oes)$/.test(n)) n = n.slice(0, -2);
  else if (n.endsWith("s") && !n.endsWith("ss") && !n.endsWith("us") && !n.endsWith("is")) n = n.slice(0, -1);
  return n;
}

/**
 * Capitalize words for pretty labels
 */
function capitalize(str) {
  if (!str) return "";
  return str.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

/**
 * Parses Syllogism statements and conclusions from question or explanation text
 */
export function parseSyllogismModel(text) {
  if (!text || typeof text !== "string") return null;

  const isSyllogism = /(?:syllogism|\bstatements?\s*:|\bconclusions?\s*:|\bsome\s+[\w\s]+\s+are\s+|\ball\s+[\w\s]+\s+are\s+|\bno\s+[\w\s]+\s+is\s+|\bonly\s+a\s+few\s+[\w\s]+\s+are\s+)/i.test(text);
  if (!isSyllogism) return null;

  // Split into statements, conclusions and explanation
  const stmtMatch = text.match(/(?:statements?\s*[\:\.\-])([\s\S]*?)(?=(?:conclusions?\s*[\:\.\-]|explanation|solution|$))/i);
  const stmtSection = stmtMatch ? stmtMatch[1] : text;

  const concMatch = text.match(/(?:conclusions?\s*[\:\.\-])([\s\S]*?)(?=(?:explanation|solution|$))/i);
  const concSection = concMatch ? concMatch[1] : "";

  const expMatch = text.match(/(?:explanation|solution|detailed\s+solution)\s*[\:\.\-]?([\s\S]*)/i);
  const expSection = expMatch ? expMatch[1] : "";

  // Regex to extract statements: All/Some/No/Only a few <Subj> are/is <Pred>
  const statementRegex = /(?:(?:\d+[\.\)]|\bstatement\s*\d*[:\-])\s*)?(all|some|no|only\s+a\s+few)\s+([a-zA-Z\s]+?)\s+(are\s+not|are|is\s+not|is)\s+([a-zA-Z\s]+?)(?=[,\.\n;]|\bconclusions?\b|$)/gi;

  const statements = [];
  let m;
  while ((m = statementRegex.exec(stmtSection)) !== null) {
    const quant = m[1].toLowerCase().replace(/\s+/g, " ").trim();
    const subj = m[2].trim().replace(/^(?:an?|the|all|some|few)\s+/i, "");
    const copula = m[3].toLowerCase().trim();
    const pred = m[4].trim().replace(/^(?:an?|the|all|some|few)\s+/i, "");

    let type = "SOME"; // default
    if (quant === "all") type = copula.includes("not") ? "ALL_NOT" : "ALL";
    else if (quant === "no") type = "NO";
    else if (quant === "only a few") type = "ONLY_A_FEW";
    else if (copula.includes("not")) type = "SOME_NOT";

    if (subj && pred && subj.length <= 30 && pred.length <= 30 &&
        !statements.some(s => s.type === type && s.normSubj === normalizeEntity(subj) && s.normPred === normalizeEntity(pred))) {
      statements.push({
        type,
        subject: subj,
        predicate: pred,
        normSubj: normalizeEntity(subj),
        normPred: normalizeEntity(pred),
        raw: m[0].trim()
      });
    }
  }

  if (statements.length === 0) return null;

  // Parse conclusions
  const conclusions = [];
  const concLineRegex = /(?:^|\s)(I{1,3}|IV|V|\d+)[\.\)]\s*([\s\S]*?)(?=\s+(?:I{1,3}|IV|V|\d+)[\.\)]\s*|\n|$)/gi;
  let cm;
  while ((cm = concLineRegex.exec(concSection)) !== null) {
    const rawConc = cm[2].trim();
    if (rawConc.length > 5) {
      // Check if explanation indicates this conclusion follows
      const concNum = cm[1].toUpperCase();
      const followsPattern = new RegExp(`(?:conclusion\\s*)?${concNum}\\s+(?:does\\s+)?follows?`, "i");
      const notFollowsPattern = new RegExp(`(?:conclusion\\s*)?${concNum}\\s+(?:does\\s+not|doesn't)\\s+follow`, "i");

      let follows = null;
      if (notFollowsPattern.test(expSection)) {
        follows = false;
      } else if (followsPattern.test(expSection)) {
        follows = true;
      } else if (/only\s+conclusion\s+i\s+follows/i.test(expSection)) {
        follows = concNum.toUpperCase() === "I";
      } else if (/only\s+conclusion\s+ii\s+follows/i.test(expSection)) {
        follows = concNum.toUpperCase() === "II";
      } else if (/neither.*nor.*follow/i.test(expSection)) {
        follows = false;
      } else if (/both.*follow/i.test(expSection)) {
        follows = true;
      }

      if (conclusions.some(c => c.num === concNum)) continue;
      conclusions.push({
        num: concNum || `C${conclusions.length + 1}`,
        text: rawConc,
        follows
      });
    }
  }

  // Gather unique entities in order of appearance
  const entityMap = new Map();
  statements.forEach(st => {
    if (!entityMap.has(st.normSubj)) {
      entityMap.set(st.normSubj, { norm: st.normSubj, label: capitalize(st.subject) });
    }
    if (!entityMap.has(st.normPred)) {
      entityMap.set(st.normPred, { norm: st.normPred, label: capitalize(st.predicate) });
    }
  });

  const entities = Array.from(entityMap.values());
  if (entities.length < 2) return null;

  return {
    statements,
    conclusions,
    entities
  };
}

const PALETTE = [
  { stroke: "#2563EB", fill: "rgba(37, 99, 235, 0.16)", labelBg: "#DBEAFE", labelColor: "#1E40AF" }, // Blue
  { stroke: "#059669", fill: "rgba(5, 150, 105, 0.16)", labelBg: "#D1FAE5", labelColor: "#065F46" }, // Emerald
  { stroke: "#D97706", fill: "rgba(217, 119, 6, 0.16)", labelBg: "#FEF3C7", labelColor: "#92400E" }, // Amber
  { stroke: "#DC2626", fill: "rgba(220, 38, 38, 0.16)", labelBg: "#FEE2E2", labelColor: "#991B1B" }, // Red/Rose
  { stroke: "#7C3AED", fill: "rgba(124, 58, 237, 0.16)", labelBg: "#EDE9FE", labelColor: "#5B21B6" }, // Purple
];

export default function SyllogismDiagramView({ text, explanation = "", compact = false }) {
  const model = useMemo(() => parseSyllogismModel(text), [text]);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!model) return null;

  const { statements, conclusions, entities } = model;
  const noRelations = statements.filter(s => s.type === "NO");
  const simpleLayout = getSimpleSetLayout(statements, entities);
  const parent = simpleLayout?.parent;
  const roots = simpleLayout?.roots || [];
  const width = 560;
  const height = 260;
  const entityLayout = {};

  if (simpleLayout) {
    const rootPositions = getSetRootCenters(roots, statements, parent);
    const depth = (norm, seen = new Set()) => {
      if (seen.has(norm)) return -1;
      const children = [...parent].filter(([, p]) => p === norm).map(([child]) => child);
      return children.length ? 1 + Math.max(...children.map(child => depth(child, new Set([...seen, norm])))) : 0;
    };
    roots.forEach((root, rootIndex) => {
      const rootDepth = depth(root.norm);
      if (rootDepth < 0 || rootDepth > 3) return;
      const descendants = entities.filter(e => {
        let current = e.norm;
        const seen = new Set();
        while (parent.has(current) && !seen.has(current)) {
          seen.add(current);
          current = parent.get(current);
        }
        return current === root.norm;
      });
      descendants.forEach((entity) => {
        let levels = 0;
        let current = entity.norm;
        while (current !== root.norm && levels < 5) {
          current = parent.get(current);
          levels++;
        }
        const radius = Math.max(25, 90 - levels * 21);
        entityLayout[entity.norm] = {
          cx: rootPositions[rootIndex] - levels * 8,
          cy: 130,
          r: radius,
          color: PALETTE[entities.findIndex(e => e.norm === entity.norm) % PALETTE.length],
          isInner: levels > 0,
          isOuter: levels === 0
        };
      });
    });
  }
  const showVenn = !!simpleLayout && entities.every(e => entityLayout[e.norm]);

  return (
    <div className={`rounded-xl border border-indigo-200/90 bg-white shadow-2xs overflow-hidden transition-all ${compact ? "p-3" : "p-4"}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-indigo-100 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <CircleDot size={12} />
          </div>
          <span className="font-extrabold text-xs text-indigo-950 uppercase tracking-wider">
            {showVenn ? "Syllogism Set Diagram" : "Syllogism Relationship Diagram"}
          </span>
          <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
            {statements.length} Statement{statements.length > 1 ? "s" : ""}
          </span>
        </div>

        {showVenn && <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 transition-colors cursor-pointer"
        >
          {isExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          <span>{isExpanded ? "Standard View" : "Enlarge Venn"}</span>
        </button>}
      </div>

      {/* SVG Venn Diagram Container */}
      {showVenn ? <div className={`w-full overflow-x-auto bg-slate-50/70 rounded-xl border border-slate-200/80 p-2 flex items-center justify-center transition-all ${isExpanded ? "min-h-[340px]" : "min-h-[200px]"}`}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className={`w-full h-auto max-w-[560px] select-none ${isExpanded ? "scale-105" : ""}`}
        >
          <defs>
            <pattern id="diagHatch" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="6" stroke="#4F46E5" strokeWidth="1.2" opacity="0.3" />
            </pattern>
          </defs>

          {/* Draw Disjoint Connecting Lines (NO relation) with Red ✗ */}
          {noRelations.map((noRel, idx) => {
            const p1 = entityLayout[noRel.normSubj];
            const p2 = entityLayout[noRel.normPred];
            if (!p1 || !p2) return null;
            const midX = (p1.cx + p2.cx) / 2;
            const midY = 40 + idx * 24;

            return (
              <g key={`no-${idx}`}>
                <path
                  d={`M ${p1.cx} ${p1.cy - p1.r} Q ${midX} ${midY} ${p2.cx} ${p2.cy - p2.r}`}
                  fill="none"
                  stroke="#DC2626"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                />
                <circle cx={midX} cy={midY + 12} r="10" fill="#DC2626" />
                <text
                  x={midX}
                  y={midY + 16}
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="12"
                  fontWeight="bold"
                >
                  ✗
                </text>
                <text
                  x={midX}
                  y={midY + 30}
                  textAnchor="middle"
                  fill="#991B1B"
                  fontSize="9"
                  fontWeight="extrabold"
                >
                  NO {noRel.subject.toUpperCase()} IS {noRel.predicate.toUpperCase()}
                </text>
              </g>
            );
          })}

          {/* Render Entity Circles (Outer / Larger circles first so inner circles stay visible) */}
          {entities
            .map(e => ({ ...e, layout: entityLayout[e.norm] }))
            .sort((a, b) => (b.layout?.r || 0) - (a.layout?.r || 0))
            .map((entity, i) => {
              const layout = entity.layout;
              if (!layout) return null;

              return (
                <g key={entity.norm} className="transition-all">
                  {/* Circle fill & border */}
                  <circle
                    cx={layout.cx}
                    cy={layout.cy}
                    r={layout.r}
                    fill={layout.color.fill}
                    stroke={layout.color.stroke}
                    strokeWidth="2.5"
                    className="drop-shadow-xs"
                  />

                  {/* Entity Label Badge */}
                  <g transform={`translate(${layout.cx}, ${layout.cy - layout.r + 18})`}>
                    <rect
                      x="-42"
                      y="-11"
                      width="84"
                      height="20"
                      rx="10"
                      fill={layout.color.labelBg}
                      stroke={layout.color.stroke}
                      strokeWidth="1.2"
                    />
                    <text
                      x="0"
                      y="3"
                      textAnchor="middle"
                      fill={layout.color.labelColor}
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="system-ui, -apple-system, sans-serif"
                    >
                      {entity.label.length > 12 ? entity.label.slice(0, 11) + "…" : entity.label}
                    </text>
                  </g>
                </g>
              );
            })}
        </svg>
      </div> : <div className="grid sm:grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
        {statements.map((statement, index) => (
          <div key={index} className="rounded-lg border border-indigo-100 bg-white px-3 py-2 text-sm font-semibold text-slate-800">
            {statement.raw}
          </div>
        ))}
      </div>}
      {showVenn && <p className="mt-2 text-[11px] text-slate-500">Illustrative set layout. Only the relationships listed below are guaranteed.</p>}

      {/* Logical Relationship Summary Cards */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {statements.map((st, i) => {
          let badgeBg = "bg-blue-50 text-blue-800 border-blue-200";
          let symbol = "⊆";
          if (st.type === "SOME") {
            badgeBg = "bg-emerald-50 text-emerald-800 border-emerald-200";
            symbol = "∩";
          } else if (st.type === "SOME_NOT" || st.type === "ALL_NOT") {
            badgeBg = "bg-amber-50 text-amber-800 border-amber-200";
            symbol = st.type === "ALL_NOT" ? "⊆ not" : "some outside";
          } else if (st.type === "NO") {
            badgeBg = "bg-rose-50 text-rose-800 border-rose-200";
            symbol = "∦ (Disjoint)";
          } else if (st.type === "ONLY_A_FEW") {
            badgeBg = "bg-amber-50 text-amber-800 border-amber-200";
            symbol = "∩ (Only a few)";
          }

          return (
            <span
              key={i}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${badgeBg}`}
            >
              <span className="font-bold">{st.subject}</span>
              <span className="font-mono text-slate-500 font-bold">{symbol}</span>
              <span className="font-bold">{st.predicate}</span>
            </span>
          );
        })}
      </div>

      {/* Conclusions Assessment (if present in question) */}
      {conclusions.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-indigo-100 space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Conclusion Verification:
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {conclusions.map((conc, i) => {
              const follows = conc.follows;
              return (
                <div
                  key={i}
                  className={`p-2 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                    follows === true
                      ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                      : follows === false
                      ? "bg-rose-50/80 border-rose-200 text-rose-900"
                      : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-[10px] px-1.5 py-0.5 rounded bg-white border border-black/10 shrink-0">
                      {conc.num}
                    </span>
                    <span className="font-medium text-[11px] leading-tight">{conc.text}</span>
                  </div>
                  {follows === true && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                      <CheckCircle2 size={11} /> Follows
                    </span>
                  )}
                  {follows === false && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full shrink-0">
                      <XCircle size={11} /> Does not follow
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
