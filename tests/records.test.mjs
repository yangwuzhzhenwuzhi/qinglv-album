import test from 'node:test';
import assert from 'node:assert/strict';
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

test('getProvinceCoverPhoto returns the first photo from the newest matching record', () => {
  const photo = getProvinceCoverPhoto(
    [
      { province: '浙江', date: '2026-05-01', photos: ['old-photo'] },
      { province: '四川', date: '2026-05-02', photos: ['other-photo'] },
      { province: '浙江', date: '2026-05-03', photos: [] },
      { province: '浙江', date: '2026-05-04', photos: ['new-photo'] }
    ],
    '浙江'
  );

  assert.equal(photo, 'new-photo');
});

test('updateSettings merges editable album settings', () => {
  const state = {
    settings: {
      albumTitle: '旧标题',
      partnerA: '阿涛',
      partnerB: '小雨',
      coupleStartDate: '2024-05-20',
      backgroundImage: ''
    },
    records: [],
    wishlist: []
  };

  const updated = updateSettings(state, {
    albumTitle: '新的旅行相册',
    partnerA: '阿涛',
    partnerB: '晴晴',
    backgroundImage: 'data:image/png;base64,bg'
  });

  assert.equal(updated.settings.albumTitle, '新的旅行相册');
  assert.equal(updated.settings.partnerB, '晴晴');
  assert.equal(updated.settings.coupleStartDate, '2024-05-20');
  assert.equal(updated.settings.backgroundImage, 'data:image/png;base64,bg');
});

test('buildHeartPhotoWall fills a heart layout with photos and outline placeholders', () => {
  const slots = buildHeartPhotoWall(
    [
      { id: 'r1', province: '山东', city: '青岛', date: '2026-05-08', photos: ['p1', 'p2'] },
      { id: 'r2', province: '浙江', city: '杭州', date: '2026-05-09', photos: ['p3'] }
    ],
    6
  );

  assert.equal(slots.length, 6);
  assert.deepEqual(
    slots.map((slot) => slot.type),
    ['photo', 'photo', 'photo', 'outline', 'outline', 'outline']
  );
  assert.equal(slots[0].src, 'p1');
  assert.equal(slots[0].record.city, '青岛');
});
