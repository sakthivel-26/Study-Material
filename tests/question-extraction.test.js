import test from 'node:test';
import assert from 'node:assert/strict';
import { aiSessionState, parseUploadedQuestions, inferSectionFromContent, extractPassagesAndRanges, convertTextTableToMarkdown, isDIQuestion, findBestMatchingChartPage, findMatchingChartPages, generateMockTestFromPDF } from '../src/utils/aiTestGenerator.js';
import { mergeExtractedQuestions, questionPositions } from '../src/utils/questionStructure.js';

const mcq = n => `${n}. What is the correct value?\n(a) ${n}\n(b) ${n + 1}\n(c) ${n + 2}\n(d) ${n + 3}\n(e) ${n + 4}`;
const paper = Array.from({ length: 100 }, (_, i) => mcq(i + 1)).join('\n');

test('all 100 source questions survive repeated stems and a partial AI result', () => {
  const source = parseUploadedQuestions(paper);
  assert.equal(source.length, 100);
  const merged = mergeExtractedQuestions(source, source.slice(0, 5).map(q => ({ ...q, question: 'changed', options: ['invented'], explanation: 'AI working' })));
  assert.equal(merged.length, 100);
  assert.equal(merged[0].question, 'What is the correct value?');
  assert.equal(merged[0].options.A, '1');
  assert.equal(merged[99].questionNumber, 100);
});

test('numbering gaps and Q./parenthesized markers do not stop at question five', () => {
  const text = [mcq(1), mcq(2), mcq(10).replace('10.', 'Q.10:'), mcq(45).replace('45.', '(45)')].join('\n');
  assert.deepEqual(questionPositions(text).map(p => p.num), [1, 2, 10, 45]);
  assert.equal(parseUploadedQuestions(text).length, 4);
});

test('standalone zero-padded numbers and printed correct options are extracted', () => {
  const text = `Quantitative Aptitude QUESTIONS 01 - 02
Directions (1-2): Solve the following.
01
What is 10 + 5?
(a) 10 (b) 12 (c) 15 (d) 18 (e) 20
Correct Option - c
02
What is 20 - 8?
(a) 10 (b) 12 (c) 14 (d) 16 (e) 18
Correct Option - b`;
  const questions = parseUploadedQuestions(text);
  assert.equal(questions.length, 2);
  assert.equal(questions[0].questionNumber, 1);
  assert.equal(questions[0].source_answer, 'C');
  assert.equal(questions[0].options.E, '20');
  assert.equal(questions[1].source_answer, 'B');
});

test('PDF.js same-line bare question numbers are extracted', () => {
  const text = `01   What is 10 + 5?\n(a) 10 (b) 12 (c) 15 (d) 18 (e) 20\nCorrect Option - c
02   What is 20 - 8?\n(a) 10 (b) 12 (c) 14 (d) 16 (e) 18\nCorrect Option - b`;
  assert.deepEqual(parseUploadedQuestions(text).map(q => q.questionNumber), [1, 2]);
});

test('complete puzzle including numbered clues attaches only to its explicit range', () => {
  const passage = 'Directions (1-2): Four persons sit in a row.\n(1) A is left of B.\n(2) C is right of D.';
  const text = `Reasoning Ability\n${passage}\n${mcq(1)}\n${mcq(2)}\n${mcq(3)}`;
  const questions = parseUploadedQuestions(text);
  assert.equal(questions.length, 3);
  assert.equal(extractPassagesAndRanges(text).passageRanges[0].passage, passage);
  assert.equal(questions[1].passage, passage);
  assert.equal(questions[2].passage, '');
  assert.equal(questions[0].section, 'Reasoning Ability');
});

test('shared direction options stay in passage but questions stay out', () => {
  const text = `Directions (71-73): Select the appropriate answer.
(a) Only I (b) Only II (c) Either I or II (d) Both I and II (e) Neither I nor II
Q71. Statements: A > B. Conclusions: I. A > B II. B > A
Q72. Statements: C = D. Conclusions: I. C ≤ D II. D ≤ C
Q73. Statements: E < F. Conclusions: I. F > E II. E = F`;
  const questions = parseUploadedQuestions(text);
  assert.equal(questions.length, 3);
  assert.equal(questions[0].options.A, 'Only I');
  assert.equal(questions[2].options.E, 'Neither I nor II');
  assert.doesNotMatch(questions[0].passage, /Q71/i);
  assert.match(questions[0].question, /Statements/);
});

test('inline Q markers survive two-column PDF lines without chart-number impostors', () => {
  const questions = Array.from({ length: 12 }, (_, i) =>
    `Q${i + 1}. Question ${i + 1}? (a) One (b) Two (c) Three (d) Four (e) Five`
  ).join(' ');
  const parsed = parseUploadedQuestions(`Box Q. 440 units\n${questions}`);
  assert.equal(parsed.length, 12);
  assert.deepEqual(parsed.map(q => q.questionNumber), Array.from({ length: 12 }, (_, i) => i + 1));
});

test('S-prefixed solutions keep answers and solved arrangement tables', () => {
  const text = `${mcq(1)}\n${mcq(2)}
Solution
Directions (1-2):
Box
T
P
S1. Ans.(a)
Sol. Step 1: T is above P.
1. This numbered deduction must not overwrite S1.
S2. Ans.(b)`;
  const questions = parseUploadedQuestions(text);
  assert.equal(questions.length, 2);
  assert.equal(questions[0].source_answer, 'A');
  assert.match(questions[0].explanation, /\| Position \| Box \|/);
  assert.match(questions[0].explanation, /T is above P/);
  assert.equal(questions[1].source_answer, 'B');
});

test('classification uses content instead of fixed 1-35/36-65 numbering', () => {
  assert.equal(inferSectionFromContent('Who sits to the immediate left of A?', '', 1), 'Reasoning Ability');
  assert.equal(inferSectionFromContent('Find the value of 3 + 4', '', 80), 'Quantitative Aptitude');
});

test('reading passage, syllogism, direction route and math expression keep their sections and context', () => {
  const rc = `English Language\nDirections (1-2): Read the following passage and answer the questions.\nThe river supports nearby farms and changes during summer.\nQ1. According to the passage, what supports farms?\n(a) River\n(b) Road\n(c) Tree\n(d) Hill\n(e) None\nQ2. What happens during summer?\n(a) Change\n(b) Snow\n(c) Fire\n(d) ?\n(e) None`;
  const [first, second] = parseUploadedQuestions(rc);
  assert.equal(first.section, 'English Language');
  assert.match(second.passage, /river supports nearby farms/);
  assert.doesNotMatch(second.passage, /Q1\./);
  assert.equal(second.options.D, '?');
  assert.equal(inferSectionFromContent('Which conclusion follows?', 'Statements: All pens are books. Conclusions: I. Some books are pens.'), 'Reasoning Ability');
  assert.equal(inferSectionFromContent('How far is point C from A?', 'Point A walks 10 m north, turns right and walks 11 m to point C.'), 'Reasoning Ability');
  assert.equal(inferSectionFromContent('√225 + 4³ ÷ 2 = ?'), 'Quantitative Aptitude');
  assert.equal(convertTextTableToMarkdown('Find 25² + 10 ÷ 2 = ?\n(a) 630'), 'Find 25² + 10 ÷ 2 = ?\n(a) 630');
});

test('printed section ranges, answer-key grid, arithmetic directions and one-row DI table', () => {
  const text = `Quantitative Aptitude QUESTIONS 01 - 03
Directions (1-1):
Solve the following arithmetic word problems.
01 A can finish work in 10 days. How long for two workers?
(a) 2 (b) 5 (c) 10 (d) 20 (e) 30
Directions (2-3):
Study the following table showing accounts.
Bank   P   Q   R
Saving accounts   420   280   360
02 How many accounts are in P?
(a) 420 (b) 280 (c) 360 (d) 400 (e) 500
03 How many accounts are in Q?
(a) 420 (b) 280 (c) 360 (d) 400 (e) 500
Answer Key
Q01 B Q02 A Q03 B`;
  const qs = parseUploadedQuestions(text);
  assert.equal(qs.length, 3);
  assert.deepEqual(qs.map(q => q.section), Array(3).fill('Quantitative Aptitude'));
  assert.equal(qs[0].passage, '');
  assert.match(qs[1].passage, /\| Bank \| P \| Q \| R \|/);
  assert.equal(qs[0].source_answer, 'B');
  assert.equal(qs[2].source_answer, 'B');
  assert.equal(qs[0].explanation, '');
});

test('unnumbered puzzle directions and reading paragraph stay shared without question stems', () => {
  const text = `Reasoning Ability
Directions: Six people A, B, C, D, E and F sit in a row facing north. A sits immediately left of B. C sits at the right end.
Q1. Who sits immediately right of A?
(a) B (b) C (c) D (d) E (e) F
Q2. Who sits at the right end?
(a) A (b) B (c) C (d) D (e) E
English Language
Read the following passage carefully. A small library opened in the village. It offered books to children and adults every day.
Q3. What opened in the village?
(a) Library (b) School (c) Shop (d) Bank (e) Park`;
  const qs = parseUploadedQuestions(text);
  assert.equal(qs.length, 3);
  assert.match(qs[0].passage, /Six people/);
  assert.equal(qs[0].passage, qs[1].passage);
  assert.doesNotMatch(qs[0].passage, /Q1\./);
  assert.match(qs[2].passage, /small library/);
  assert.doesNotMatch(qs[2].passage, /Q3\./);
});

test('last option drops an attached publisher watermark without changing its answer', () => {
  const [q] = parseUploadedQuestions(`Q1. Find the profit?\n(a) Rs. 1400\n(b) Rs. 1650\n(c) Rs. 1800\n(d) Rs. 1200\n(e) Rs. 1050www.smartkeeda.com |testzone.sm`);
  assert.equal(q.options.E, 'Rs. 1050');
});

test('AI solved arrangement survives a short PDF solution and reaches the whole puzzle set', () => {
  const passage = 'Directions (1-2): A sits above B in a two-floor building.';
  const source = [1, 2].map(n => ({ questionNumber: n, section: 'Reasoning Ability', passage,
    question: `Who lives on floor ${n}?`, source_answer: n === 1 ? 'A' : 'B', explanation: n === 1 ? 'A is above B.' : '' }));
  const ai = [{ questionNumber: 1, explanation: 'Step 1: Place A above B.\n### Solved Arrangement\n| Floor | Person |\n| --- | --- |\n| 2 | A |\n| 1 | B |' }];
  const merged = mergeExtractedQuestions(source, ai);
  for (const q of merged) {
    assert.match(q.explanation, /\| Floor \| Person \|/);
    assert.equal(q.needs_review, false);
  }
});

test('Smartkeeda common explanation table and later Answers section stay with each puzzle question', () => {
  const paper = `Directions: Seven persons were born in different years. B was born after two persons. A was born after B.
1. Who was born first?
A. B B. A C. C D. D E. E
2. Who was born last?
A. B B. A C. C D. D E. E
Correct Answers:
1 2
C B
Join us Join us
www.smartkeeda.com | testzone.sm
Common explanations :
Reference:
B was born after two persons.
Inference:
Years   Persons
1984   C
1987   D
1991   B
1995   A
Answers :
1. Following the common explanation, C was first. Hence option C is correct.
2. Following the common explanation, A was last. Hence option B is correct.`;
  const qs = parseUploadedQuestions(paper);
  assert.equal(qs.length, 2);
  assert.equal(qs[0].options.E, 'E');
  assert.deepEqual(qs.map(q => q.source_answer), ['C', 'B']);
  for (const q of qs) {
    assert.match(q.passage, /Seven persons/);
    assert.match(q.explanation, /\| Year \| Person \|/);
    assert.match(q.explanation, /\| 1995 \| A \|/);
    assert.doesNotMatch(q.explanation, /www\.smartkeeda/);
  }
});

test('simplification directions are not a passage and equations stay quantitative', () => {
  const text = `Simplification Quiz 49
Directions: What will come in place of question mark(?) in the following questions?
2 2 3
1. (√7 − √10) 2 + (√5 + √14) 2 = (?) 3 − 28
A. √2 B. 4 C. √6 D. 3 E. None of these
2. (2.89) 4 ÷ (4913 ÷ 1000) 3 = (1.7) ?-3
A. √4 B. 6 C. 2 D. 5 E. None of these`;
  const qs = parseUploadedQuestions(text);
  assert.equal(qs.length, 2);
  assert.deepEqual(qs.map(q => q.section), ['Quantitative Aptitude', 'Quantitative Aptitude']);
  assert.deepEqual(qs.map(q => q.passage), ['', '']);
});

test('numbered options remain options rather than extra questions', () => {
  const text = Array.from({ length: 100 }, (_, i) => `${i + 1}. Find the value?\n(1) 12\n(2) 14\n(3) 16\n(4) 18\n(5) 20`).join('\n');
  const qs = parseUploadedQuestions(text);
  assert.equal(qs.length, 100);
  assert.deepEqual(qs[0].options, { A: '12', B: '14', C: '16', D: '18', E: '20' });
});

test('unknown answers/solutions remain unverified and real source solutions win', () => {
  const unknown = parseUploadedQuestions(mcq(1))[0];
  assert.equal(unknown.source_answer, '');
  assert.equal(unknown.correctAnswerIndex, null);
  assert.equal(unknown.explanation, '');
  assert.equal(unknown.needs_review, true);
  const [q] = parseUploadedQuestions(`${mcq(1)}\nAnswers and Solutions\n1. (B) Step 1: Add two.\nStep 2: The result is 2.`);
  assert.equal(q.source_answer, 'B');
  assert.match(q.explanation, /Step 2/);
  assert.equal(mergeExtractedQuestions([q], [{ questionNumber: 1, explanation: 'wrong' }])[0].explanation, q.explanation);
});

test('inline solution does not truncate the remaining questions', () => {
  const qs = parseUploadedQuestions(`${mcq(1)}\nSolution: Add the values.\n${mcq(2)}\n${mcq(3)}`);
  assert.equal(qs.length, 3);
  const withExplanation = parseUploadedQuestions(`${mcq(1)}\nExplanation: Add the values.\n${mcq(2)}\n${mcq(3)}`);
  assert.equal(withExplanation.length, 3);
});

test('arithmetic and reasoning never inherit an unrelated chart', () => {
  const pages = [{ pageNum: 1, text: 'The bar chart shows sales of cars', base64: 'chart', hasDI: true }];
  assert.equal(isDIQuestion({ question: 'Find the value of 3 + 4', section: 'Quantitative Aptitude' }), false);
  assert.equal(findBestMatchingChartPage({ question: 'Find the value of 3 + 4', page_number: 1 }, pages), null);
  assert.equal(isDIQuestion({ question: 'Who sits left?', section: 'Reasoning Ability', passage: '|Person|Floor|\n|---|---|' }), false);
  assert.equal(findBestMatchingChartPage({ question: 'Refer to the pie chart of rice production', passage: 'Rice production in different states', section: 'Quantitative Aptitude', page_number: 1 }, pages), null);
});

test('a DI set keeps every adjacent page that contains a real visual', () => {
  const question = { question: 'Refer to the pie charts', passage: 'Direction (16-20): Refer to the pie charts', section: 'Quantitative Aptitude', passage_page_number: 4 };
  const pages = [
    { pageNum: 4, hasVisual: true, base64: 'family-a' },
    { pageNum: 5, hasVisual: true, base64: 'family-b' },
    { pageNum: 6, hasVisual: false, base64: 'questions-only' },
  ];
  assert.deepEqual(findMatchingChartPages(question, pages).map(p => p.pageNum), [4, 5]);
});

test('AI failures still retain every structured source question', async () => {
  aiSessionState.nvidiaDisabled = true;
  for (const model of ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b']) aiSessionState.modelCooldowns[model] = Date.now() + 600000;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('offline test'); };
  const originalLog = console.log, originalWarn = console.warn, originalError = console.error;
  console.log = console.warn = console.error = () => {};
  try {
    const result = await generateMockTestFromPDF({ pdfText: paper, category: 'Banking' });
    assert.equal(result.rawExtractedQuestions.length, 100);
    assert.equal(result.rawExtractedQuestions[99].questionNumber, 100);
    assert.equal(result.rawExtractedQuestions[0].source_answer, '');
  } finally {
    globalThis.fetch = originalFetch;
    console.log = originalLog; console.warn = originalWarn; console.error = originalError;
  }
});
