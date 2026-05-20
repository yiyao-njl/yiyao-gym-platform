const store = require('../../utils/store.js');

Page({
  data: {
    order: null
  },

  onLoad(options) {
    const order = store.getState().orders.find(item => item.id === options.id) || null;
    this.setData({ order });
  },

  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
      return;
    }
    wx.switchTab({ url: '/pages/orders/orders' });
  },

  goMap() {
    wx.showToast({ title: '已模拟打开导航', icon: 'none' });
  },

  goOpen() {
    wx.switchTab({ url: '/pages/open/open' });
  }
});
