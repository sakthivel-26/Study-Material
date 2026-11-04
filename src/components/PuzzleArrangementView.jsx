import React from 'react';
import { parseSolvedArrangement } from '../utils/puzzleArrangement.js';

export default function PuzzleArrangementView({ explanation, passage }) {
  const arrangement = parseSolvedArrangement(explanation, passage);
  if (!arrangement || arrangement.type === 'table') return null;
  const { headers, data, type } = arrangement;
  const label = row => row.map((cell, index) => `${headers[index]}: ${cell}`).join(' · ');
  const heading = {
    linear: 'Linear seating', 'two-row': 'Two row seating', circle: 'Circular seating',
    square: 'Square seating', triangle: 'Triangular seating', floor: 'Floor arrangement',
    month: 'Month and date schedule',
  }[type];
  const isShape = ['circle', 'square', 'triangle'].includes(type);
  const rowColumn = headers.findIndex(header => /^row$/i.test(header));
  const rowGroups = type === 'two-row' && rowColumn >= 0
    ? [...new Set(data.map(row => row[rowColumn]))].map(name => ({ name, seats: data.filter(row => row[rowColumn] === name) }))
    : [];
  const positions = data.map((_, index) => {
    const angle = -Math.PI / 2 + index * 2 * Math.PI / data.length;
    if (type === 'square') {
      const side = index / data.length * 4;
      if (side < 1) return [side, 0];
      if (side < 2) return [1, side - 1];
      if (side < 3) return [3 - side, 1];
      return [0, 4 - side];
    }
    if (type === 'triangle') {
      const side = index / data.length * 3;
      if (side < 1) return [0.5 + side / 2, side];
      if (side < 2) return [1 - (side - 1), 1];
      return [(side - 2) / 2, 3 - side];
    }
    return [0.5 + 0.43 * Math.cos(angle), 0.5 + 0.43 * Math.sin(angle)];
  });
  return <section className="rounded-xl border border-indigo-200 bg-white p-3" aria-label={`${heading} diagram`}>
    <h3 className="text-xs font-bold text-indigo-900 mb-2">Solved arrangement · {heading}</h3>
    {isShape ? <div className="relative mx-auto my-5 h-64 w-full max-w-sm" role="img" aria-label={data.map(label).join('; ')}>
      {type === 'triangle' ? <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" aria-hidden="true"><polygon points="50,12 90,85 10,85" fill="none" stroke="#a5b4fc" strokeWidth="2" /></svg>
        : <div className={`absolute inset-[18%] border-2 border-indigo-300 ${type === 'circle' ? 'rounded-full' : 'rounded-lg'}`} />}
      {data.map((row, index) => <div key={index} title={label(row)}
        className="absolute max-w-24 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-indigo-300 bg-indigo-50 px-2 py-1 text-center text-[10px] font-semibold text-indigo-950 shadow-sm"
        style={{ left: `${positions[index][0] * 80 + 10}%`, top: `${positions[index][1] * 76 + 12}%` }}>
        <span className="block text-indigo-500">{index + 1}</span>{row.join(' · ')}
      </div>)}
    </div> : type === 'two-row' && rowGroups.length === 2 ? <div className="space-y-3">
      {rowGroups.map(group => <div key={group.name}>
        <p className="mb-1 text-xs font-bold text-indigo-800">Row {group.name}</p>
        <div className="flex flex-wrap gap-2">{group.seats.map((row, index) => <div key={index} className="rounded-lg border border-indigo-200 bg-indigo-50 p-2 text-xs">{label(row)}</div>)}</div>
      </div>)}
    </div> : type === 'two-row' ? <div className="space-y-1.5">
      {data.map((row, index) => <div key={index} className="rounded-lg border border-indigo-200 bg-indigo-50 p-2 text-xs">{label(row)}</div>)}
    </div> : <div className={type === 'linear' ? 'flex flex-wrap gap-2' : 'space-y-1.5'}>
      {data.map((row, index) => <div key={index} className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-950">
        <span className="font-bold">{index + 1}. </span>{label(row)}
      </div>)}
    </div>}
    <p className="mt-2 text-[11px] text-slate-500">Read the solved table below for every attribute. The diagram follows the table’s row order.</p>
  </section>;
}
