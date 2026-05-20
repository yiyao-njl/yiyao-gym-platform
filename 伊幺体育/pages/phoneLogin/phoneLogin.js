const store = require('../../utils/store.js');
const api = require('../../utils/api.js');

Page({
  data: {
    phone: '',
    code: '',
    sent: false,
    countdown: 0
  },

  onUnload() {
    if (this.codeTimer) clearInterval(this.codeTimer);
  },

  onPhoneInput(e) {
    this.setData({ phone: String(e.detail.value || '').replace(/\D/g, '').slice(0, 11) });
  },

  onCodeInput(e) {
    this.setData({ code: String(e.detail.value || '').replace(/\D/g, '').slice(0, 6) });
  },

  sendCode() {
    if (!/^1\d{10}$/.test(this.data.phone)) {
      wx.showToast({ title: '请输入正确手机号', icon: 'none' });
      return;
    }
    if (this.data.countdown > 0) return;
    this.setData({ sent: true, countdown: 60 });
    api.auth.sendSms(this.data.phone)
      .then(res => {
        wx.showToast({ title: res.mockCode ? `验证码 ${res.mockCode}` : '验证码已发送', icon: 'none' });
      })
      .catch(() => {
        wx.showToast({ title: `验证码 ${store.getSmsCode()}`, icon: 'none' });
      });
    this.codeTimer = setInterval(() => {
      const next = this.data.countdown - 1;
      if (next <= 0) {
        clearInterval(this.codeTimer);
        this.codeTimer = null;
        this.setData({ countdown: 0 });
        return;
      }
      this.setData({ countdown: next });
    }, 1000);
  },

  login() {
    if (!/^1\d{10}$/.test(this.data.phone)) {
      wx.showToast({ title: '请输入正确手机号', icon: 'none' });
      return;
    }
    if (!this.data.code) {
      wx.showToast({ title: '请输入验证码', icon: 'none' });
      return;
    }
    api.auth.smsLogin(this.data.phone, this.data.code)
      .then(token => {
        const result = store.completeSmsLogin(this.data.phone, this.data.code);
        if (!result.success) {
          wx.showToast({ title: result.message, icon: 'none' });
          return;
        }
        const state = store.getState();
        store.setState({
          auth: Object.assign({}, state.auth || {}, {
            accessToken: token.accessToken,
            refreshToken: token.refreshToken,
            userType: token.userType,
            loginType: 'sms'
          })
        });
        this.afterLogin();
      })
      .catch(error => {
        const result = store.completeSmsLogin(this.data.phone, this.data.code);
        if (!result.success) {
          wx.showToast({ title: error.message || result.message, icon: 'none' });
          return;
        }
        this.afterLogin();
      });
  },

  afterLogin() {
    wx.showToast({ title: '登录成功', icon: 'success' });
    setTimeout(() => {
      wx.navigateBack({
        fail: () => wx.switchTab({ url: '/pages/mine/mine' })
      });
    }, 500);
  },

  goHelp() {
    wx.showToast({ title: '请确认短信未被拦截', icon: 'none' });
  },

  goBack() {
    wx.navigateBack({
      fail: () => wx.switchTab({ url: '/pages/mine/mine' })
    });
  }
});
