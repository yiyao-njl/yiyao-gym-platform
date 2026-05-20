const store = require('../../utils/store.js');

Page({
  data: {
    maskedPhone: '',
    loginCode: ''
  },

  onLoad() {
    this.refresh();
    this.refreshLoginCode();
  },

  refresh() {
    const state = store.getState();
    if (!state.loggedIn) {
      wx.switchTab({ url: '/pages/mine/mine' });
      return;
    }
    const account = store.getCurrentAccount(state);
    this.setData({
      maskedPhone: account ? account.maskedPhone : state.user.phone
    });
  },

  refreshLoginCode() {
    wx.login({
      success: res => {
        if (res.code) this.setData({ loginCode: res.code });
      }
    });
  },

  onSwitchPhone(e) {
    const detail = e.detail || {};
    if (detail.errMsg && detail.errMsg.indexOf('ok') === -1) {
      wx.showToast({ title: '未完成手机号授权', icon: 'none' });
      return;
    }
    if (!this.data.loginCode) {
      this.refreshLoginCode();
      wx.showToast({ title: '正在重新获取登录凭证', icon: 'none' });
      return;
    }
    store.switchAccountByWechat({
      loginCode: this.data.loginCode,
      phoneCode: detail.code || '',
      phoneEncryptedData: detail.encryptedData || '',
      phoneIv: detail.iv || '',
      phoneCloudId: detail.cloudID || ''
    });
    wx.showToast({ title: '切换成功', icon: 'success' });
    setTimeout(() => wx.switchTab({ url: '/pages/mine/mine' }), 500);
  },

  goCancel() {
    wx.showToast({ title: '暂不支持注销账号', icon: 'none' });
  },

  goBack() {
    wx.navigateBack();
  }
});
