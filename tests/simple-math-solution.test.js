import test from 'node:test';
import assert from 'node:assert/strict';
import { solveSimpleEquationQuestion } from '../src/utils/simpleMathSolution.js';

test('solves a clean simplification equation and explains the matching option', () => {
  const result = solveSimpleEquationQuestion({
    question: '556 − 441 + 223 − 112 = ?',
    options: { A: '262', B: '222', C: '226', D: '266', E: 'None of these' },
  });
  assert.equal(result?.answerLetter, 'C');
  assert.match(result.explanation, /Step 3: \? = 226/);
});

test('solves percentage equations with the unknown on the left', () => {
  const result = solveSimpleEquationQuestion({
    question: '?% of 4500 = 3000 − 480',
    options: { A: '65', B: '53', C: '56', D: '58', E: 'None of these' },
  });
  assert.equal(result?.answerLetter, 'C');
});

test('leaves missing radicals and ambiguous powers for review', () => {
  assert.equal(solveSimpleEquationQuestion({
    question: '1521 ÷ 3 × 12 = ?',
    options: { A: '158', B: '165', C: '167', D: '156', E: 'None of these' },
  }), null);
  assert.equal(solveSimpleEquationQuestion({
    question: '(√7 − √10)² = ?',
    options: { A: '1', B: '2', C: '3', D: '4' },
  }), null);
});
