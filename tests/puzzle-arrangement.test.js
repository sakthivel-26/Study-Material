import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSolvedArrangement, formatFinalFloorArrangement, formatFloorCaseTables } from '../src/utils/puzzleArrangement.js';

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

test('uses the last complete floor case rather than an eliminated case', () => {
  const explanation = `Case-1 [Eliminated]\n9 C Oppo\n8 G Samsung\n7 D Lenovo\n\nCase-2B\nFloor Mobile\nnumber Persons phone brands\n9 D Lenovo\n8 G Samsung\n7 A Vivo\n6 B MI\n5 F Apple\n4 C Sony\n3 I Microsoft\n2 H Micromax\n1 E Oppo\n\nExplanation: There are 4 floors between D and Sony.`;
  const formatted = formatFinalFloorArrangement(explanation);
  assert.match(formatted, /\| Floor \| Person \| Mobile phone brand \|/);
  const result = parseSolvedArrangement(formatted, 'floor puzzle');
  assert.equal(result.type, 'floor');
  assert.equal(result.data.length, 9);
  assert.deepEqual(result.data[0], ['9', 'D', 'Lenovo']);
  assert.deepEqual(result.data.at(-1), ['1', 'E', 'Oppo']);
});

test('formats intermediate Case-1 and Case-2 floor rows without guessing column ownership', () => {
  const source = 'Inference:\nCase-1 Case-2\nFloor number Persons Mobile phone brands Persons Mobile phonebrands\n9 C\n8\n7\n6\n5\n4 C\n3\n2 Micromax Micromax\n1 E E\nReference: D owns Lenovo.';
  const result = formatFloorCaseTables(source);
  assert.match(result, /Case-1 Case-2/);
  assert.match(result, /\| Floor \| Case entries in source order \|/);
  assert.match(result, /\| 9 \| C \|/);
  assert.match(result, /\| 2 \| Micromax Micromax \|/);
  assert.match(result, /\| 1 \| E E \|/);
  assert.match(result, /Reference: D owns Lenovo/);
});
