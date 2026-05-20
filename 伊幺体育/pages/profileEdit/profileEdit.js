const store = require('../../utils/store.js');

Page({
  data: {
    form: {}
  },

  onLoad() {
    const state = store.getState();
    if (!state.loggedIn) {
      wx.navigateTo({ url: '/pages/phoneLogin/phoneLogin' });
      return;
    }
    this.setData({ form: Object.assign({}, state.user) });
  },

  onInput(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ [`form.${key}`]: e.detail.value });
  },

  changeGender(e) {
    this.setData({ 'form.gender': e.detail.value });
  },

  changeBirthday(e) {
    this.setData({ 'form.birthday': e.detail.value });
  },

  save() {
    const nickname = String(this.data.form.nickname || '').trim();
    if (!nickname) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }
    store.updateUser(Object.assign({}, this.data.form, { nickname }));
    wx.showToast({ title: '保存成功', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 500);
  },

  switchAccount() {
    wx.navigateTo({ url: '/pages/accountManage/accountManage' });
  },

  goSwitchAccount() {
    wx.navigateTo({ url: '/pages/switchAccount/switchAccount' });
  },

  goBack() {
    wx.navigateBack();
  }
});
