const store = require('../../utils/store.js');
const api = require('../../utils/api.js');

function isDevtools() {
  try {
    return wx.getSystemInfoSync().platform === 'devtools';
  } catch (error) {
    return false;
  }
}

Page({
  data: {
    loginCode: '',
    phoneReady: false,
    phoneAuthText: '选择微信手机号',
    phoneDetail: null,
    nickname: '',
    avatar: '',
    submitting: false
  },

  onLoad() {
    const state = store.getState();
    const user = state.user || {};
    this.setData({
      nickname: state.loggedIn ? user.nickname : '',
      avatar: user.avatar || ''
    });
    this.refreshLoginCode();
  },

  refreshLoginCode() {
    wx.login({
      success: res => {
        if (!res.code) {
          wx.showToast({ title: '微信登录凭证获取失败', icon: 'none' });
          return;
        }
        this.setData({ loginCode: res.code });
      },
      fail: () => {
        wx.showToast({ title: '微信登录接口调用失败', icon: 'none' });
      }
    });
  },

  onChooseAvatar(e) {
    this.setData({ avatar: e.detail.avatarUrl });
  },

  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value });
  },

  onGetPhoneNumber(e) {
    const detail = e.detail || {};
    if (detail.errMsg && detail.errMsg.indexOf('ok') === -1) {
      console.warn('getPhoneNumber failed:', detail);
      if (!isDevtools()) {
        wx.showModal({
          title: '手机号授权失败',
          content: detail.errMsg || '微信未返回手机号授权凭证，请检查小程序账号权限或重新授权。',
          showCancel: false
        });
        return;
      }
      wx.showToast({ title: '开发调试使用模拟手机号', icon: 'none' });
    }
    this.setData({
      phoneReady: true,
      phoneAuthText: detail.code ? '已选择微信手机号' : '开发调试手机号',
      phoneDetail: detail
    });
  },

  submit() {
    if (this.data.submitting) return;
    const nickname = String(this.data.nickname || '').trim();
    if (!this.data.loginCode) {
      this.refreshLoginCode();
      wx.showToast({ title: '正在重新获取登录凭证', icon: 'none' });
      return;
    }
    if (!this.data.phoneReady) {
      wx.showToast({ title: '请选择微信手机号', icon: 'none' });
      return;
    }
    if (!nickname) {
      wx.showToast({ title: '请设置昵称', icon: 'none' });
      return;
    }
    this.setData({ submitting: true });
    const phoneDetail = this.data.phoneDetail || {};
    const payload = {
      loginCode: this.data.loginCode,
      phoneCode: phoneDetail.code || '',
      phoneEncryptedData: phoneDetail.encryptedData || '',
      phoneIv: phoneDetail.iv || '',
      phoneCloudId: phoneDetail.cloudID || '',
      nickname,
      avatar: this.data.avatar
    };
    api.auth.wechatLogin(payload)
      .then(token => {
        store.completeWechatLogin(Object.assign({}, payload, {
          accessToken: token.accessToken,
          refreshToken: token.refreshToken,
          userId: token.userId
        }));
        wx.showToast({ title: '登录成功', icon: 'success' });
        setTimeout(() => {
          this.setData({ submitting: false });
          wx.navigateBack({
            fail: () => wx.switchTab({ url: '/pages/mine/mine' })
          });
        }, 500);
      })
      .catch(error => {
        this.setData({ submitting: false });
        wx.showToast({ title: error.message || '登录失败', icon: 'none' });
      });
  },

  goBack() {
    wx.navigateBack({
      fail: () => wx.switchTab({ url: '/pages/mine/mine' })
    });
  }
});
