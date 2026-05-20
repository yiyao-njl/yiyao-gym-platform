const mock = require('../../utils/mockData.js');
const store = require('../../utils/store.js');

Page({
  data: {
    active: '可用',
    tabs: ['可用', '已使用', '已过期'],
    coupons: [],
    visibleCoupons: []
  },

  onShow() {
    if (!store.requireLogin('登录后可查看优惠券')) return;
    this.setData({ coupons: mock.coupons }, this.filterCoupons);
  },

  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
      return;
    }
    wx.switchTab({ url: '/pages/mine/mine' });
  },

  switchTab(e) {
    this.setData({ active: e.currentTarget.dataset.status }, this.filterCoupons);
  },

  filterCoupons() {
    const visibleCoupons = this.data.coupons.filter(item => item.status === this.data.active);
    this.setData({ visibleCoupons });
  }
});
