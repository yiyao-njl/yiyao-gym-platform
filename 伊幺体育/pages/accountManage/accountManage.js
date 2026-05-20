const store = require('../../utils/store.js');

Page({
  onLoad() {
    if (!store.getState().loggedIn) {
      wx.switchTab({ url: '/pages/mine/mine' });
    }
  },

  goSwitch() {
    wx.navigateTo({ url: '/pages/switchAccount/switchAccount' });
  },

  goLogout() {
    wx.navigateTo({ url: '/pages/logout/logout' });
  },

  goBack() {
    wx.navigateBack();
  }
});
