export function parseSolvedArrangement(explanation, passage = '') {
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
