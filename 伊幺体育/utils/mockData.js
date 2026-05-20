const image = '/images/伊幺体育.jpg';

const cities = [
  { letter: 'D', names: ['东莞', '大连', '德阳'] },
  { letter: 'F', names: ['佛山', '福州'] },
  { letter: 'G', names: ['广州', '贵阳'] },
  { letter: 'H', names: ['杭州', '合肥', '海口'] },
  { letter: 'N', names: ['南京', '南宁', '宁波'] },
  { letter: 'S', names: ['深圳', '上海', '苏州'] },
  { letter: 'W', names: ['武汉', '无锡'] },
  { letter: 'X', names: ['厦门', '西安'] }
];

const stores = [
  {
    id: 'store-001',
    city: '深圳',
    name: '伊幺体育中心店',
    address: '广东省深圳市南山区粤海街道科技园运动路18号伊幺体育中心1层',
    latitude: 22.76398,
    longitude: 113.94118,
    distance: '1.8km',
    status: '营业中',
    hours: { start: 9, end: 24 },
    closeIntervals: [],
    images: [image, image, image]
  },
  {
    id: 'store-002',
    city: '深圳',
    name: '伊幺体育龙华馆',
    address: '广东省深圳市龙华区民治街道民治大道66号龙华体育综合馆2层',
    latitude: 22.67323,
    longitude: 114.03262,
    distance: '4.6km',
    status: '营业中',
    hours: { start: 10, end: 26 },
    closeIntervals: [],
    images: [image, image]
  },
  {
    id: 'store-003',
    city: '广州',
    name: '伊幺体育天河馆',
    address: '广东省广州市天河区体育西路99号天河运动公园东门旁',
    latitude: 23.13489,
    longitude: 113.33088,
    distance: '12.2km',
    status: '营业中',
    hours: { start: 8, end: 23 },
    closeIntervals: [],
    images: [image, image]
  }
];

const sports = ['全部', '篮球', '羽毛球', '气排球', '乒乓球', '匹克球'];

const venues = [
  {
    id: 'venue-001',
    storeId: 'store-001',
    name: 'A1 全场篮球馆',
    code: 'A1',
    sport: '篮球',
    price: 88,
    status: '可预定',
    remain: 8,
    wait: '',
    customOpenTimeEnabled: true,
    packages: [
      { id: 'pkg-1', name: '单场 1 小时', duration: 1, price: 88 },
      { id: 'pkg-2', name: '畅打 2 小时', duration: 2, price: 158 }
    ],
    image,
    timeRanges: [
      { start: 10 * 60 + 11, end: 11 * 60, type: 'using' },
      { start: 11 * 60, end: 11 * 60 + 42, type: 'booked' },
      { start: 15 * 60 + 5, end: 15 * 60 + 35, type: 'booked' }
    ],
    slots: ['free', 'using', 'booked', 'free', 'free', 'free', 'booked', 'free']
  },
  {
    id: 'venue-002',
    storeId: 'store-001',
    name: 'B2 羽毛球场',
    code: 'B2',
    sport: '羽毛球',
    price: 36,
    status: '使用中',
    remain: 5,
    wait: '约 25 分钟',
    customOpenTimeEnabled: false,
    packages: [
      { id: 'pkg-3', name: '标准 1 小时', duration: 1, price: 36 }
    ],
    image,
    timeRanges: [
      { start: 9 * 60, end: 10 * 60 + 40, type: 'using' },
      { start: 13 * 60 + 15, end: 13 * 60 + 45, type: 'booked' }
    ],
    slots: ['using', 'using', 'free', 'free', 'booked', 'free', 'free', 'free']
  },
  {
    id: 'venue-003',
    storeId: 'store-001',
    name: 'C3 气排球场',
    code: 'C3',
    sport: '气排球',
    price: 58,
    status: '可预定',
    remain: 6,
    wait: '',
    customOpenTimeEnabled: true,
    packages: [
      { id: 'pkg-4', name: '单场 1 小时', duration: 1, price: 58 },
      { id: 'pkg-5', name: '团队 2 小时', duration: 2, price: 108 }
    ],
    image,
    timeRanges: [
      { start: 12 * 60 + 10, end: 13 * 60 + 20, type: 'booked' }
    ],
    slots: ['free', 'free', 'free', 'booked', 'booked', 'free', 'free', 'free']
  },
  {
    id: 'venue-004',
    storeId: 'store-001',
    name: 'D1 乒乓球台',
    code: 'D1',
    sport: '乒乓球',
    price: 28,
    status: '可预定',
    remain: 3,
    wait: '',
    customOpenTimeEnabled: false,
    packages: [
      { id: 'pkg-6', name: '休闲 1 小时', duration: 1, price: 28 }
    ],
    image,
    timeRanges: [
      { start: 9 * 60, end: 10 * 60 + 25, type: 'booked' },
      { start: 23 * 60 + 20, end: 24 * 60, type: 'booked' }
    ],
    slots: ['booked', 'booked', 'free', 'free', 'free', 'free', 'free', 'booked']
  },
  {
    id: 'venue-005',
    storeId: 'store-002',
    name: 'P1 匹克球场',
    code: 'P1',
    sport: '匹克球',
    price: 48,
    status: '可预定',
    remain: 9,
    wait: '',
    customOpenTimeEnabled: true,
    packages: [
      { id: 'pkg-7', name: '体验 1 小时', duration: 1, price: 48 }
    ],
    image,
    timeRanges: [
      { start: 14 * 60, end: 14 * 60 + 30, type: 'booked' }
    ],
    slots: ['free', 'free', 'free', 'free', 'booked', 'free', 'free', 'free']
  }
];

const activities = [
  {
    id: 'act-001',
    title: '周末篮球拼场季',
    summary: '预约篮球场满 2 小时立减 30 元',
    time: '5.16 - 6.30',
    image,
    rule: '活动期间预约指定篮球场，支付页自动模拟优惠。'
  },
  {
    id: 'act-002',
    title: '会员日双倍伊幺币',
    summary: '每周三到店开场可获得双倍成长值',
    time: '每周三',
    image,
    rule: '登录会员后参与，前端演示领取成功状态。'
  }
];

const coupons = [
  { id: 'coupon-001', title: '满 99 减 20', amount: 20, threshold: 99, status: '可用', expire: '2026.06.30', scope: '全场馆通用' },
  { id: 'coupon-002', title: '羽毛球 8 折券', amount: 12, threshold: 30, status: '可用', expire: '2026.05.31', scope: '羽毛球项目' },
  { id: 'coupon-003', title: '新人体验券', amount: 15, threshold: 49, status: '已使用', expire: '2026.04.30', scope: '首次下单' }
];

const memberBenefits = [
  { id: 'upgrade', title: '升级礼遇', desc: '每次升级可获得场馆券、满减券或活动优先名额。' },
  { id: 'birthday', title: '生日特权', desc: '生日月可领取一次专属运动券。' },
  { id: 'exchange', title: '专属兑换', desc: '经验等级越高，可兑换的课程、场地券越丰富。' },
  { id: 'level', title: '等级特权', desc: '高等级会员享预约提醒、活动报名优先等权益。' }
];

const levelRules = [
  '升至 LV.1 运动新星：单场 9 折券 *1 + 新人体验券 *1',
  '升至 LV.2 活力先锋：满 99 减 15 元券 *1 + 羽毛球 8.5 折券 *1',
  '升至 LV.3 运动达人：场地 8 折券 *1 + 活动报名优先资格 *1',
  '升至 LV.4 球场能手：满 199 减 40 元券 *1 + 预约提醒权益',
  '升至 LV.5 俱乐部伙伴：整单 7.5 折券 *1 + 专属活动名额 *2'
];

const expRecords = [
  {
    id: 'exp-001',
    month: '2026-04',
    title: '会员等级到期，经验值重新计算',
    desc: '定级为 LV.1 运动新星',
    time: '2026-04-07 00:14:59',
    value: 1,
    currentExp: 1,
    type: 'reset'
  },
  {
    id: 'exp-002',
    month: '2025-08',
    title: '订单消费',
    desc: '订单号：2025082122544710075320208',
    time: '2025-08-21 22:54:47',
    value: 13,
    type: 'order'
  },
  {
    id: 'exp-003',
    month: '2025-06',
    title: '活动参与',
    desc: '会员日双倍经验活动',
    time: '2025-06-18 19:20:10',
    value: 8,
    type: 'activity'
  },
  {
    id: 'exp-004',
    month: '2025-02',
    title: '订单消费',
    desc: '订单号：2025020922321010075320264',
    time: '2025-02-09 22:32:13',
    value: 13,
    type: 'order'
  }
];

const user = {
  avatar: image,
  nickname: '青春活力的运动员',
  phone: '138****2026',
  gender: '',
  birthday: '',
  level: 'LV.1',
  levelName: '运动新星',
  exp: 25,
  nextExp: 50,
  memberExpire: '2026-11-03',
  coins: 10,
  coupons: 2,
  benefitsUnlocked: 2,
  member: '活力会员'
};

module.exports = {
  image,
  cities,
  hotCities: ['深圳', '广州', '上海', '杭州', '南京', '武汉', '厦门', '西安'],
  stores,
  sports,
  venues,
  activities,
  coupons,
  memberBenefits,
  levelRules,
  expRecords,
  user
};
