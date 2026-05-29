import test from 'node:test';
import assert from 'node:assert/strict';
import { pickWheelItem, normalizeWheelItems } from '../src/wheel.js';

test('normalizeWheelItems removes blank names', () => {
  assert.deepEqual(
    normalizeWheelItems([{ name: '大理' }, { name: ' ' }, { name: '青岛' }]).map((item) => item.name),
    ['大理', '青岛']
  );
});

test('pickWheelItem uses random value to select item', () => {
  const items = [{ name: '大理' }, { name: '青岛' }, { name: '成都' }];
  assert.equal(pickWheelItem(items, 0).name, '大理');
  assert.equal(pickWheelItem(items, 0.4).name, '青岛');
  assert.equal(pickWheelItem(items, 0.99).name, '成都');
});

test('pickWheelItem returns null for empty list', () => {
  assert.equal(pickWheelItem([], 0.5), null);
});
