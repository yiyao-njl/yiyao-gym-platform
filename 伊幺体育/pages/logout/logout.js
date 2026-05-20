const store = require('../../utils/store.js');

Page({
  data: {
    confirmVisible: false
  },

  showConfirm() {
    this.setData({ confirmVisible: true });
  },

  hideConfirm() {
    this.setData({ confirmVisible: false });
  },

  confirmLogout() {
    store.logoutAndReset();
    wx.showToast({ title: '已退出登录', icon: 'success' });
    setTimeout(() => wx.switchTab({ url: '/pages/index/index' }), 500);
  },

  goBack() {
    wx.navigateBack();
  },

  noopTouchMove() {}
});
