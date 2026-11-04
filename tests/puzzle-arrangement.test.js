import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSolvedArrangement } from '../src/utils/puzzleArrangement.js';

const solved = 'Step 1: Place A before B.\n### Solved Arrangement\n| Seat | Person |\n| --- | --- |\n| 1 | A |\n| 2 | B |';

test('uses a solved seating table for the correct visual layout', () => {
  for (const [passage, type] of [
    ['People sit in a circle', 'circle'], ['People sit around a square table', 'square'],
    ['People sit around a triangle', 'triangle'], ['Two parallel rows face each other', 'two-row'],
    ['People sit in a linear row', 'linear'],
  ]) assert.equal(parseSolvedArrangement(solved, passage)?.type, type);
});

test('keeps floor and dated month arrangements and refuses unsolved layouts', () => {
  const floors = '| Floor | Person |\n| --- | --- |\n| 2 | A |\n| 1 | B |';
  const dates = '| Month | Date | Person |\n| --- | --- | --- |\n| January | 5 | A |\n| March | 12 | B |';
  assert.equal(parseSolvedArrangement(floors, 'People live on floors')?.type, 'floor');
  assert.equal(parseSolvedArrangement(dates, 'Birth month and date')?.type, 'month');
  assert.equal(parseSolvedArrangement('No solved arrangement', 'People sit in a circle'), null);
  assert.equal(parseSolvedArrangement('| Person | Color |\n| --- | --- |\n| A | Red |\n| B | Blue |', 'People sit in a circle')?.type, 'table');
});
