const store = require('../../utils/store.js');
const api = require('../../utils/api.js');

function isDevtools() {
  try {
    return wx.getSystemInfoSync().platform === 'devtools';
  } catch (error) {
    return false;
  }
}

Component({
  data: {
    visible: false,
    agreementVisible: false,
    agreed: false,
    loginCode: '',
    scene: 'business'
  },

  methods: {
    noop() {},

    open(options) {
      const state = store.getState();
      this.setData({
        visible: true,
        agreementVisible: false,
        agreed: !!state.agreementAccepted,
        scene: options && options.scene ? options.scene : 'business'
      });
      this.refreshLoginCode();
    },

    close() {
      this.setData({ visible: false, agreementVisible: false });
      this.triggerEvent('close');
    },

    refreshLoginCode() {
      wx.login({
        success: res => {
          if (res.code) this.setData({ loginCode: res.code });
        }
      });
    },

    toggleAgreement() {
      this.setData({ agreed: !this.data.agreed });
      if (!this.data.agreed) return;
      store.acceptAgreement();
    },

    tapOneKey() {
      if (this.data.agreed) return;
      this.setData({ agreementVisible: true });
    },

    disagreeAgreement() {
      this.setData({ agreementVisible: false, agreed: false });
    },

    agreeAgreement() {
      store.acceptAgreement();
      this.setData({ agreementVisible: false, agreed: true });
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
      const loginCode = this.data.loginCode;
      if (!loginCode) {
        this.refreshLoginCode();
        wx.showToast({ title: '正在重新获取登录凭证', icon: 'none' });
        return;
      }
      const payload = {
        loginCode,
        phoneCode: detail.code || '',
        phoneEncryptedData: detail.encryptedData || '',
        phoneIv: detail.iv || '',
        phoneCloudId: detail.cloudID || '',
        scene: this.data.scene
      };
      api.auth.wechatLogin(payload)
        .then(token => {
          store.completeWechatLogin(Object.assign({}, payload, {
            accessToken: token.accessToken,
            refreshToken: token.refreshToken,
            userId: token.userId
          }));
          wx.showToast({ title: '登录成功', icon: 'success' });
          this.setData({ visible: false, agreementVisible: false });
          this.triggerEvent('success');
        })
        .catch(error => {
          wx.showToast({ title: error.message || '登录失败', icon: 'none' });
        });
    },

    goPhoneLogin() {
      this.close();
      wx.navigateTo({ url: `/pages/phoneLogin/phoneLogin?scene=${this.data.scene}` });
    }
  }
});
