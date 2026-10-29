import React, { useMemo, useState } from "react";
import { CircleDot, CheckCircle2, XCircle, Info, Maximize2, Minimize2, Eye } from "lucide-react";

/**
 * Normalizes entity name for matching (singular, lowercase)
 */
function normalizeEntity(name) {
  if (!name) return "";
  let n = name.trim().toLowerCase();
  // Strip trailing 's' or 'es' for simple singularization in entity matching
  if (n.endsWith("ies")) n = n.slice(0, -3) + "y";
  else if (n.endsWith("es") && !n.endsWith("ses") && !n.endsWith("xes")) n = n.slice(0, -2);
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
    const subj = m[2].trim().replace(/^(?:the|all|some|few)\s+/i, "");
    const copula = m[3].toLowerCase().trim();
    const pred = m[4].trim().replace(/^(?:the|all|some|few)\s+/i, "");

    let type = "SOME"; // default
    if (quant === "all") type = "ALL";
    else if (quant === "no") type = "NO";
    else if (quant === "only a few") type = "ONLY_A_FEW";
    else if (copula.includes("not")) type = "SOME_NOT";

    if (subj && pred && subj.length <= 30 && pred.length <= 30) {
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
  const concLineRegex = /(?:(?:[I|V|X\d]+)[\.\)]|\bconclusion\s*[I|V|X\d]*[:\-])\s*([^\n\r]+)/gi;
  let cm;
  while ((cm = concLineRegex.exec(concSection)) !== null) {
    const rawConc = cm[1].trim();
    if (rawConc.length > 5) {
      // Check if explanation indicates this conclusion follows
      const concNum = cm[0].match(/([I|V|X\d]+)/)?.[1] || "";
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

export default function SyllogismDiagramView({ text, compact = false }) {
  const model = useMemo(() => parseSyllogismModel(text), [text]);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!model) return null;

  const { statements, conclusions, entities } = model;
  const numEntities = entities.length;

  // Compute 2D Circle Layout for Venn Diagram
  // Width: 560, Height: 280
  const width = 560;
  const height = 260;

  // We assign centers and radii to each entity based on logical relationships
  const entityLayout = {};

  if (numEntities === 2) {
    const hasAll = statements.some(s => s.type === "ALL");
    const hasNo = statements.some(s => s.type === "NO");

    if (hasAll) {
      // Nested: Inner circle inside outer
      const allStmt = statements.find(s => s.type === "ALL");
      entityLayout[allStmt.normSubj] = { cx: 280, cy: 130, r: 52, color: PALETTE[0], isInner: true };
      entityLayout[allStmt.normPred] = { cx: 280, cy: 130, r: 96, color: PALETTE[1], isOuter: true };
    } else if (hasNo) {
      // Disjoint: separate circles
      entityLayout[entities[0].norm] = { cx: 170, cy: 130, r: 70, color: PALETTE[0] };
      entityLayout[entities[1].norm] = { cx: 390, cy: 130, r: 70, color: PALETTE[1] };
    } else {
      // Overlapping (Some)
      entityLayout[entities[0].norm] = { cx: 220, cy: 130, r: 75, color: PALETTE[0] };
      entityLayout[entities[1].norm] = { cx: 340, cy: 130, r: 75, color: PALETTE[1] };
    }
  } else if (numEntities === 3) {
    // 3 entities: check for nested subset (All A are B)
    const allStmt = statements.find(s => s.type === "ALL");
    if (allStmt) {
      // Subj inside Pred
      entityLayout[allStmt.normSubj] = { cx: 180, cy: 130, r: 42, color: PALETTE[0], isInner: true };
      entityLayout[allStmt.normPred] = { cx: 190, cy: 130, r: 84, color: PALETTE[1], isOuter: true };
      const third = entities.find(e => e.norm !== allStmt.normSubj && e.norm !== allStmt.normPred);
      if (third) {
        const connectsToPred = statements.some(s => (s.normSubj === third.norm && s.normPred === allStmt.normPred) || (s.normPred === third.norm && s.normSubj === allStmt.normPred));
        const isDisjoint = statements.some(s => s.type === "NO" && (s.normSubj === third.norm || s.normPred === third.norm));
        const cx = isDisjoint ? 410 : 330;
        entityLayout[third.norm] = { cx, cy: 130, r: 72, color: PALETTE[2] };
      }
    } else {
      // Tri-circle Venn layout or chain
      entityLayout[entities[0].norm] = { cx: 160, cy: 130, r: 68, color: PALETTE[0] };
      entityLayout[entities[1].norm] = { cx: 280, cy: 130, r: 68, color: PALETTE[1] };
      entityLayout[entities[2].norm] = { cx: 400, cy: 130, r: 68, color: PALETTE[2] };
    }
  } else {
    // 4+ entities: horizontal layout chain
    const step = (width - 120) / (numEntities - 1);
    entities.forEach((ent, idx) => {
      entityLayout[ent.norm] = {
        cx: 60 + idx * step,
        cy: 130,
        r: Math.min(58, step * 0.65),
        color: PALETTE[idx % PALETTE.length]
      };
    });
  }

  // Ensure all entities have layout coordinates
  entities.forEach((ent, idx) => {
    if (!entityLayout[ent.norm]) {
      entityLayout[ent.norm] = {
        cx: 80 + idx * 110,
        cy: 130,
        r: 55,
        color: PALETTE[idx % PALETTE.length]
      };
    }
  });

  // Extract disjoint (NO) relation lines to draw connecting crossbars
  const noRelations = statements.filter(s => s.type === "NO");

  return (
    <div className={`rounded-xl border border-indigo-200/90 bg-white shadow-2xs overflow-hidden transition-all ${compact ? "p-3" : "p-4"}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-indigo-100 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <CircleDot size={12} />
          </div>
          <span className="font-extrabold text-xs text-indigo-950 uppercase tracking-wider">
            Syllogism Venn Diagram Solution
          </span>
          <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
            {statements.length} Statement{statements.length > 1 ? "s" : ""}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 transition-colors cursor-pointer"
        >
          {isExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          <span>{isExpanded ? "Standard View" : "Enlarge Venn"}</span>
        </button>
      </div>

      {/* SVG Venn Diagram Container */}
      <div className={`w-full overflow-x-auto bg-slate-50/70 rounded-xl border border-slate-200/80 p-2 flex items-center justify-center transition-all ${isExpanded ? "min-h-[340px]" : "min-h-[200px]"}`}>
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
                  <g transform={`translate(${layout.cx}, ${layout.isInner ? layout.cy + 4 : (layout.isOuter ? layout.cy - layout.r + 18 : layout.cy + layout.r + 14)})`}>
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
      </div>

      {/* Logical Relationship Summary Cards */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {statements.map((st, i) => {
          let badgeBg = "bg-blue-50 text-blue-800 border-blue-200";
          let symbol = "⊆";
          if (st.type === "SOME") {
            badgeBg = "bg-emerald-50 text-emerald-800 border-emerald-200";
            symbol = "∩";
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
