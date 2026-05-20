const store = require('../../utils/store.js');

const cityByLocation = [
  { city: '深圳', latitude: 22.543096, longitude: 114.057865 },
  { city: '广州', latitude: 23.12911, longitude: 113.264385 },
  { city: '上海', latitude: 31.230416, longitude: 121.473701 },
  { city: '北京', latitude: 39.9042, longitude: 116.407396 },
  { city: '成都', latitude: 30.572815, longitude: 104.066801 },
  { city: '武汉', latitude: 30.592849, longitude: 114.305539 }
];

function distanceScore(a, b) {
  return Math.abs(a.latitude - b.latitude) + Math.abs(a.longitude - b.longitude);
}

Page({
  data: {
    hotCities: ['北京', '上海', '成都', '深圳', '广州', '长沙', '郑州', '武汉'],
    cities: [
      { letter: 'A', names: ['阿拉善盟', '鞍山市', '安庆市', '安阳市', '阿坝藏族羌族自治州', '安顺市', '阿里地区', '安康市', '阿克苏地区', '阿拉尔市', '澳门特别行政区'] },
      { letter: 'B', names: ['北京', '保定市', '包头市', '蚌埠市', '北海市'] },
      { letter: 'C', names: ['成都', '长沙', '重庆', '长春市', '常州市'] },
      { letter: 'G', names: ['广州', '贵阳', '桂林市'] },
      { letter: 'S', names: ['深圳', '上海', '苏州', '沈阳市', '石家庄市'] },
      { letter: 'W', names: ['武汉', '无锡', '温州市'] },
      { letter: 'X', names: ['厦门', '西安', '徐州市'] }
    ],
    letters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'W', 'X', 'Y', 'Z'],
    locationCity: '',
    scrollInto: ''
  },

  onLoad(options) {
    this.redirectStore = options.redirectStore === '1';
    this.locate({ silent: true });
  },

  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
      return;
    }
    wx.switchTab({ url: '/pages/open/open' });
  },

  locate(options = {}) {
    wx.getLocation({
      type: 'gcj02',
      success: res => {
        const nearest = cityByLocation
          .map(item => Object.assign({}, item, { score: distanceScore(res, item) }))
          .sort((a, b) => a.score - b.score)[0];
        this.setData({ locationCity: nearest.city });
      },
      fail: () => {
        this.setData({ locationCity: '' });
        if (!options.silent) {
          wx.showToast({ title: '定位失败', icon: 'none' });
        }
      }
    });
  },

  chooseLocationCity() {
    if (!this.data.locationCity) {
      this.locate();
      return;
    }
    store.setState({ currentCity: this.data.locationCity });
    this.returnToStore();
  },

  chooseCity(e) {
    const city = e.currentTarget.dataset.city || this.data.locationCity;
    if (!city) {
      this.locate();
      return;
    }
    store.setState({ currentCity: city });
    this.returnToStore();
  },

  returnToStore() {
    const targetUrl = `/pages/store/store?city=${store.getState().currentCity || ''}`;
    if (this.redirectStore) {
      wx.redirectTo({ url: targetUrl });
      return;
    }
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
      return;
    }
    wx.navigateTo({ url: targetUrl });
  },

  jumpTop() {
    this.setData({ scrollInto: 'locate-section' });
  },

  jumpHot() {
    this.setData({ scrollInto: 'hot-section' });
  },

  jumpLetter(e) {
    this.setData({ scrollInto: `letter-${e.currentTarget.dataset.letter}` });
  }
});
