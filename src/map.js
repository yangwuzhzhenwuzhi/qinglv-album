const chartByContainer = new WeakMap();
let chinaMapPromise = null;
let echartsPromise = null;
const provinceMapPromises = new Map();

const PROVINCE_GEO_FILES = {
  北京: 'bei_jing_geo.json',
  天津: 'tian_jin_geo.json',
  河北: 'he_bei_geo.json',
  山西: 'shan_xi_1_geo.json',
  内蒙古: 'nei_meng_gu_geo.json',
  辽宁: 'liao_ning_geo.json',
  吉林: 'ji_lin_geo.json',
  黑龙江: 'hei_long_jiang_geo.json',
  上海: 'shang_hai_geo.json',
  江苏: 'jiang_su_geo.json',
  浙江: 'zhe_jiang_geo.json',
  安徽: 'an_hui_geo.json',
  福建: 'fu_jian_geo.json',
  江西: 'jiang_xi_geo.json',
  山东: 'shan_dong_geo.json',
  河南: 'he_nan_geo.json',
  湖北: 'hu_bei_geo.json',
  湖南: 'hu_nan_geo.json',
  广东: 'guang_dong_geo.json',
  广西: 'guang_xi_geo.json',
  海南: 'hai_nan_geo.json',
  重庆: 'chong_qing_geo.json',
  四川: 'si_chuan_geo.json',
  贵州: 'gui_zhou_geo.json',
  云南: 'yun_nan_geo.json',
  西藏: 'xi_zang_geo.json',
  陕西: 'shan_xi_2_geo.json',
  甘肃: 'gan_su_geo.json',
  青海: 'qing_hai_geo.json',
  宁夏: 'ning_xia_geo.json',
  新疆: 'xin_jiang_geo.json',
  香港: 'xiang_gang_geo.json',
  澳门: 'ao_men_geo.json',
  台湾: 'tai_wan_geo.json'
};

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function newestRecord(records = []) {
  return [...records].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))[0] || null;
}

function summaryForRecords(records = []) {
  const newestFirst = [...records].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  const record = newestFirst.find((item) => item.photos?.length) || newestFirst[0] || null;
  if (!record) return null;
  return {
    city: record.city || '',
    date: record.date || '',
    memory: record.memory || '',
    photo: record.photos?.[0] || '',
    count: records.length
  };
}

export function buildProvinceSeriesData(provinces, recordsByProvince) {
  return provinces.map((province) => {
    const records = recordsByProvince.get(province) || [];
    return {
      name: province,
      value: records.length,
      selected: records.length > 0,
      summary: summaryForRecords(records)
    };
  });
}

export function normalizeCityName(name = '') {
  return String(name)
    .replace(/市$/, '')
    .replace(/地区$/, '')
    .replace(/自治州$/, '')
    .replace(/藏族自治州$/, '藏族')
    .replace(/藏族羌族自治州$/, '藏族羌族')
    .trim();
}

export function buildCitySeriesData(features, records) {
  return features.map((feature) => {
    const mapCityName = feature.properties?.name || '';
    const normalizedMapName = normalizeCityName(mapCityName);
    const matched = records.filter((record) => {
      const recordCity = normalizeCityName(record.city || '');
      return recordCity.includes(normalizedMapName) || normalizedMapName.includes(recordCity);
    });
    return {
      name: mapCityName,
      value: matched.length,
      selected: matched.length > 0,
      summary: summaryForRecords(matched)
    };
  });
}

async function ensureChinaMap() {
  const echarts = await ensureEcharts();
  if (!chinaMapPromise) {
    chinaMapPromise = fetch('https://cdn.jsdelivr.net/npm/china-geojson/src/geojson/china.json')
      .then((response) => {
        if (!response.ok) throw new Error('中国地图数据加载失败');
        return response.json();
      })
      .then((geoJson) => {
        echarts.registerMap('china', geoJson);
        return geoJson;
      });
  }
  return chinaMapPromise;
}

async function ensureProvinceMap(province) {
  const file = PROVINCE_GEO_FILES[province];
  if (!file) return null;
  const echarts = await ensureEcharts();
  const mapName = `province-${province}`;
  if (!provinceMapPromises.has(province)) {
    provinceMapPromises.set(
      province,
      fetch(`https://cdn.jsdelivr.net/npm/china-geojson/src/geojson/${file}`)
        .then((response) => {
          if (!response.ok) throw new Error(`${province}城市地图数据加载失败`);
          return response.json();
        })
        .then((geoJson) => {
          echarts.registerMap(mapName, geoJson);
          return { geoJson, mapName };
        })
    );
  }
  return provinceMapPromises.get(province);
}

async function ensureEcharts() {
  if (!echartsPromise) {
    echartsPromise = import('https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.esm.min.js');
  }
  return echartsPromise;
}

function tooltipHtml(params) {
  const summary = params.data?.summary;
  const count = params.data?.value || 0;
  if (!summary) {
    return `
      <div class="echarts-map-tooltip">
        <strong>${escapeHtml(params.name)}</strong>
        <p>还没有旅行记录。</p>
      </div>
    `;
  }
  return `
    <div class="echarts-map-tooltip">
      ${summary.photo ? `<img src="${summary.photo}" alt="${escapeHtml(params.name)}照片" />` : '<div class="tooltip-photo-empty">暂无照片</div>'}
      <div>
        <strong>${escapeHtml(params.name)}${summary.city ? ` · ${escapeHtml(summary.city)}` : ''}</strong>
        <small>${escapeHtml(summary.date || `${count} 条记录`)}</small>
        <p>${escapeHtml(summary.memory || '这片地方已经被点亮了。')}</p>
      </div>
    </div>
  `;
}

export async function renderChinaMap(container, provinces, recordsByProvince, onProvinceSelect) {
  const echarts = await ensureEcharts();
  await ensureChinaMap();
  chartByContainer.get(container)?.dispose();
  const holder = document.createElement('div');
  holder.className = 'echarts-china-map';
  container.replaceChildren(holder);

  const chart = echarts.init(holder, null, { renderer: 'canvas' });
  holder.__albumChart = chart;
  chartByContainer.set(container, chart);

  const seriesData = buildProvinceSeriesData(provinces, recordsByProvince);
  chart.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      borderWidth: 0,
      padding: 0,
      extraCssText: 'box-shadow:none;background:transparent;',
      formatter: tooltipHtml
    },
    visualMap: {
      show: false,
      min: 0,
      max: Math.max(1, ...seriesData.map((item) => item.value)),
      inRange: {
        color: ['#efe3d8', '#8cc7b7', '#3f9b88']
      }
    },
    series: [
      {
        name: '旅行足迹',
        type: 'map',
        map: 'china',
        roam: false,
        selectedMode: false,
        zoom: 1.08,
        label: {
          show: true,
          color: '#5f554e',
          fontSize: 11,
          fontWeight: 700
        },
        emphasis: {
          label: {
            color: '#2e2a27',
            fontWeight: 800
          },
          itemStyle: {
            areaColor: '#d95f67',
            borderColor: '#ffffff',
            borderWidth: 1.4,
            shadowBlur: 18,
            shadowColor: 'rgba(217, 95, 103, 0.35)'
          }
        },
        itemStyle: {
          areaColor: '#efe3d8',
          borderColor: '#ffffff',
          borderWidth: 0.9
        },
        select: {
          disabled: true
        },
        data: seriesData
      }
    ]
  });

  chart.off('click');
  chart.on('click', (params) => {
    if (params?.name) onProvinceSelect(params.name);
  });

  requestAnimationFrame(() => chart.resize());
}

export async function renderProvinceCityMap(container, province, records, onCitySelect) {
  const echarts = await ensureEcharts();
  const loaded = await ensureProvinceMap(province);
  chartByContainer.get(container)?.dispose();
  const holder = document.createElement('div');
  holder.className = 'echarts-china-map';
  container.replaceChildren(holder);

  if (!loaded) {
    holder.classList.add('map-empty-message');
    holder.textContent = `${province}城市地图暂未收录`;
    return;
  }

  const chart = echarts.init(holder, null, { renderer: 'canvas' });
  holder.__albumChart = chart;
  chartByContainer.set(container, chart);
  const seriesData = buildCitySeriesData(loaded.geoJson.features, records);
  chart.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      borderWidth: 0,
      padding: 0,
      extraCssText: 'box-shadow:none;background:transparent;',
      formatter: tooltipHtml
    },
    visualMap: {
      show: false,
      min: 0,
      max: Math.max(1, ...seriesData.map((item) => item.value)),
      inRange: {
        color: ['#efe3d8', '#8cc7b7', '#3f9b88']
      }
    },
    series: [
      {
        name: `${province}城市足迹`,
        type: 'map',
        map: loaded.mapName,
        roam: false,
        selectedMode: false,
        zoom: 1.04,
        label: {
          show: true,
          color: '#5f554e',
          fontSize: 11,
          fontWeight: 700
        },
        emphasis: {
          label: {
            color: '#2e2a27',
            fontWeight: 800
          },
          itemStyle: {
            areaColor: '#d95f67',
            borderColor: '#ffffff',
            borderWidth: 1.4,
            shadowBlur: 18,
            shadowColor: 'rgba(217, 95, 103, 0.35)'
          }
        },
        itemStyle: {
          areaColor: '#efe3d8',
          borderColor: '#ffffff',
          borderWidth: 0.9
        },
        data: seriesData
      }
    ]
  });

  chart.off('click');
  chart.on('click', (params) => {
    if (params?.name) onCitySelect(params.name);
  });

  requestAnimationFrame(() => chart.resize());
}

export function resizeChinaMap(container) {
  chartByContainer.get(container)?.resize();
}
