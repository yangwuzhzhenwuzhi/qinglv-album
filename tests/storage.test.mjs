import test from 'node:test';
import assert from 'node:assert/strict';
import { loadState, saveState } from '../src/storage.js';

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key)
  };
}

test('loadState returns defaults when storage is empty', () => {
  const state = loadState(memoryStorage(), 'app');
  assert.equal(state.records.length, 1);
  assert.equal(state.settings.albumTitle, '我们的旅行相册');
});

test('loadState returns defaults when saved JSON is malformed', () => {
  const state = loadState(memoryStorage({ app: '{bad json' }), 'app');
  assert.equal(state.wishlist.length, 3);
});

test('saveState writes serialized state and reports success', () => {
  const storage = memoryStorage();
  const result = saveState(storage, 'app', { settings: {}, records: [], wishlist: [] });
  assert.equal(result.ok, true);
  assert.equal(JSON.parse(storage.getItem('app')).records.length, 0);
});

test('saveState reports failure when storage throws', () => {
  const storage = {
    setItem() {
      throw new Error('quota');
    }
  };
  const result = saveState(storage, 'app', { records: [] });
  assert.equal(result.ok, false);
  assert.match(result.message, /quota/);
});
