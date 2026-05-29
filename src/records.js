function makeId(prefix) {
  if (globalThis.crypto?.randomUUID) return `${prefix}-${globalThis.crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function nowIso() {
  return new Date().toISOString();
}

export function addRecord(state, input) {
  const timestamp = nowIso();
  const record = {
    id: makeId('record'),
    province: input.province,
    city: input.city.trim(),
    date: input.date,
    tag: input.tag.trim(),
    memory: input.memory.trim(),
    photos: Array.isArray(input.photos) ? input.photos : [],
    createdAt: timestamp,
    updatedAt: timestamp
  };
  return { ...state, records: [record, ...state.records] };
}

export function updateRecord(state, id, patch) {
  return {
    ...state,
    records: state.records.map((record) =>
      record.id === id ? { ...record, ...patch, updatedAt: nowIso() } : record
    )
  };
}

export function deleteRecord(state, id) {
  return { ...state, records: state.records.filter((record) => record.id !== id) };
}

export function computeStats(state) {
  const provinces = new Set(state.records.map((record) => record.province).filter(Boolean));
  return {
    recordCount: state.records.length,
    photoCount: state.records.reduce((sum, record) => sum + (record.photos?.length || 0), 0),
    provinceCount: provinces.size
  };
}

export function groupRecordsByProvince(records) {
  return records.reduce((map, record) => {
    if (!record.province) return map;
    const current = map.get(record.province) || [];
    current.push(record);
    map.set(record.province, current);
    return map;
  }, new Map());
}

export function getProvinceCoverPhoto(records, province) {
  const matched = records
    .filter((record) => record.province === province && record.photos?.length)
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  return matched[0]?.photos?.[0] || '';
}

export function buildHeartPhotoWall(records, slotCount = 29) {
  const photos = records.flatMap((record) =>
    (record.photos || []).map((src) => ({
      type: 'photo',
      src,
      record
    }))
  );

  return Array.from({ length: slotCount }, (_, index) => {
    if (photos[index]) return photos[index];
    return {
      type: 'outline',
      src: '',
      record: null
    };
  });
}

export function updateSettings(state, patch) {
  return {
    ...state,
    settings: {
      ...state.settings,
      ...patch
    }
  };
}

export function addWishlistItem(state, input) {
  const item = {
    id: makeId('wish'),
    name: input.name.trim(),
    province: input.province || ''
  };
  return { ...state, wishlist: [...state.wishlist, item] };
}

export function deleteWishlistItem(state, id) {
  return { ...state, wishlist: state.wishlist.filter((item) => item.id !== id) };
}
