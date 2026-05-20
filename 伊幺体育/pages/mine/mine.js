const store = require('../../utils/store.js');

Page({
  data: {
    loggedIn: false,
    user: {},
    profileSub: '微信授权后查看会员权益',
    progressPercent: 0,
    expGap: 0,
    loginLoading: false
  },

  onShow() {
    const state = store.getState();
    const user = state.user || {};
    const nextExp = Number(user.nextExp || 1);
    const exp = Number(user.exp || 0);
    this.setData({
      loggedIn: state.loggedIn,
      user,
      profileSub: state.loggedIn ? `${user.phone} · ${user.member}` : '微信授权后查看会员权益',
      progressPercent: Math.min(100, Math.round(exp * 100 / nextExp)),
      expGap: Math.max(0, nextExp - exp)
    });
  },

  login() {
    wx.navigateTo({ url: '/pages/phoneLogin/phoneLogin' });
  },

  logout() {
    wx.navigateTo({ url: '/pages/accountManage/accountManage' });
  },

  ensureLogin(message) {
    return store.requireLogin(message);
  },

  editProfile() {
    if (!this.ensureLogin('登录后可编辑个人资料')) return;
    wx.navigateTo({ url: '/pages/profileEdit/profileEdit' });
  },

  goMember() {
    if (!this.ensureLogin('登录后可查看权益规则')) return;
    wx.navigateTo({ url: '/pages/member/member' });
  },

  goCoupon() {
    if (!this.ensureLogin('登录后可查看优惠券')) return;
    wx.navigateTo({ url: '/pages/coupon/coupon' });
  },

  goExpDetail() {
    if (!this.ensureLogin('登录后可查看经验值明细')) return;
    wx.navigateTo({ url: '/pages/expDetail/expDetail' });
  },

  goOrders() {
    wx.switchTab({ url: '/pages/orders/orders' });
  }
});
