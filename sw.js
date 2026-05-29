const CACHE_NAME = 'couple-travel-album-v1';
const GEOJSON_FILES = [
  './node_modules/china-geojson/src/geojson/jiang_su_geo.json',
  './node_modules/china-geojson/src/geojson/an_hui_geo.json',
  './node_modules/china-geojson/src/geojson/bei_jing_geo.json',
  './node_modules/china-geojson/src/geojson/china.json',
  './node_modules/china-geojson/src/geojson/chong_qing_geo.json',
  './node_modules/china-geojson/src/geojson/fu_jian_geo.json',
  './node_modules/china-geojson/src/geojson/gan_su_geo.json',
  './node_modules/china-geojson/src/geojson/guang_dong_geo.json',
  './node_modules/china-geojson/src/geojson/guang_xi_geo.json',
  './node_modules/china-geojson/src/geojson/gui_zhou_geo.json',
  './node_modules/china-geojson/src/geojson/hai_nan_geo.json',
  './node_modules/china-geojson/src/geojson/he_bei_geo.json',
  './node_modules/china-geojson/src/geojson/he_nan_geo.json',
  './node_modules/china-geojson/src/geojson/hei_long_jiang_geo.json',
  './node_modules/china-geojson/src/geojson/hu_bei_geo.json',
  './node_modules/china-geojson/src/geojson/hu_nan_geo.json',
  './node_modules/china-geojson/src/geojson/ji_lin_geo.json',
  './node_modules/china-geojson/src/geojson/ao_men_geo.json',
  './node_modules/china-geojson/src/geojson/jiang_xi_geo.json',
  './node_modules/china-geojson/src/geojson/liao_ning_geo.json',
  './node_modules/china-geojson/src/geojson/nei_meng_gu_geo.json',
  './node_modules/china-geojson/src/geojson/ning_xia_geo.json',
  './node_modules/china-geojson/src/geojson/qing_hai_geo.json',
  './node_modules/china-geojson/src/geojson/shan_dong_geo.json',
  './node_modules/china-geojson/src/geojson/shan_xi_1_geo.json',
  './node_modules/china-geojson/src/geojson/shan_xi_2_geo.json',
  './node_modules/china-geojson/src/geojson/shang_hai_geo.json',
  './node_modules/china-geojson/src/geojson/si_chuan_geo.json',
  './node_modules/china-geojson/src/geojson/tai_wan_geo.json',
  './node_modules/china-geojson/src/geojson/tian_jin_geo.json',
  './node_modules/china-geojson/src/geojson/xi_zang_geo.json',
  './node_modules/china-geojson/src/geojson/xiang_gang_geo.json',
  './node_modules/china-geojson/src/geojson/xin_jiang_geo.json',
  './node_modules/china-geojson/src/geojson/yun_nan_geo.json',
  './node_modules/china-geojson/src/geojson/zhe_jiang_geo.json'
];
const APP_SHELL = [
  './',
  './index.html',
  './src/styles.css',
  './src/app.js?v=heart-wall-fix',
  './src/data.js',
  './src/storage.js',
  './src/records.js',
  './src/map.js?v=heart-wall-fix',
  './src/wheel.js',
  './manifest.webmanifest',
  './icons/icon.svg',
  ...GEOJSON_FILES
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
