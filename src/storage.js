import { APP_STORAGE_KEY, DEFAULT_STATE } from './data.js';

function cloneDefaultState() {
  return typeof structuredClone === 'function'
    ? structuredClone(DEFAULT_STATE)
    : JSON.parse(JSON.stringify(DEFAULT_STATE));
}

function normalizeState(value) {
  if (!value || typeof value !== 'object') return cloneDefaultState();
  const defaults = cloneDefaultState();
  return {
    settings: { ...defaults.settings, ...(value.settings || {}) },
    records: Array.isArray(value.records) ? value.records : defaults.records,
    wishlist: Array.isArray(value.wishlist) ? value.wishlist : defaults.wishlist
  };
}

export function loadState(storage = globalThis.localStorage, key = APP_STORAGE_KEY) {
  try {
    const raw = storage?.getItem(key);
    if (!raw) return cloneDefaultState();
    return normalizeState(JSON.parse(raw));
  } catch {
    return cloneDefaultState();
  }
}

export function saveState(storage = globalThis.localStorage, key = APP_STORAGE_KEY, state) {
  try {
    storage.setItem(key, JSON.stringify(state));
    return { ok: true, message: '' };
  } catch (error) {
    return { ok: false, message: error?.message || '保存失败' };
  }
}
