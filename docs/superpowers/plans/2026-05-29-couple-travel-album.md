# Couple Travel Album Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-first couple travel album web app with editable travel records, photo storage, province-level China footprint map, wishlist, and a random travel wheel.

**Architecture:** Use a small static frontend with ES modules. Keep persistence, data defaults, record logic, map rendering, wheel drawing, and app orchestration in separate files so the app can later swap `localStorage` for a backend.

**Tech Stack:** Plain HTML, CSS, JavaScript ES modules, browser `localStorage`, browser `FileReader`, SVG for the China footprint map, Canvas for the wheel, Node built-in test runner for pure logic.

---

## File Structure

- Create `package.json`: defines `npm test` using Node's built-in test runner.
- Create `index.html`: app shell and module entry.
- Create `src/styles.css`: responsive visual design, layout, cards, forms, map, wheel, and mobile behavior.
- Create `src/data.js`: province list, default records, default wishlist, settings defaults, and helper constants.
- Create `src/storage.js`: safe load/save/reset helpers around `localStorage`.
- Create `src/records.js`: pure functions for record and wishlist mutations, stats, and validation.
- Create `src/wheel.js`: pure wheel selection logic plus Canvas drawing helpers.
- Create `src/map.js`: SVG province map rendering and province record grouping.
- Create `src/app.js`: browser app state, event handling, rendering, file upload, and persistence.
- Create `tests/storage.test.mjs`: malformed data and storage fallback tests.
- Create `tests/records.test.mjs`: record mutation, stats, and province grouping tests.
- Create `tests/wheel.test.mjs`: wheel selection tests.

## Task 1: Project Shell and Test Harness

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `src/styles.css`

- [ ] **Step 1: Create the package file**

Create `package.json`:

```json
{
  "scripts": {
    "test": "node --test tests/*.test.mjs"
  },
  "devDependencies": {}
}
```

- [ ] **Step 2: Create the HTML shell**

Create `index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>我们的旅行相册</title>
    <link rel="stylesheet" href="./src/styles.css" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="./src/app.js"></script>
  </body>
</html>
```

- [ ] **Step 3: Add a baseline stylesheet**

Create `src/styles.css` with CSS variables, reset styles, body background, and responsive container classes. Use warm neutral colors with restrained rose and teal accents.

- [ ] **Step 4: Run the test command**

Run: `npm test`

Expected: the command fails because no test files exist yet. This confirms the script is wired and the next tasks will add tests.

## Task 2: Data Defaults and Record Logic

**Files:**
- Create: `src/data.js`
- Create: `src/records.js`
- Create: `tests/records.test.mjs`

- [ ] **Step 1: Write failing tests for stats and record mutations**

Create `tests/records.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addRecord,
  updateRecord,
  deleteRecord,
  computeStats,
  groupRecordsByProvince,
  addWishlistItem,
  deleteWishlistItem
} from '../src/records.js';

test('record mutations add, update, and delete without changing unrelated records', () => {
  const state = { records: [], wishlist: [] };
  const added = addRecord(state, {
    province: '浙江',
    city: '杭州',
    date: '2026-05-01',
    tag: '湖边散步',
    memory: '一起看西湖落日',
    photos: ['data:image/png;base64,a']
  });

  assert.equal(added.records.length, 1);
  assert.equal(added.records[0].city, '杭州');
  assert.ok(added.records[0].id);

  const updated = updateRecord(added, added.records[0].id, { city: '绍兴', memory: '改成水乡记忆' });
  assert.equal(updated.records[0].city, '绍兴');
  assert.equal(updated.records[0].memory, '改成水乡记忆');

  const deleted = deleteRecord(updated, updated.records[0].id);
  assert.equal(deleted.records.length, 0);
});

test('stats count records, photos, and unique provinces', () => {
  const stats = computeStats({
    records: [
      { province: '浙江', photos: ['a', 'b'] },
      { province: '浙江', photos: [] },
      { province: '四川', photos: ['c'] }
    ],
    wishlist: []
  });

  assert.deepEqual(stats, {
    recordCount: 3,
    photoCount: 3,
    provinceCount: 2
  });
});

test('records group by province for map rendering', () => {
  const grouped = groupRecordsByProvince([
    { id: '1', province: '浙江', city: '杭州' },
    { id: '2', province: '四川', city: '成都' },
    { id: '3', province: '浙江', city: '绍兴' }
  ]);

  assert.equal(grouped.get('浙江').length, 2);
  assert.equal(grouped.get('四川')[0].city, '成都');
});

test('wishlist mutations add and delete destinations', () => {
  const state = { records: [], wishlist: [] };
  const added = addWishlistItem(state, { name: '青岛', province: '山东' });
  assert.equal(added.wishlist.length, 1);
  assert.equal(added.wishlist[0].name, '青岛');

  const deleted = deleteWishlistItem(added, added.wishlist[0].id);
  assert.equal(deleted.wishlist.length, 0);
});
```

- [ ] **Step 2: Run tests and confirm failure**

Run: `npm test`

Expected: FAIL with module-not-found errors for `src/records.js`.

- [ ] **Step 3: Implement data defaults**

Create `src/data.js` with:

```js
export const APP_STORAGE_KEY = 'coupleTravelAlbum:v1';

export const PROVINCES = [
  '北京', '天津', '河北', '山西', '内蒙古', '辽宁', '吉林', '黑龙江',
  '上海', '江苏', '浙江', '安徽', '福建', '江西', '山东', '河南',
  '湖北', '湖南', '广东', '广西', '海南', '重庆', '四川', '贵州',
  '云南', '西藏', '陕西', '甘肃', '青海', '宁夏', '新疆', '香港',
  '澳门', '台湾'
];

export const DEFAULT_SETTINGS = {
  albumTitle: '我们的旅行相册',
  coupleStartDate: '2024-05-20'
};

export const DEFAULT_STATE = {
  settings: DEFAULT_SETTINGS,
  records: [
    {
      id: 'sample-hangzhou',
      province: '浙江',
      city: '杭州',
      date: '2026-05-20',
      tag: '湖边散步',
      memory: '把风景和晚霞都装进了同一段回忆里。',
      photos: [],
      createdAt: '2026-05-20T12:00:00.000Z',
      updatedAt: '2026-05-20T12:00:00.000Z'
    }
  ],
  wishlist: [
    { id: 'wish-dali', name: '大理', province: '云南' },
    { id: 'wish-qingdao', name: '青岛', province: '山东' },
    { id: 'wish-chengdu', name: '成都', province: '四川' }
  ]
};
```

- [ ] **Step 4: Implement record helpers**

Create `src/records.js` with pure functions:

```js
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
```

- [ ] **Step 5: Run tests and confirm pass**

Run: `npm test`

Expected: PASS for all `records` tests.

## Task 3: Safe Local Storage

**Files:**
- Create: `src/storage.js`
- Create: `tests/storage.test.mjs`

- [ ] **Step 1: Write failing storage tests**

Create `tests/storage.test.mjs`:

```js
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
```

- [ ] **Step 2: Run tests and confirm failure**

Run: `npm test`

Expected: FAIL with module-not-found for `src/storage.js`.

- [ ] **Step 3: Implement storage helpers**

Create `src/storage.js`:

```js
import { APP_STORAGE_KEY, DEFAULT_STATE } from './data.js';

function cloneDefaultState() {
  return structuredClone ? structuredClone(DEFAULT_STATE) : JSON.parse(JSON.stringify(DEFAULT_STATE));
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
```

- [ ] **Step 4: Run tests and confirm pass**

Run: `npm test`

Expected: PASS for records and storage tests.

## Task 4: Wheel Logic and Drawing

**Files:**
- Create: `src/wheel.js`
- Create: `tests/wheel.test.mjs`

- [ ] **Step 1: Write failing wheel tests**

Create `tests/wheel.test.mjs`:

```js
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
```

- [ ] **Step 2: Run tests and confirm failure**

Run: `npm test`

Expected: FAIL with module-not-found for `src/wheel.js`.

- [ ] **Step 3: Implement wheel helpers**

Create `src/wheel.js`:

```js
export function normalizeWheelItems(items) {
  return items.filter((item) => item.name && item.name.trim()).map((item) => ({ ...item, name: item.name.trim() }));
}

export function pickWheelItem(items, randomValue = Math.random()) {
  const normalized = normalizeWheelItems(items);
  if (!normalized.length) return null;
  const index = Math.min(normalized.length - 1, Math.floor(randomValue * normalized.length));
  return normalized[index];
}

export function drawWheel(canvas, items, rotation = 0) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const normalized = normalizeWheelItems(items);
  const size = canvas.width;
  const center = size / 2;
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(center, center);
  ctx.rotate(rotation);

  if (!normalized.length) {
    ctx.fillStyle = '#f4eee8';
    ctx.beginPath();
    ctx.arc(0, 0, center - 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  const colors = ['#e96f6f', '#f2b36d', '#7fb3a1', '#91a7d0', '#d58ab4', '#a8c66c'];
  const arc = (Math.PI * 2) / normalized.length;
  normalized.forEach((item, index) => {
    const start = index * arc;
    ctx.fillStyle = colors[index % colors.length];
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, center - 8, start, start + arc);
    ctx.closePath();
    ctx.fill();

    ctx.save();
    ctx.rotate(start + arc / 2);
    ctx.fillStyle = '#fffaf6';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(item.name, center - 24, 6);
    ctx.restore();
  });

  ctx.restore();
}
```

- [ ] **Step 4: Run tests and confirm pass**

Run: `npm test`

Expected: PASS for all tests.

## Task 5: Province Map Rendering

**Files:**
- Create: `src/map.js`
- Modify: `src/styles.css`

- [ ] **Step 1: Implement province layout**

Create `src/map.js` with a deterministic province tile map. It should export `renderChinaMap(container, provinces, recordsByProvince, onProvinceSelect)` and render clickable SVG groups for each province.

```js
const PROVINCE_POSITIONS = {
  新疆: [0, 2], 西藏: [1, 4], 青海: [2, 3], 甘肃: [3, 2], 宁夏: [4, 2],
  内蒙古: [4, 0], 黑龙江: [8, 0], 吉林: [8, 1], 辽宁: [8, 2],
  北京: [7, 2], 天津: [7, 3], 河北: [6, 3], 山西: [5, 3], 陕西: [4, 4],
  山东: [7, 4], 河南: [6, 4], 江苏: [8, 5], 上海: [9, 6], 安徽: [7, 5],
  湖北: [6, 5], 四川: [4, 5], 重庆: [5, 5], 浙江: [8, 6], 江西: [7, 6],
  湖南: [6, 6], 贵州: [5, 6], 云南: [4, 7], 福建: [8, 7], 广东: [7, 8],
  广西: [6, 8], 海南: [7, 9], 香港: [8, 8], 澳门: [8, 9], 台湾: [9, 8]
};

export function renderChinaMap(container, provinces, recordsByProvince, onProvinceSelect) {
  const cell = 52;
  const width = 540;
  const height = 540;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.classList.add('china-map');

  provinces.forEach((province) => {
    const [x, y] = PROVINCE_POSITIONS[province] || [0, 0];
    const count = recordsByProvince.get(province)?.length || 0;
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.classList.add('province-node');
    if (count) group.classList.add('is-visited');
    group.setAttribute('tabindex', '0');
    group.setAttribute('role', 'button');
    group.setAttribute('aria-label', `${province}${count ? `，${count}条记录` : '，还没有记录'}`);
    group.addEventListener('click', () => onProvinceSelect(province));
    group.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') onProvinceSelect(province);
    });

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', String(18 + x * cell));
    rect.setAttribute('y', String(16 + y * cell));
    rect.setAttribute('rx', '14');
    rect.setAttribute('width', '46');
    rect.setAttribute('height', '38');

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', String(41 + x * cell));
    label.setAttribute('y', String(40 + y * cell));
    label.textContent = province.length > 3 ? province.slice(0, 2) : province;

    group.append(rect, label);
    svg.append(group);
  });

  container.replaceChildren(svg);
}
```

- [ ] **Step 2: Add map CSS**

Add styles for `.china-map`, `.province-node rect`, `.province-node text`, `.province-node.is-visited`, hover, and focus states.

- [ ] **Step 3: Run tests**

Run: `npm test`

Expected: PASS. This task is mostly browser rendering, verified manually in Task 8.

## Task 6: App UI and Persistence

**Files:**
- Create: `src/app.js`
- Modify: `src/styles.css`

- [ ] **Step 1: Implement app rendering**

Create `src/app.js` to load state from storage, render header stats, form, record cards, map, wishlist, and wheel. Use event delegation for edit/delete buttons and form submissions.

Core behavior:
- `render()` recomputes stats and redraws all sections.
- Record form supports add mode and edit mode.
- File inputs convert images to data URLs with `FileReader`.
- Every mutation calls `persist()` and re-renders.
- Wheel spin calls `pickWheelItem`, animates Canvas rotation, and displays the result.

- [ ] **Step 2: Add app CSS**

Complete `src/styles.css` for:
- responsive app shell
- hero summary
- stats grid
- form fields
- card grid
- photo thumbnails
- map panel
- wheel panel
- wishlist chips
- mobile layout under `760px`

- [ ] **Step 3: Run tests**

Run: `npm test`

Expected: PASS.

## Task 7: Manual Browser Verification

**Files:**
- No new files.

- [ ] **Step 1: Start a local static server**

Run: `python -m http.server 5173`

Expected: server starts at `http://localhost:5173`.

- [ ] **Step 2: Open the page**

Open `http://localhost:5173` in the browser.

Expected:
- App loads without console errors.
- Header stats display.
- Sample Hangzhou record appears.
- Zhejiang is highlighted on the map.
- Wishlist contains Dali, Qingdao, and Chengdu.

- [ ] **Step 3: Verify travel record workflow**

Actions:
- Add a record for `四川 / 成都`.
- Upload one small image.
- Edit the memory text.
- Delete the sample Hangzhou record.
- Reload the page.

Expected:
- New record persists after reload.
-四川 is highlighted.
- Deleted sample record stays deleted.

- [ ] **Step 4: Verify wheel workflow**

Actions:
- Add a wishlist item.
- Spin the wheel.
- Remove the wishlist item.

Expected:
- Wheel displays the current wishlist.
- Spin result is one of the visible items.
- Removed item no longer appears.

- [ ] **Step 5: Verify responsive layout**

Check desktop width around `1366px` and mobile width around `390px`.

Expected:
- Text does not overlap.
- Form controls fit their containers.
- Map, wheel, and cards stack cleanly on mobile.

## Self-Review Notes

- The plan covers local storage, add/edit/delete records, photos, province map, wishlist, wheel, empty states, malformed storage, and manual desktop/mobile verification.
- The first version uses a stylized province tile map, not a geographically exact map. This keeps the app dependency-free and stable for local use.
- There are no server, account, sync, booking, or route-planning tasks because the approved spec excluded them.
