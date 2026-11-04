// Solve only complete, linear arithmetic equations whose result exactly
// matches one printed option. Ambiguous PDF math is left for visual review.
const format = value => String(Number(value.toFixed(6)));

function expressionValue(source, unknown) {
  const text = source
    .replace(/[−–—]/g, '-')
    .replace(/[×x]/g, '*')
    .replace(/÷/g, '/')
    .replace(/\b(?:st|nd|rd|th)\b/gi, '')
    .replace(/\bof\b/gi, '*')
    .replace(/(\d+(?:\.\d+)?|\?)\s*%/g, '($1/100)')
    .replace(/\s+/g, '');
  const tokens = text.match(/(?:\d+(?:\.\d+)?|\.\d+|[()+*/?\-])/g) || [];
  if (!tokens.length || tokens.join('') !== text) return null;
  let position = 0;
  const factor = () => {
    const token = tokens[position++];
    if (token === '+') return factor();
    if (token === '-') { const value = factor(); return value === null ? null : -value; }
    if (token === '(') {
      const value = expression();
      if (tokens[position++] !== ')') return null;
      return value;
    }
    if (token === '?') return unknown;
    return token && /^\d*\.?\d+$/.test(token) ? Number(token) : null;
  };
  const term = () => {
    let value = factor();
    while (tokens[position] === '*' || tokens[position] === '/') {
      const op = tokens[position++];
      const next = factor();
      if (value === null || next === null || (op === '/' && next === 0)) return null;
      value = op === '*' ? value * next : value / next;
    }
    return value;
  };
  const expression = () => {
    let value = term();
    while (tokens[position] === '+' || tokens[position] === '-') {
      const op = tokens[position++];
      const next = term();
      if (value === null || next === null) return null;
      value = op === '+' ? value + next : value - next;
    }
    return value;
  };
  const result = expression();
  return position === tokens.length && Number.isFinite(result) ? result : null;
}

function numericOption(value) {
  const text = String(value || '').trim().replace(/,/g, '');
  if (/^[+-]?\d+(?:\.\d+)?$/.test(text)) return Number(text);
  if (/^[+-]?\d+\/\d+$/.test(text)) {
    const [top, bottom] = text.split('/').map(Number);
    return bottom ? top / bottom : null;
  }
  return null;
}

export function solveSimpleEquationQuestion(question) {
  const statement = String(question?.question || question?.question_text || '').trim();
  const sides = statement.split('=');
  if (sides.length !== 2 || (statement.match(/\?/g) || []).length !== 1 ||
      /[√∛²³⁴⁵⁶⁷⁸⁹^\n]|\b(?:approx|round)\b/i.test(statement)) return null;
  const [left, right] = sides;
  const leftValues = [0, 1, 2].map(x => expressionValue(left, x));
  const rightValues = [0, 1, 2].map(x => expressionValue(right, x));
  if ([...leftValues, ...rightValues].some(x => x === null)) return null;
  const differences = leftValues.map((x, i) => x - rightValues[i]);
  const slope = differences[1] - differences[0];
  if (!Number.isFinite(slope) || Math.abs(slope) < 1e-10 ||
      Math.abs(differences[2] - differences[0] - 2 * slope) > 1e-7) return null;
  const answer = -differences[0] / slope;
  if (!Number.isFinite(answer)) return null;
  const options = Array.isArray(question.options)
    ? question.options.map((value, index) => [String.fromCharCode(65 + index), value])
    : Object.entries(question.options || {});
  if (!['A', 'B', 'C', 'D', 'E'].every(letter => options.some(([key]) => key === letter))) return null;
  const matches = options.filter(([, value]) => {
    const number = numericOption(value);
    return number !== null && Math.abs(number - answer) < Math.max(1e-6, Math.abs(answer) * 1e-7);
  });
  if (matches.length !== 1) return null;
  const [letter] = matches[0];
  const knownSide = left.includes('?') ? right : left;
  const knownValue = left.includes('?') ? rightValues[0] : leftValues[0];
  const variableAtZero = left.includes('?') ? leftValues[0] : rightValues[0];
  const coefficient = left.includes('?') ? leftValues[1] - leftValues[0] : rightValues[1] - rightValues[0];
  const explanation = `Step 1: Evaluate the known side: ${knownSide.trim()} = ${format(knownValue)}.\n` +
    `Step 2: The other side simplifies to ${format(coefficient)} × ? + ${format(variableAtZero)}. Solve ${format(coefficient)} × ? + ${format(variableAtZero)} = ${format(knownValue)}.\n` +
    `Step 3: ? = ${format(answer)}. This matches option ${letter}.`;
  return { answerLetter: letter, explanation };
}
