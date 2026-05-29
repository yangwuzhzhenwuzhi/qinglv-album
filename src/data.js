export const APP_STORAGE_KEY = 'coupleTravelAlbum:v1';

export const PROVINCES = [
  '北京',
  '天津',
  '河北',
  '山西',
  '内蒙古',
  '辽宁',
  '吉林',
  '黑龙江',
  '上海',
  '江苏',
  '浙江',
  '安徽',
  '福建',
  '江西',
  '山东',
  '河南',
  '湖北',
  '湖南',
  '广东',
  '广西',
  '海南',
  '重庆',
  '四川',
  '贵州',
  '云南',
  '西藏',
  '陕西',
  '甘肃',
  '青海',
  '宁夏',
  '新疆',
  '香港',
  '澳门',
  '台湾'
];

export const DEFAULT_SETTINGS = {
  albumTitle: '我们的旅行相册',
  partnerA: '阿涛',
  partnerB: '小雨',
  coupleStartDate: '2024-05-20',
  backgroundImage: ''
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
