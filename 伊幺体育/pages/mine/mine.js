const store = require('../../utils/store.js');

Page({
  data: {
    loggedIn: false,
    user: {},
    profileSub: '微信授权后查看会员权益',
    progressPercent: 0,
    expGap: 0,
    loginLoading: false,
    pendingLoginAction: ''
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
    const popup = this.selectComponent('#loginPopup');
    if (popup) popup.open({ scene: 'mine' });
  },

  onLoginSuccess() {
    const action = this.data.pendingLoginAction;
    this.setData({ pendingLoginAction: '' });
    if (action === 'editProfile') this.editProfile();
    if (action === 'goMember') this.goMember();
    if (action === 'goCoupon') this.goCoupon();
    if (action === 'goExpDetail') this.goExpDetail();
  },

  ensureLogin(action) {
    if (store.getState().loggedIn) return true;
    this.setData({ pendingLoginAction: action || '' });
    const popup = this.selectComponent('#loginPopup');
    if (popup) popup.open({ scene: action || 'mine' });
    return false;
  },

  editProfile() {
    if (!this.ensureLogin('editProfile')) return;
    wx.navigateTo({ url: '/pages/profileEdit/profileEdit' });
  },

  goMember() {
    if (!this.ensureLogin('goMember')) return;
    wx.navigateTo({ url: '/pages/member/member' });
  },

  goCoupon() {
    if (!this.ensureLogin('goCoupon')) return;
    wx.navigateTo({ url: '/pages/coupon/coupon' });
  },

  goExpDetail() {
    if (!this.ensureLogin('goExpDetail')) return;
    wx.navigateTo({ url: '/pages/expDetail/expDetail' });
  },

  goAccountSetting() {
    if (!this.ensureLogin('goAccountSetting')) return;
    wx.navigateTo({ url: '/pages/accountManage/accountManage' });
  },

  goOrders() {
    wx.switchTab({ url: '/pages/orders/orders' });
  }
});
