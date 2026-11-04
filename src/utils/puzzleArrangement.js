export function formatFinalFloorArrangement(explanation) {
  const text = String(explanation || '');
  if (/\|\s*Floor\s*\|\s*Person\s*\|/i.test(text)) return text;
  const lines = text.split(/\r?\n/).map(line => line.trim());
  let finalRows = null;
  for (let i = 0; i < lines.length; i++) {
    const first = lines[i].match(/^(\d{1,2})\s+([A-Z])\s+([A-Za-z][A-Za-z\s-]*)$/);
    if (!first) continue;
    const rows = [];
    for (let j = i; j < lines.length; j++) {
      const row = lines[j].match(/^(\d{1,2})\s+([A-Z])\s+([A-Za-z][A-Za-z\s-]*)$/);
      if (!row || (rows.length && Number(row[1]) !== Number(rows.at(-1)[0]) - 1)) break;
      rows.push([row[1], row[2], row[3].trim()]);
    }
    if (rows.length >= 3 && new Set(rows.map(row => row[1])).size === rows.length &&
        (!finalRows || rows.length >= finalRows.length)) finalRows = rows;
  }
  if (!finalRows) return text;
  const table = `| Floor | Person | Mobile phone brand |\n| --- | --- | --- |\n${finalRows.map(row => `| ${row.join(' | ')} |`).join('\n')}`;
  return `${text.trim()}\n\n### Final Solved Arrangement\n${table}`;
}

export function parseSolvedArrangement(explanation, passage = '') {
  explanation = formatFinalFloorArrangement(explanation);
  const lines = String(explanation || '').split(/\r?\n/);
  const start = lines.findIndex((line, index) => /^\s*\|.+\|\s*$/.test(line) &&
    /^\s*\|(?:\s*:?-+:?\s*\|){2,}\s*$/.test(lines[index + 1] || ''));
  if (start < 0) return null;
  const rows = [];
  for (let i = start; i < lines.length && /^\s*\|.+\|\s*$/.test(lines[i]); i++) {
    if (/^\s*\|(?:\s*:?-+:?\s*\|){2,}\s*$/.test(lines[i])) continue;
    rows.push(lines[i].trim().slice(1, -1).split('|').map(cell => cell.trim()));
  }
  if (rows.length < 3 || rows.slice(1).some(row => row.length !== rows[0].length)) return null;
  const headers = rows[0];
  const data = rows.slice(1);
  const context = `${passage} ${headers.join(' ')}`.toLowerCase();
  let type = 'linear';
  if (/parallel rows|two rows|2 rows|two linear|facing each other/.test(context)) type = 'two-row';
  else if (/triangle|triangular/.test(context)) type = 'triangle';
  else if (/square|four sides|4 sides/.test(context)) type = 'square';
  else if (/circle|circular|round table/.test(context)) type = 'circle';
  else if (/floor|flat|storey|story/.test(context)) type = 'floor';
  else if (/month|date|born on|scheduled on/.test(context)) type = 'month';
  else if (!/seat|position|row|line|left|right|facing/.test(context)) return { headers, data, type: 'table' };
  if (['circle', 'square', 'triangle', 'linear', 'two-row'].includes(type) &&
      !headers.some(header => /seat|position|place|row|order/i.test(header))) type = 'table';
  return { headers, data, type };
}
