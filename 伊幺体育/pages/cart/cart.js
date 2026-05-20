const store = require('../../utils/store.js');

Page({
  data: {
    cart: [],
    total: 0,
    checkedCount: 0,
    pendingLoginAction: ''
  },

  onShow() {
    this.loadCart();
  },

  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
      return;
    }
    wx.switchTab({ url: '/pages/open/open' });
  },

  loadCart() {
    const cart = store.getState().cart.map(item => Object.assign({}, item, {
      quantity: Math.max(1, Number(item.quantity || 1)),
      checked: item.checked !== false
    }));
    const checked = cart.filter(item => item.checked);
    const total = checked.reduce((sum, item) => sum + Number(item.price || 0) * Math.max(1, Number(item.quantity || 1)), 0);
    const checkedCount = checked.reduce((sum, item) => sum + Math.max(1, Number(item.quantity || 1)), 0);
    this.setData({ cart, total, checkedCount });
  },

  toggle(e) {
    const cart = this.data.cart.map(item => item.id === e.currentTarget.dataset.id ? Object.assign({}, item, { checked: !item.checked }) : item);
    store.updateCart(cart);
    this.loadCart();
  },

  remove(e) {
    const cart = this.data.cart.filter(item => item.id !== e.currentTarget.dataset.id);
    store.updateCart(cart);
    this.loadCart();
  },

  checkout() {
    if (!store.getState().loggedIn) {
      this.setData({ pendingLoginAction: 'checkout' });
      const popup = this.selectComponent('#loginPopup');
      if (popup) popup.open({ scene: 'cart-checkout' });
      return;
    }
    if (!this.data.checkedCount) {
      wx.showToast({ title: '请选择场次', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/pages/payment/payment' });
  },

  onLoginSuccess() {
    this.setData({ pendingLoginAction: '' });
    this.checkout();
  }
});
