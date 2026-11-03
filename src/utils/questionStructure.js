// Locate MCQs by option evidence, rather than requiring an unbroken 1..N sequence.
// Numbered puzzle clues and calculation steps have no A/B/C option set.
export function questionPositions(text) {
  // Some memory-based papers print question numbers as a standalone line
  // (`01\nQuestion text`) without a dot or parenthesis. Accept that layout while
  // still requiring the bare number to end at the line break, so puzzle clues
  // and values inside questions do not become question markers.
  const marker = /(?:^|\n)[ \t]*(?:(question|ques|q)[ .:\-]*)?(?:\((\d{1,3})\)|(\d{1,3})(?:[.):\-][ \t]*|(?=\r?\n)|[ \t]+(?=\S)))[ \t]*/gim;
  const lineCandidates = [...text.matchAll(marker)].map(m => ({
    num: Number(m[2] || m[3]), index: m.index, matchLen: m[0].length,
    explicitPrefix: Boolean(m[1]),
  }));
  // PDF layout reconstruction can place `Q17.` on the same visual line as the
  // previous question's final option. An explicit Q marker is unambiguous and
  // must be detected even when it is not at the beginning of a text line.
  const inlineExplicit = [...text.matchAll(/\b(question|ques|q)[ \t]*(?:\((\d{1,3})\)|(\d{1,3})(?:[.):\-]|(?=\s)))[ \t]*/gim)].map(m => ({
    num: Number(m[2] || m[3]), index: m.index, matchLen: m[0].length,
    explicitPrefix: true,
  }));
  const allCandidates = [...lineCandidates];
  for (const candidate of inlineExplicit) {
    const duplicate = allCandidates.findIndex(p => p.num === candidate.num && Math.abs(p.index - candidate.index) < 20);
    if (duplicate >= 0) allCandidates[duplicate] = candidate;
    else allCandidates.push(candidate);
  }
  allCandidates.sort((a, b) => a.index - b.index);
  // Some PDFs inconsistently preserve the Q prefix (Q5, then 6., 7., Q8).
  // Keep explicit markers authoritative, but recover a bare marker when it is
  // followed by a real A/B/C option set. This avoids losing large stretches of
  // mixed-format papers while still rejecting table values and puzzle clues.
  const explicitCount = allCandidates.filter(p => p.explicitPrefix).length;
  if (explicitCount >= 3) {
    const explicit = allCandidates.filter(p => p.explicitPrefix);
    const selected = new Map(explicit.map(p => [p.num, p]));
    for (const p of allCandidates) {
      if (p.explicitPrefix || selected.has(p.num)) continue;
      const sample = text.slice(p.index + p.matchLen, p.index + p.matchLen + 2200);
      const labels = [...sample.matchAll(/(?:^|\s)(?:\(([a-e])\)|([a-e])[).:])[ \t]*/gim)]
        .map(m => ({ label: (m[1] || m[2]).toUpperCase(), index: m.index }));
      const a = labels.find(x => x.label === 'A');
      const b = labels.find(x => x.label === 'B' && (!a || x.index > a.index));
      const c = labels.find(x => x.label === 'C' && (!b || x.index > b.index));
      if (!a || !b || !c) continue;
      const existing = selected.get(p.num);
      if (!existing || c.index < existing.optionEvidenceDistance) {
        selected.set(p.num, { ...p, optionEvidenceDistance: c.index });
      }
    }
    // Shared-option questions may have no options below each stem. Recover a
    // bare marker only when it is bracketed by two already trusted numbers.
    let changed = true;
    while (changed) {
      changed = false;
      for (const p of allCandidates) {
        if (p.explicitPrefix || selected.has(p.num)) continue;
        const before = selected.get(p.num - 1);
        const after = selected.get(p.num + 1);
        if (before && after && before.index < p.index && p.index < after.index) {
          selected.set(p.num, p);
          changed = true;
        }
      }
    }
    // A chart or puzzle sentence can contain text such as `box Q, 440 ...`.
    // When the paper provides a strong contiguous 1..N question sequence,
    // discard larger Q-number lookalikes outside that proven sequence.
    let contiguousEnd = 0;
    while (selected.has(contiguousEnd + 1)) contiguousEnd++;
    const trusted = contiguousEnd >= 10
      ? [...selected.values()].filter(p => p.num <= contiguousEnd)
      : [...selected.values()];
    return trusted.sort((a, b) => a.index - b.index);
  }
  const candidates = allCandidates;
  // Explicit Q-prefixed questions may legitimately share one common option
  // legend (for example inequality Q71-Q73), so they do not each need an
  // A/B/C option block to prove that they are questions.
  const numericOptions = new Set();
  const numericQuestions = new Set();
  for (let i = 0; i < candidates.length; i++) {
    if (numericOptions.has(i)) continue;
    const run = candidates.slice(i + 1, i + 5);
    if (run.length === 4 && run.every((p, j) => p.num === j + 1)) {
      numericQuestions.add(i);
      for (let j = 1; j <= 4; j++) numericOptions.add(i + j);
      if (candidates[i + 5]?.num === 5) numericOptions.add(i + 5);
    }
  }
  return candidates.filter((p, i) => {
    if (numericOptions.has(i)) return false;
    if (numericQuestions.has(i)) return true;
    const block = text.slice(p.index + p.matchLen, candidates[i + 1]?.index ?? text.length);
    const labels = new Set([...block.matchAll(/(?:^|\s)(?:\(([a-e])\)|([a-e])[).:])[ \t]*/gim)]
      .map(m => (m[1] || m[2]).toUpperCase()));
    return labels.has('A') && labels.has('B') && labels.has('C');
  });
}

// Source text, options and shared context remain authoritative during AI enrichment.
export function mergeExtractedQuestions(source, ai) {
  if (!source.length) return ai;
  const byNumber = new Map(ai.map(q => [Number(q.questionNumber ?? q.question_number), q]));
  const solvedTable = value => {
    const lines = String(value || '').split(/\r?\n/);
    const start = lines.findIndex(line => /^\s*\|.+\|\s*$/.test(line));
    if (start < 0 || !/^\s*\|[\s:|-]+\|\s*$/.test(lines[start + 1] || '')) return '';
    const table = [];
    for (const line of lines.slice(start)) {
      if (!/^\s*\|.+\|\s*$/.test(line)) break;
      table.push(line.trim());
    }
    return table.length >= 4 ? table.join('\n') : '';
  };
  const isPuzzle = q => !/quantitative|english/i.test(q.section || '') &&
    /(?:puzzle|seating|sits?|floors?|boxes?|born|arrangement|months?)/i.test(`${q.passage || ''} ${q.question || ''}`);
  const merged = source.map(q => {
    const enhancement = byNumber.get(Number(q.questionNumber));
    if (!enhancement) return isPuzzle(q) && !solvedTable(q.explanation)
      ? { ...q, needs_review: true } : q;
    const sourceExplanation = q.explanation || '';
    const aiExplanation = enhancement.explanation || enhancement.solutionText || '';
    const aiTable = isPuzzle(q) ? solvedTable(aiExplanation) : '';
    const explanation = aiTable && !solvedTable(sourceExplanation)
      ? `${sourceExplanation ? `${sourceExplanation}\n\n` : ''}### Solved Arrangement\n${aiTable}${aiExplanation.replace(aiTable, '').trim() ? `\n\n${aiExplanation.replace(aiTable, '').replace(/###\s*Solved Arrangement/gi, '').trim()}` : ''}`.trim()
      : sourceExplanation || aiExplanation;
    const sourceAnswer = q.source_answer || enhancement.source_answer || '';
    return { ...enhancement, ...q, explanation, solutionText: explanation,
      source_answer: sourceAnswer,
      correctAnswerIndex: q.source_answer ? q.correctAnswerIndex : enhancement.correctAnswerIndex,
      needs_review: !sourceAnswer || !explanation || (isPuzzle(q) && !solvedTable(explanation)),
    };
  });
  const tablesByPassage = new Map();
  for (const q of merged) {
    if (isPuzzle(q) && q.passage && solvedTable(q.explanation)) tablesByPassage.set(q.passage.trim(), solvedTable(q.explanation));
  }
  return merged.map(q => {
    const table = isPuzzle(q) && q.passage ? tablesByPassage.get(q.passage.trim()) : '';
    if (!table || solvedTable(q.explanation)) return q;
    const explanation = `${q.explanation ? `${q.explanation}\n\n` : ''}### Solved Arrangement\n${table}`;
    return { ...q, explanation, solutionText: explanation, needs_review: !q.source_answer };
  });
}
