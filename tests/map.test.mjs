import test from 'node:test';
import assert from 'node:assert/strict';
import { buildProvinceSeriesData, buildCitySeriesData, normalizeCityName } from '../src/map.js';

test('buildProvinceSeriesData includes count and newest photo summary per province', () => {
  const grouped = new Map([
    [
      '浙江',
      [
        { province: '浙江', city: '杭州', date: '2026-05-01', memory: '旧回忆', photos: ['old'] },
        { province: '浙江', city: '绍兴', date: '2026-05-03', memory: '新回忆', photos: ['new'] }
      ]
    ],
    ['四川', [{ province: '四川', city: '成都', date: '2026-05-02', memory: '咖啡', photos: [] }]]
  ]);

  const data = buildProvinceSeriesData(['浙江', '四川', '广东'], grouped);
  const zhejiang = data.find((item) => item.name === '浙江');
  const sichuan = data.find((item) => item.name === '四川');
  const guangdong = data.find((item) => item.name === '广东');

  assert.equal(zhejiang.value, 2);
  assert.equal(zhejiang.summary.city, '绍兴');
  assert.equal(zhejiang.summary.photo, 'new');
  assert.equal(sichuan.value, 1);
  assert.equal(sichuan.summary.photo, '');
  assert.equal(guangdong.value, 0);
  assert.equal(guangdong.summary, null);
});

test('normalizeCityName matches city records with map city names', () => {
  assert.equal(normalizeCityName('杭州市'), '杭州');
  assert.equal(normalizeCityName('杭州西湖'), '杭州西湖');
  assert.equal(normalizeCityName('阿坝藏族羌族自治州'), '阿坝藏族羌族');
});

test('buildCitySeriesData lights cities when record city contains map city name', () => {
  const features = [
    { properties: { name: '杭州市' } },
    { properties: { name: '宁波市' } },
    { properties: { name: '成都市' } }
  ];
  const records = [
    { province: '浙江', city: '杭州西湖', date: '2026-05-01', memory: '西湖', photos: ['photo-a'] },
    { province: '浙江', city: '宁波', date: '2026-05-02', memory: '海边', photos: [] }
  ];

  const data = buildCitySeriesData(features, records);
  const hangzhou = data.find((item) => item.name === '杭州市');
  const ningbo = data.find((item) => item.name === '宁波市');
  const chengdu = data.find((item) => item.name === '成都市');

  assert.equal(hangzhou.value, 1);
  assert.equal(hangzhou.summary.photo, 'photo-a');
  assert.equal(ningbo.value, 1);
  assert.equal(chengdu.value, 0);
});
