const mock = require('../../utils/mockData.js');
const store = require('../../utils/store.js');

Page({
  data: {
    activity: null
  },

  onLoad(options) {
    const activity = mock.activities.find(item => item.id === options.id) || mock.activities[0];
    this.setData({ activity });
  },

  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
      return;
    }
    wx.switchTab({ url: '/pages/index/index' });
  },

  join() {
    if (!store.requireLogin('登录后可参与活动或领取优惠券')) return;
    wx.showToast({ title: '参与成功', icon: 'success' });
  }
});
