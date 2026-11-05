import test from 'node:test';
import assert from 'node:assert/strict';
import { getSimpleSetLayout, getSetRootCenters } from '../src/utils/syllogismLayout.js';

const entities = (...names) => names.map(norm => ({ norm }));
const all = (normSubj, normPred) => ({ type: 'ALL', normSubj, normPred });

test('draws a subset chain but does not equate sibling subsets', () => {
  assert.ok(getSimpleSetLayout([all('plum', 'orange'), all('orange', 'mango')], entities('plum', 'orange', 'mango')));
  assert.equal(getSimpleSetLayout([all('cat', 'animal'), all('dog', 'animal')], entities('cat', 'dog', 'animal')), null);
});

test('falls back from cycles and non-nested relationships', () => {
  assert.equal(getSimpleSetLayout([all('a', 'b'), all('b', 'a')], entities('a', 'b')), null);
  assert.equal(getSimpleSetLayout([{ type: 'SOME', normSubj: 'a', normPred: 'b' }], entities('a', 'b')), null);
});

test('keeps explicitly disjoint root circles apart', () => {
  const roots = entities('cat', 'dog');
  const centers = getSetRootCenters(roots, [{ type: 'NO', normSubj: 'cat', normPred: 'dog' }]);
  assert.ok(centers[1] - centers[0] > 180);
  const nestedCenters = getSetRootCenters(entities('apple', 'mango'),
    [{ type: 'NO', normSubj: 'apple', normPred: 'plum' }],
    new Map([['plum', 'orange'], ['orange', 'mango']]));
  assert.ok(nestedCenters[1] - nestedCenters[0] > 180);
});
