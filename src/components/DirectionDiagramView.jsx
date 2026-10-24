import React, { useMemo, useState } from "react";
import { Compass, Navigation, MapPin, ArrowRight, Maximize2, RotateCcw, Eye } from "lucide-react";

/**
 * Parses direction sense text (from question, passage, or explanation)
 * and resolves 2D coordinates for SVG drawing.
 */
export function parseDirectionModel(text) {
  if (!text || typeof text !== "string") return null;

  const isDirection = /(?:direction|distance|north|south|east|west|turns\s+right|turns\s+left|walks\s+\d+|point\s+[A-Z]\s+is)/i.test(text);
  if (!isDirection) return null;

  let segments = [];

  // Check 1: Explicit Path Format e.g. [Direction Path: A --(10m North)--> B --(15m East)--> C]
  const explicitMatch = text.match(/\[Direction Path:\s*([^\]]+)\]/i) || text.match(/Direction Path:\s*([^\n\r]+)/i);
  if (explicitMatch) {
    const tokens = explicitMatch[1].split(/(?:-->|->|→|--)/).map(s => s.trim()).filter(Boolean);
    let currentFrom = null;
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i].replace(/[\[\]]/g, "").trim();
      const moveMatch = t.match(/\(?\s*([0-9]+(?:\.[0-9]+)?)\s*(m|km|meters|metres)?\s*,?\s*([a-zA-Z\s\-]+)\)?/i);
      if (moveMatch) {
        const dist = parseFloat(moveMatch[1]);
        const unit = (moveMatch[2] && moveMatch[2].toLowerCase().includes("km")) ? "km" : "m";
        const dir = moveMatch[3].trim().toLowerCase();
        const nextToken = (i + 1 < tokens.length) ? tokens[i + 1].replace(/[\[\]\(\)]/g, "").trim() : null;
        if (currentFrom && nextToken && !nextToken.match(/\d+\s*(m|km)/i)) {
          segments.push({ from: currentFrom, to: nextToken, distance: dist, unit, direction: dir });
          currentFrom = nextToken;
          i++;
        } else if (currentFrom) {
          const toNode = `P${segments.length + 1}`;
          segments.push({ from: currentFrom, to: toNode, distance: dist, unit, direction: dir });
          currentFrom = toNode;
        }
      } else {
        currentFrom = t;
      }
    }
  }

  // Check 2: Relative Point statements e.g. "Point B is 10m north of Point A"
  if (segments.length === 0) {
    const pointRelRegex = /Point\s+([A-Z0-9])\s+is\s+([0-9]+(?:\.[0-9]+)?)\s*(m|km|meters|metres|kms)?\s*(?:to the\s*)?(north|south|east|west|north-?east|north-?west|south-?east|south-?west)\s+of\s+Point\s+([A-Z0-9])/gi;
    let m;
    while ((m = pointRelRegex.exec(text)) !== null) {
      segments.push({
        from: m[5].toUpperCase(),
        to: m[1].toUpperCase(),
        distance: parseFloat(m[2]),
        unit: (m[3] && m[3].toLowerCase().includes("km")) ? "km" : "m",
        direction: m[4].toLowerCase().replace(/\s+/g, "-")
      });
    }
  }

  // Check 3: Walking and turns sequence
  if (segments.length === 0) {
    const clauses = text.split(/(?:[.;]|\bthen\b|\bafter\b|\bagain\b|\bfinally\b|\blastly\b)/i).map(s => s.trim()).filter(Boolean);
    let curDirection = "north";
    let lastPoint = "Start";
    let pIdx = 1;

    const turnMap = {
      north: { right: "east", left: "west" },
      south: { right: "west", left: "east" },
      east: { right: "south", left: "north" },
      west: { right: "north", left: "south" }
    };

    clauses.forEach(clause => {
      const dirMove = clause.match(/(?:walks|travels|moves|goes|drives|runs)?\s*([0-9]+(?:\.[0-9]+)?)\s*(m|km|metres|meters|kms)?\s*(?:towards\s+|in\s+)?(north|south|east|west)/i);
      const turnMove = clause.match(/turns\s+(?:to\s+(?:his|her)\s+)?(right|left)(?:[,\s]+and\s+walks)?\s*([0-9]+(?:\.[0-9]+)?)\s*(m|km|metres|meters|kms)?/i);

      if (turnMove && turnMove[2]) {
        const turn = turnMove[1].toLowerCase();
        const dist = parseFloat(turnMove[2]);
        const unit = (turnMove[3] && turnMove[3].toLowerCase().includes("km")) ? "km" : "m";
        const newDir = turnMap[curDirection]?.[turn] || "east";
        const nextPoint = clause.match(/to\s+reach\s+(?:point\s+)?([A-Z0-9])/i)?.[1]?.toUpperCase() || `P${pIdx}`;
        segments.push({
          from: lastPoint,
          to: nextPoint,
          distance: dist,
          unit,
          direction: newDir
        });
        curDirection = newDir;
        lastPoint = nextPoint;
        pIdx++;
      } else if (dirMove) {
        const dist = parseFloat(dirMove[1]);
        const unit = (dirMove[2] && dirMove[2].toLowerCase().includes("km")) ? "km" : "m";
        const dir = dirMove[3].toLowerCase();
        const nextPoint = clause.match(/to\s+reach\s+(?:point\s+)?([A-Z0-9])/i)?.[1]?.toUpperCase() || `P${pIdx}`;
        segments.push({
          from: lastPoint,
          to: nextPoint,
          distance: dist,
          unit,
          direction: dir
        });
        curDirection = dir;
        lastPoint = nextPoint;
        pIdx++;
      }
    });
  }

  if (segments.length === 0) return null;

  // Resolve 2D coordinates (North is -Y, South is +Y, East is +X, West is -X)
  const dirDelta = (dir, dist) => {
    const d = dir.toLowerCase();
    if (d.includes("north-east") || d.includes("northeast")) return { dx: dist * 0.707, dy: -dist * 0.707 };
    if (d.includes("north-west") || d.includes("northwest")) return { dx: -dist * 0.707, dy: -dist * 0.707 };
    if (d.includes("south-east") || d.includes("southeast")) return { dx: dist * 0.707, dy: dist * 0.707 };
    if (d.includes("south-west") || d.includes("southwest")) return { dx: -dist * 0.707, dy: dist * 0.707 };
    if (d.includes("north")) return { dx: 0, dy: -dist };
    if (d.includes("south")) return { dx: 0, dy: dist };
    if (d.includes("east")) return { dx: dist, dy: 0 };
    if (d.includes("west")) return { dx: -dist, dy: 0 };
    return { dx: dist, dy: 0 };
  };

  const coords = {};
  const firstPt = segments[0].from;
  coords[firstPt] = { x: 0, y: 0, name: firstPt };

  let changed = true;
  let loops = 0;
  while (changed && loops < 10) {
    changed = false;
    loops++;
    segments.forEach(seg => {
      const fromC = coords[seg.from];
      const toC = coords[seg.to];
      const { dx, dy } = dirDelta(seg.direction, seg.distance);

      if (fromC && !toC) {
        coords[seg.to] = { x: fromC.x + dx, y: fromC.y + dy, name: seg.to };
        changed = true;
      } else if (!fromC && toC) {
        coords[seg.from] = { x: toC.x - dx, y: toC.y - dy, name: seg.from };
        changed = true;
      }
    });
  }

  const startPt = segments[0].from;
  const endPt = segments[segments.length - 1].to;
  const startCoord = coords[startPt] || { x: 0, y: 0 };
  const endCoord = coords[endPt] || { x: 0, y: 0 };
  const dx = endCoord.x - startCoord.x;
  const dy = endCoord.y - startCoord.y;
  const displacement = Math.sqrt(dx * dx + dy * dy);

  const northSouth = dy < -0.1 ? "North" : (dy > 0.1 ? "South" : "");
  const eastWest = dx > 0.1 ? "East" : (dx < -0.1 ? "West" : "");
  const netDirection = (northSouth && eastWest) ? `${northSouth}-${eastWest}` : (northSouth || eastWest || "Same Location");

  const totalDistance = segments.reduce((sum, s) => sum + s.distance, 0);

  return {
    segments,
    coords,
    startPoint: startPt,
    endPoint: endPt,
    totalDistance,
    displacement: Math.round(displacement * 100) / 100,
    netDirection,
    unit: segments[0].unit || "m"
  };
}

export default function DirectionDiagramView({ text, compact = false }) {
  const [activeTab, setActiveTab] = useState("diagram"); // 'diagram' | 'path'
  const model = useMemo(() => parseDirectionModel(text), [text]);

  if (!model || !model.segments || model.segments.length === 0) {
    return null;
  }

  const { segments, coords, startPoint, endPoint, totalDistance, displacement, netDirection, unit } = model;

  // Calculate SVG ViewBox
  const pointList = Object.values(coords);
  const xs = pointList.map(p => p.x);
  const ys = pointList.map(p => p.y);

  const minRawX = Math.min(...xs);
  const maxRawX = Math.max(...xs);
  const minRawY = Math.min(...ys);
  const maxRawY = Math.max(...ys);

  const rawWidth = Math.max(10, maxRawX - minRawX);
  const rawHeight = Math.max(10, maxRawY - minRawY);

  // Normalization scale factor for standard SVG viewBox of ~460 x 300
  const targetW = 380;
  const targetH = 220;
  const scale = Math.min(targetW / rawWidth, targetH / rawHeight, 18);

  const padding = 55;
  const svgWidth = Math.max(340, rawWidth * scale + padding * 2);
  const svgHeight = Math.max(220, rawHeight * scale + padding * 2);

  // Map coordinate to SVG space
  const toSvgX = (x) => padding + (x - minRawX) * scale;
  const toSvgY = (y) => padding + (y - minRawY) * scale;

  return (
    <div className="rounded-2xl border border-indigo-200 bg-white/95 overflow-hidden shadow-xs my-3">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
            <Compass size={14} className="animate-spin-slow" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              Direction &amp; Distance Solution Map
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Visual Diagram
              </span>
            </h4>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded-lg text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("diagram")}
            className={`px-2.5 py-1 rounded-md transition-colors ${activeTab === "diagram" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-300 hover:text-white"}`}
          >
            Diagram (Drawing)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("path")}
            className={`px-2.5 py-1 rounded-md transition-colors ${activeTab === "path" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-300 hover:text-white"}`}
          >
            Path Steps ({segments.length})
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === "diagram" ? (
        <div className="relative bg-slate-50/70 p-3 sm:p-4 flex flex-col items-center">
          {/* Compass Rose Widget in Corner */}
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-xl p-2 shadow-xs flex flex-col items-center justify-center w-14 h-14 z-10 pointer-events-none select-none">
            <span className="text-[10px] font-extrabold text-blue-600 leading-none">N ↑</span>
            <div className="flex items-center justify-between w-full px-0.5 my-0.5 text-[9px] font-bold text-slate-400">
              <span>W</span>
              <span>E</span>
            </div>
            <span className="text-[10px] font-bold text-slate-500 leading-none">↓ S</span>
          </div>

          {/* Responsive SVG Drawing */}
          <div className="w-full flex items-center justify-center overflow-x-auto py-1">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="max-w-full h-auto drop-shadow-xs"
              style={{ minHeight: "180px", maxHeight: "320px" }}
            >
              <defs>
                {/* Subtle Grid Pattern */}
                <pattern id="dir-grid" width="16" height="16" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="0.8" fill="#94a3b8" opacity="0.3" />
                </pattern>

                {/* Arrowhead Marker */}
                <marker
                  id="dir-arrow"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#3B82F6" />
                </marker>
                <marker
                  id="dir-arrow-final"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#EF4444" />
                </marker>
              </defs>

              {/* Background Grid */}
              <rect width={svgWidth} height={svgHeight} fill="url(#dir-grid)" rx="12" />

              {/* Direct Shortest Path (Hypotenuse / Displacement) */}
              {displacement > 0 && startPoint !== endPoint && (
                <g>
                  <line
                    x1={toSvgX(coords[startPoint]?.x || 0)}
                    y1={toSvgY(coords[startPoint]?.y || 0)}
                    x2={toSvgX(coords[endPoint]?.x || 0)}
                    y2={toSvgY(coords[endPoint]?.y || 0)}
                    stroke="#F59E0B"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                    opacity="0.85"
                  />
                  {/* Midpoint Label for Shortest Distance */}
                  {(() => {
                    const midX = (toSvgX(coords[startPoint]?.x || 0) + toSvgX(coords[endPoint]?.x || 0)) / 2;
                    const midY = (toSvgY(coords[startPoint]?.y || 0) + toSvgY(coords[endPoint]?.y || 0)) / 2;
                    return (
                      <g transform={`translate(${midX}, ${midY})`}>
                        <rect
                          x="-42"
                          y="-10"
                          width="84"
                          height="18"
                          rx="9"
                          fill="#FEF3C7"
                          stroke="#F59E0B"
                          strokeWidth="1"
                        />
                        <text
                          x="0"
                          y="2.5"
                          textAnchor="middle"
                          fontSize="9"
                          fontWeight="bold"
                          fill="#92400E"
                        >
                          Shortest: {displacement}{unit}
                        </text>
                      </g>
                    );
                  })()}
                </g>
              )}

              {/* Path Segments */}
              {segments.map((seg, idx) => {
                const cFrom = coords[seg.from];
                const cTo = coords[seg.to];
                if (!cFrom || !cTo) return null;

                const x1 = toSvgX(cFrom.x);
                const y1 = toSvgY(cFrom.y);
                const x2 = toSvgX(cTo.x);
                const y2 = toSvgY(cTo.y);

                const midX = (x1 + x2) / 2;
                const midY = (y1 + y2) / 2;
                const isLast = idx === segments.length - 1;

                return (
                  <g key={`seg-${idx}`}>
                    {/* Shadow line */}
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#94A3B8"
                      strokeWidth="4"
                      strokeLinecap="round"
                      opacity="0.25"
                    />
                    {/* Colored Path Line */}
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={isLast ? "#EF4444" : "#2563EB"}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      markerEnd={isLast ? "url(#dir-arrow-final)" : "url(#dir-arrow)"}
                    />

                    {/* Distance Pill Badge */}
                    <g transform={`translate(${midX}, ${midY})`}>
                      <rect
                        x="-24"
                        y="-9"
                        width="48"
                        height="18"
                        rx="9"
                        fill="#FFFFFF"
                        stroke="#CBD5E1"
                        strokeWidth="1"
                        filter="drop-shadow(0 1px 1px rgba(0,0,0,0.08))"
                      />
                      <text
                        x="0"
                        y="3"
                        textAnchor="middle"
                        fontSize="9.5"
                        fontWeight="700"
                        fill="#1E293B"
                      >
                        {seg.distance}{seg.unit || unit}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Point Markers */}
              {pointList.map((pt) => {
                const px = toSvgX(pt.x);
                const py = toSvgY(pt.y);
                const isStart = pt.name === startPoint;
                const isEnd = pt.name === endPoint;

                const color = isStart ? "#10B981" : isEnd ? "#EF4444" : "#3B82F6";
                const labelText = isStart ? `Start (${pt.name})` : isEnd ? `End (${pt.name})` : pt.name;

                return (
                  <g key={`pt-${pt.name}`} transform={`translate(${px}, ${py})`}>
                    {/* Outer glow ring */}
                    <circle r="9" fill={color} opacity="0.2" />
                    {/* Inner core circle */}
                    <circle r="5" fill="#FFFFFF" stroke={color} strokeWidth="2.5" />

                    {/* Node text label badge */}
                    <g transform="translate(0, -12)">
                      <rect
                        x="-28"
                        y="-12"
                        width="56"
                        height="16"
                        rx="4"
                        fill={isStart ? "#ECFDF5" : isEnd ? "#FEF2F2" : "#F8FAFC"}
                        stroke={color}
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="-1"
                        textAnchor="middle"
                        fontSize="8.5"
                        fontWeight="bold"
                        fill={isStart ? "#065F46" : isEnd ? "#991B1B" : "#1E293B"}
                      >
                        {labelText}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Quick Metrics Cards */}
          <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 pt-2 border-t border-slate-200">
            <div className="p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] text-slate-500 font-semibold block">Start Point</span>
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                Point {startPoint}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] text-slate-500 font-semibold block">End Point</span>
              <span className="text-xs font-bold text-rose-700 flex items-center gap-1 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                Point {endPoint}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] text-slate-500 font-semibold block">Shortest Distance</span>
              <span className="text-xs font-extrabold text-amber-700 mt-0.5 block">
                {displacement} {unit}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] text-slate-500 font-semibold block">Direction from Start</span>
              <span className="text-xs font-extrabold text-indigo-700 mt-0.5 block">
                🧭 {netDirection}
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Path Steps List View */
        <div className="p-3 sm:p-4 bg-slate-50/50 space-y-2">
          {segments.map((seg, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 text-xs shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px] flex items-center justify-center shrink-0 border border-indigo-200">
                  {idx + 1}
                </span>
                <span className="font-semibold text-slate-800">
                  Point <strong className="text-slate-900">{seg.from}</strong>
                </span>
                <ArrowRight size={13} className="text-slate-400" />
                <span className="font-semibold text-slate-800">
                  Point <strong className="text-slate-900">{seg.to}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-[11px] border border-blue-200 capitalize">
                  {seg.direction}
                </span>
                <span className="font-bold text-slate-700 text-xs">
                  {seg.distance} {seg.unit || unit}
                </span>
              </div>
            </div>
          ))}

          <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 flex items-center justify-between font-medium">
            <span>Total Walking Distance: <strong>{totalDistance} {unit}</strong></span>
            <span>Net Displacement: <strong className="text-indigo-800">{displacement} {unit} ({netDirection})</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}
