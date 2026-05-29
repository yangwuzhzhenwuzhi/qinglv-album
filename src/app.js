import { DEFAULT_SETTINGS, PROVINCES } from './data.js';
import { loadState, saveState } from './storage.js';
import {
  addRecord,
  updateRecord,
  deleteRecord,
  computeStats,
  groupRecordsByProvince,
  getProvinceCoverPhoto,
  buildHeartPhotoWall,
  updateSettings,
  addWishlistItem,
  deleteWishlistItem
} from './records.js';
import { renderChinaMap, renderProvinceCityMap } from './map.js?v=heart-wall-fix';
import { drawWheel, pickWheelItem } from './wheel.js';

const app = document.querySelector('#app');
let state = loadState();
let editingId = null;
let selectedProvince = '';
let selectedCity = '';
let mapMode = 'china';
let pendingPhotos = [];
let pendingBackground = '';
let lastSpinResult = '';
let wheelRotation = 0;
let activeView = 'home';

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatDate(value) {
  if (!value) return '未写日期';
  return value.replaceAll('-', '.');
}

function daysTogether() {
  const start = new Date(state.settings?.coupleStartDate || DEFAULT_SETTINGS.coupleStartDate);
  if (Number.isNaN(start.getTime())) return 0;
  const diff = Date.now() - start.getTime();
  return Math.max(1, Math.floor(diff / 86400000) + 1);
}

function applyBackground() {
  const image = state.settings?.backgroundImage || '';
  document.body.classList.toggle('has-custom-bg', Boolean(image));
  document.body.style.backgroundImage = image
    ? `linear-gradient(rgba(255, 250, 245, 0.78), rgba(246, 240, 234, 0.86)), url("${image}")`
    : '';
}

function persist() {
  const result = saveState(undefined, undefined, state);
  const notice = document.querySelector('[data-role="notice"]');
  if (notice) {
    notice.textContent = result.ok ? '已保存到本机浏览器' : `保存失败：${result.message}`;
    notice.classList.toggle('is-error', !result.ok);
  }
}

function currentEditRecord() {
  return state.records.find((record) => record.id === editingId) || null;
}

function selectedProvinceRecords() {
  return selectedProvince ? state.records.filter((record) => record.province === selectedProvince) : [];
}

function visibleRecords() {
  return state.records.filter((record) => {
    if (selectedProvince && record.province !== selectedProvince) return false;
    if (selectedCity && !String(record.city || '').includes(selectedCity.replace(/市$/, ''))) return false;
    return true;
  });
}

function settingsFormHtml() {
  const settings = { ...DEFAULT_SETTINGS, ...(state.settings || {}) };
  return `
    <form class="settings-panel panel" data-role="settings-form">
      <div class="section-heading">
        <div>
          <p class="eyebrow">相册设置</p>
          <h2>自己设置名字、日期和背景</h2>
        </div>
      </div>
      <div class="form-grid">
        <label>
          <span>相册标题</span>
          <input name="albumTitle" value="${escapeHtml(settings.albumTitle)}" required />
        </label>
        <label>
          <span>在一起日期</span>
          <input name="coupleStartDate" type="date" value="${escapeHtml(settings.coupleStartDate)}" required />
        </label>
        <label>
          <span>第一个名字</span>
          <input name="partnerA" value="${escapeHtml(settings.partnerA || '')}" placeholder="比如 阿涛" />
        </label>
        <label>
          <span>第二个名字</span>
          <input name="partnerB" value="${escapeHtml(settings.partnerB || '')}" placeholder="比如 小雨" />
        </label>
      </div>
      <label class="file-drop background-drop">
        <input name="backgroundImage" type="file" accept="image/*" />
        <span>更换网页背景</span>
        <strong>${pendingBackground || settings.backgroundImage ? '已选择背景图' : '上传一张你们喜欢的照片作背景'}</strong>
      </label>
      <div class="form-actions">
        <button class="secondary-button" type="submit">保存设置</button>
        <button class="ghost-button" type="button" data-action="clear-background">恢复默认背景</button>
      </div>
    </form>
  `;
}

function recordFormHtml() {
  const record = currentEditRecord();
  const data = record || {
    province: '浙江',
    city: '',
    date: new Date().toISOString().slice(0, 10),
    tag: '',
    memory: ''
  };
  const existingPhotos = record?.photos || [];
  const photoCount = pendingPhotos.length || existingPhotos.length;

  return `
    <form class="travel-form panel" data-role="record-form">
      <div class="section-heading">
        <div>
          <p class="eyebrow">${record ? '正在编辑' : '新的回忆'}</p>
          <h2>${record ? '修改这次旅行' : '记下一次旅行'}</h2>
        </div>
        ${record ? '<button class="ghost-button" type="button" data-action="cancel-edit">取消编辑</button>' : ''}
      </div>
      <div class="form-grid">
        <label>
          <span>省份</span>
          <select name="province" required>
            ${PROVINCES.map(
              (province) =>
                `<option value="${province}" ${province === data.province ? 'selected' : ''}>${province}</option>`
            ).join('')}
          </select>
        </label>
        <label>
          <span>城市 / 地点</span>
          <input name="city" value="${escapeHtml(data.city)}" placeholder="比如 杭州西湖" required />
        </label>
        <label>
          <span>日期</span>
          <input name="date" type="date" value="${escapeHtml(data.date)}" required />
        </label>
        <label>
          <span>心情标签</span>
          <input name="tag" value="${escapeHtml(data.tag)}" placeholder="比如 海边、散步、纪念日" />
        </label>
      </div>
      <label class="full-field">
        <span>回忆</span>
        <textarea name="memory" rows="5" placeholder="写一点只有你们懂的小事">${escapeHtml(data.memory)}</textarea>
      </label>
      <label class="file-drop">
        <input name="photos" type="file" accept="image/*" multiple />
        <span>选择照片</span>
        <strong>${photoCount ? `已准备 ${photoCount} 张照片` : '可上传多张纪念照'}</strong>
      </label>
      <div class="form-actions">
        <button class="primary-button" type="submit">${record ? '保存修改' : '加入相册'}</button>
        <p data-role="notice">数据只保存在这台电脑的浏览器里</p>
      </div>
    </form>
  `;
}

function photosHtml(photos = []) {
  if (!photos.length) return '<div class="photo-empty">还没有照片</div>';
  return `
    <div class="photo-strip">
      ${photos
        .slice(0, 4)
        .map((photo, index) => `<img src="${photo}" alt="旅行照片 ${index + 1}" />`)
        .join('')}
    </div>
  `;
}

function recordsHtml() {
  const records = visibleRecords();
  const filterTitle = selectedCity || selectedProvince;

  if (!records.length) {
    return `
      <section class="records-section">
        <div class="section-heading">
          <div>
            <p class="eyebrow">旅行记录</p>
            <h2>${filterTitle ? `${filterTitle}还没有记录` : '还没有旅行记录'}</h2>
          </div>
          ${filterTitle ? '<button class="ghost-button" data-action="clear-filter">查看全部</button>' : ''}
        </div>
        <div class="empty-state">先写下第一站，地图就会亮起来。</div>
      </section>
    `;
  }

  return `
    <section class="records-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">旅行记录</p>
          <h2>${filterTitle ? `${filterTitle}的回忆` : '我们的脚印'}</h2>
        </div>
        ${filterTitle ? '<button class="ghost-button" data-action="clear-filter">查看全部</button>' : ''}
      </div>
      ${heartPhotoWallHtml(records)}
      <div class="memory-strip">
        ${records.map((record) => memoryChipHtml(record)).join('')}
      </div>
    </section>
  `;
}

function heartPhotoWallHtml(records) {
  const slots = buildHeartPhotoWall(records, 45);
  const heartCells = [
    [2, 1], [3, 1], [5, 1], [6, 1],
    [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2],
    [0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3],
    [0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4],
    [1, 5], [2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [7, 5],
    [2, 6], [3, 6], [4, 6], [5, 6], [6, 6],
    [3, 7], [4, 7], [5, 7],
    [4, 8]
  ];
  return `
    <div class="heart-wall" aria-label="爱心照片墙">
      ${heartCells
        .map(([col, row], index) => {
          const slot = slots[index];
          const style = `--col:${col + 1};--row:${row};--i:${index}`;
          if (slot.type === 'photo') {
            const record = slot.record;
            return `
              <button class="heart-tile has-photo" type="button" data-action="edit-record" data-id="${record.id}" style="${style}">
                <img src="${slot.src}" alt="${escapeHtml(record.city || '旅行照片')}" />
                <span>
                  <strong>${escapeHtml(record.city || record.province)}</strong>
                  <small>${formatDate(record.date)}</small>
                </span>
              </button>
            `;
          }
          return `<div class="heart-tile is-outline" style="${style}" aria-hidden="true"></div>`;
        })
        .join('')}
    </div>
  `;
}

function memoryChipHtml(record) {
  return `
    <article class="memory-chip">
      <div>
        <strong>${escapeHtml(record.province)} · ${escapeHtml(record.city)}</strong>
        <span>${formatDate(record.date)} · ${escapeHtml(record.tag || '一段小旅行')}</span>
      </div>
      <p>${escapeHtml(record.memory || '这一天还没写下文字，但已经被相册记住了。')}</p>
      <div class="card-actions">
        <button class="icon-button" title="编辑" data-action="edit-record" data-id="${record.id}">编辑</button>
        <button class="text-danger" title="删除" data-action="delete-record" data-id="${record.id}">删除</button>
      </div>
    </article>
  `;
}

function mapPreviewHtml() {
  if (!selectedProvince) {
    return '<div class="province-photo-preview is-empty">点击点亮的省份，会在这里显示这片地方的一张照片。</div>';
  }
  const photo = getProvinceCoverPhoto(state.records, selectedProvince);
  const records = selectedProvinceRecords();
  if (!photo) {
    return `<div class="province-photo-preview is-empty">${selectedProvince} 已选中，还没有上传照片。</div>`;
  }
  return `
    <div class="province-photo-preview">
      <img src="${photo}" alt="${selectedProvince}代表照片" />
      <div>
        <strong>${selectedProvince}</strong>
        <span>${records.length} 条记录</span>
      </div>
    </div>
  `;
}

function mapTitleHtml() {
  if (mapMode === 'province') {
    return `
      <div>
        <p class="eyebrow">${selectedProvince}城市地图</p>
        <h2>点亮去过的城市</h2>
      </div>
      <button class="ghost-button" type="button" data-action="back-to-china">返回全国地图</button>
    `;
  }
  return `
    <div>
      <p class="eyebrow">中国地图</p>
      <h2>把去过的地方点亮</h2>
    </div>
  `;
}

function mapHintText() {
  if (mapMode === 'province') {
    return selectedCity ? `正在查看：${selectedCity}` : '碰触城市看照片，点击城市筛选回忆';
  }
  return selectedProvince ? `正在查看：${selectedProvince}` : '点击省份进入城市地图，碰触省份看照片';
}

function wishlistHtml() {
  return `
    <form class="wishlist-form" data-role="wishlist-form">
      <input name="name" placeholder="想去哪里？" required />
      <select name="province">
        <option value="">省份可选</option>
        ${PROVINCES.map((province) => `<option value="${province}">${province}</option>`).join('')}
      </select>
      <button class="secondary-button" type="submit">加入</button>
    </form>
    <div class="wishlist-list">
      ${
        state.wishlist.length
          ? state.wishlist
              .map(
                (item) => `
                  <span class="wish-chip">
                    ${escapeHtml(item.name)}
                    <button title="移除" data-action="delete-wish" data-id="${item.id}">x</button>
                  </span>
                `
              )
              .join('')
          : '<span class="muted">先加几个想去的地方，转盘才会开始转。</span>'
      }
    </div>
  `;
}

function shellHtml() {
  const stats = computeStats(state);
  const settings = { ...DEFAULT_SETTINGS, ...(state.settings || {}) };
  const navItems = [
    ['home', '首页'],
    ['add', '添加记录'],
    ['wheel', '去哪玩'],
    ['settings', '设置']
  ];
  return `
    <main class="app-shell">
      <nav class="top-nav panel" aria-label="页面导航">
        <div class="nav-brand">${escapeHtml(settings.partnerA || '你')} · ${escapeHtml(settings.partnerB || '我')}</div>
        <div class="nav-actions">
          ${navItems
            .map(
              ([view, label]) =>
                `<button class="${activeView === view ? 'is-active' : ''}" data-action="switch-view" data-view="${view}" type="button">${label}</button>`
            )
            .join('')}
        </div>
      </nav>

      <header class="hero panel">
        <div>
          <p class="eyebrow">${escapeHtml(settings.partnerA || '你')} · ${escapeHtml(settings.partnerB || '我')}</p>
          <h1>${escapeHtml(settings.albumTitle || DEFAULT_SETTINGS.albumTitle)}</h1>
          <p class="hero-copy">把每一次出发、每一张照片和每一个想去的地方，都留在同一张温柔的地图上。</p>
        </div>
        <div class="stats-grid">
          <div><strong>${daysTogether()}</strong><span>在一起天数</span></div>
          <div><strong>${stats.provinceCount}</strong><span>点亮省份</span></div>
          <div><strong>${stats.recordCount}</strong><span>旅行记录</span></div>
          <div><strong>${stats.photoCount}</strong><span>相册照片</span></div>
        </div>
      </header>

      ${viewHtml()}
    </main>
  `;
}

function homeViewHtml() {
  return `
      <section class="panel map-panel map-showcase">
        <div class="section-heading map-showcase-heading">
          ${mapTitleHtml()}
          <p class="map-hint">${mapHintText()}</p>
        </div>
        <div data-role="map"></div>
        ${mapPreviewHtml()}
      </section>

      ${recordsHtml()}
  `;
}

function addViewHtml() {
  return `<section class="single-view">${recordFormHtml()}</section>`;
}

function settingsViewHtml() {
  return `<section class="single-view">${settingsFormHtml()}</section>`;
}

function wheelViewHtml() {
  return `
    <section class="single-view">
      <section class="panel wheel-panel wheel-page">
        <div class="section-heading">
          <div>
            <p class="eyebrow">下一站</p>
            <h2>去哪玩转盘</h2>
          </div>
        </div>
        <div class="wheel-wrap">
          <canvas width="320" height="320" data-role="wheel"></canvas>
          <div class="wheel-pointer"></div>
        </div>
        <button class="primary-button wide" data-action="spin-wheel">开始转</button>
        <p class="spin-result">${lastSpinResult ? `这次去：${escapeHtml(lastSpinResult)}` : '把想去的地方交给一点随机。'}</p>
        ${wishlistHtml()}
      </section>
    </section>
  `;
}

function viewHtml() {
  if (activeView === 'add') return addViewHtml();
  if (activeView === 'wheel') return wheelViewHtml();
  if (activeView === 'settings') return settingsViewHtml();
  return homeViewHtml();
}

function render() {
  applyBackground();
  app.innerHTML = shellHtml();
  const mapTarget = app.querySelector('[data-role="map"]');
  if (mapTarget) {
    const recordsByProvince = groupRecordsByProvince(state.records);
    if (mapMode === 'province' && selectedProvince) {
      renderProvinceCityMap(
        mapTarget,
        selectedProvince,
        state.records.filter((record) => record.province === selectedProvince),
        (city) => {
          selectedCity = selectedCity === city ? '' : city;
          render();
        }
      ).catch((error) => showMapError(mapTarget, error));
    } else {
      renderChinaMap(mapTarget, PROVINCES, recordsByProvince, (province) => {
        selectedProvince = province;
        selectedCity = '';
        mapMode = 'province';
        render();
      }).catch((error) => showMapError(mapTarget, error));
    }
  }
  drawWheel(app.querySelector('[data-role="wheel"]'), state.wishlist, wheelRotation);
}

function showMapError(container, error) {
  container.innerHTML = `
    <div class="map-empty-message">
      地图加载失败，请刷新页面，或确认使用 http://localhost:5173 打开。
      <small>${escapeHtml(error?.message || '')}</small>
    </div>
  `;
}

function readFiles(files) {
  return Promise.all(
    [...files].map(
      (file) =>
        new Promise((resolve, reject) => {
          if (!file.type.startsWith('image/')) {
            reject(new Error('只能上传图片文件'));
            return;
          }
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error('照片读取失败'));
          reader.readAsDataURL(file);
        })
    )
  );
}

app.addEventListener('change', async (event) => {
  if (event.target.name === 'photos') {
    try {
      pendingPhotos = await readFiles(event.target.files);
      const notice = app.querySelector('[data-role="notice"]');
      if (notice) notice.textContent = `已准备 ${pendingPhotos.length} 张照片，提交后保存`;
    } catch (error) {
      pendingPhotos = [];
      const notice = app.querySelector('[data-role="notice"]');
      if (notice) {
        notice.textContent = error.message;
        notice.classList.add('is-error');
      }
    }
  }

  if (event.target.name === 'backgroundImage') {
    try {
      const [image] = await readFiles(event.target.files);
      pendingBackground = image || '';
      render();
    } catch {
      pendingBackground = '';
    }
  }
});

app.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.target;
  const data = Object.fromEntries(new FormData(form));

  if (form.dataset.role === 'settings-form') {
    state = updateSettings(state, {
      albumTitle: data.albumTitle,
      partnerA: data.partnerA,
      partnerB: data.partnerB,
      coupleStartDate: data.coupleStartDate,
      backgroundImage: pendingBackground || state.settings?.backgroundImage || ''
    });
    pendingBackground = '';
    persist();
    activeView = 'home';
    render();
  }

  if (form.dataset.role === 'record-form') {
    const existing = currentEditRecord();
    const photos = pendingPhotos.length ? pendingPhotos : existing?.photos || [];
    const payload = {
      province: data.province,
      city: data.city,
      date: data.date,
      tag: data.tag,
      memory: data.memory,
      photos
    };
    state = editingId ? updateRecord(state, editingId, payload) : addRecord(state, payload);
    editingId = null;
    pendingPhotos = [];
    selectedProvince = '';
    selectedCity = '';
    mapMode = 'china';
    persist();
    activeView = 'home';
    render();
  }

  if (form.dataset.role === 'wishlist-form') {
    state = addWishlistItem(state, { name: data.name, province: data.province });
    persist();
    render();
  }
});

app.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  const { action, id } = button.dataset;

  if (action === 'switch-view') {
    activeView = button.dataset.view || 'home';
    editingId = null;
    pendingPhotos = [];
    pendingBackground = '';
    render();
  }

  if (action === 'edit-record') {
    editingId = id;
    pendingPhotos = [];
    activeView = 'add';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    render();
  }

  if (action === 'delete-record') {
    state = deleteRecord(state, id);
    persist();
    render();
  }

  if (action === 'cancel-edit') {
    editingId = null;
    pendingPhotos = [];
    render();
  }

  if (action === 'clear-filter') {
    selectedProvince = '';
    selectedCity = '';
    mapMode = 'china';
    render();
  }

  if (action === 'back-to-china') {
    selectedProvince = '';
    selectedCity = '';
    mapMode = 'china';
    render();
  }

  if (action === 'clear-background') {
    pendingBackground = '';
    state = updateSettings(state, { backgroundImage: '' });
    persist();
    render();
  }

  if (action === 'delete-wish') {
    state = deleteWishlistItem(state, id);
    persist();
    render();
  }

  if (action === 'spin-wheel') {
    const picked = pickWheelItem(state.wishlist);
    if (!picked) {
      lastSpinResult = '先加一个想去的地方';
      render();
      return;
    }
    const start = performance.now();
    const duration = 1800;
    const extra = Math.PI * 8 + Math.random() * Math.PI * 2;
    const initial = wheelRotation;
    const animate = (time) => {
      const progress = Math.min(1, (time - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      wheelRotation = initial + extra * eased;
      drawWheel(app.querySelector('[data-role="wheel"]'), state.wishlist, wheelRotation);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        lastSpinResult = picked.name;
        render();
      }
    };
    requestAnimationFrame(animate);
  }
});

render();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
