const store = require('../../utils/store.js');
const mock = require('../../utils/mockData.js');
const api = require('../../utils/api.js');
const { buildBackendOrderRequest, getCartPricing, normalizeDateValue, validateCartItems } = require('../../utils/cartValidation.js');
const { isStoreOpenNow } = require('../../utils/timeSlots.js');

Page({
  data: {
    items: [],
    subtotal: 0,
    originTotal: 0,
    discount: 0,
    total: 0,
    coupon: mock.coupons[0],
    sourceCartId: '',
    sourceStoreId: '',
    pendingLoginAction: ''
  },

  onLoad(options) {
    this.setData({
      sourceCartId: options.cartId || '',
      sourceStoreId: options.storeId || ''
    }, this.loadItems);
  },

  onShow() {
    if (this.data.sourceCartId !== '' || this.data.sourceStoreId !== '') this.loadItems();
  },

  loadItems() {
    const cart = store.getState().cart;
    const scopedCart = this.data.sourceStoreId ? cart.filter(item => item.storeId === this.data.sourceStoreId) : cart;
    const items = this.data.sourceCartId ? cart.filter(item => item.id === this.data.sourceCartId) : scopedCart.filter(item => item.checked !== false);
    const validItems = this.removeInvalidItems(items, false);
    this.applyPricing(validItems);
  },

  removeInvalidItems(items, showToast) {
    const result = validateCartItems(items);
    if (!result.valid) {
      store.removeCartItems(result.invalid.map(item => item.item.id));
      if (showToast) {
        wx.showToast({ title: result.invalid[0].reason || '当前可预约时长不足，请重新选择时间', icon: 'none' });
      }
      return items.filter(item => !result.invalid.some(invalid => invalid.item.id === item.id));
    }
    return items;
  },

  applyPricing(items) {
    const pricing = getCartPricing(items, this.data.coupon);
    this.setData({
      items,
      subtotal: pricing.subtotal,
      originTotal: pricing.originTotal,
      discount: pricing.discount,
      total: pricing.total
    });
  },

  normalizeOrderItems(items) {
    const now = new Date();
    const todayValue = normalizeDateValue(`${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`);
    return (items || []).map(item => {
      const gym = mock.stores.find(value => value.id === item.storeId);
      const defaultWalkInMinute = gym && gym.hours ? Math.max(gym.hours.start * 60, now.getHours() * 60 + now.getMinutes()) : 0;
      const itemDate = normalizeDateValue(item.dateValue || (item.date === '今天' ? todayValue : item.date));
      const isWalkIn = item.mode === 'walkIn'
        && !!gym
        && isStoreOpenNow(gym, now)
        && itemDate === todayValue
        && Number(item.startMinute) === defaultWalkInMinute;
      const mode = isWalkIn ? 'walkIn' : 'reservation';
      return Object.assign({}, item, {
        mode,
        date: mode === 'reservation' ? itemDate : '今天',
        dateValue: itemDate
      });
    });
  },

  resolveOrderMode(items) {
    return (items || []).every(item => item.mode === 'walkIn') ? 'walkIn' : 'reservation';
  },

  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
      return;
    }
    wx.switchTab({ url: '/pages/open/open' });
  },

  async pay() {
    if (!store.getState().loggedIn) {
      this.setData({ pendingLoginAction: 'pay' });
      const popup = this.selectComponent('#loginPopup');
      if (popup) popup.open({ scene: 'order-pay' });
      return;
    }
    if (!this.data.items.length) {
      wx.showToast({ title: '暂无可支付场次', icon: 'none' });
      return;
    }
    const validItems = this.removeInvalidItems(this.data.items, true);
    if (validItems.length !== this.data.items.length || !validItems.length) {
      this.applyPricing(validItems);
      return;
    }
    const orderItems = this.normalizeOrderItems(validItems);
    if (!(await this.showReservationOrderNoticeIfNeeded(orderItems))) return;
    const mode = this.resolveOrderMode(orderItems);
    const backendOrderRequest = buildBackendOrderRequest(orderItems, mode, this.data.coupon);
    wx.showLoading({ title: '提交订单中' });
    api.app.createOrder(backendOrderRequest)
      .then(backendOrder => api.app.createPayment({
        orderNo: backendOrder.orderNo,
        payChannel: 'MOCK'
      }).then(payment => api.app.mockPaySuccess({
        orderNo: backendOrder.orderNo,
        paymentNo: payment.paymentNo
      }).then(() => backendOrder)))
      .then(backendOrder => {
        wx.hideLoading();
        const order = store.createOrder(orderItems, mode, this.data.total, { backendOrderRequest, backendOrder });
        store.payOrder(order.id);
        store.removeCartItems(validItems.map(item => item.id));
        this.showPaySuccess(order);
      })
      .catch(error => {
        wx.hideLoading();
        wx.showToast({ title: error.message || '后端暂不可用，使用本地模拟支付', icon: 'none' });
        const order = store.createOrder(orderItems, mode, this.data.total, { backendOrderRequest });
        store.payOrder(order.id);
        store.removeCartItems(validItems.map(item => item.id));
        this.showPaySuccess(order);
      });
  },

  showPaySuccess(order) {
    wx.showModal({
      title: '支付成功',
      content: '已生成订单，可前往订单页查看使用状态。',
      confirmText: '查看订单',
      cancelText: '继续预约',
      success(res) {
        if (res.confirm) {
          store.setState({ orderListActive: order.type });
          wx.switchTab({ url: '/pages/orders/orders' });
        }
        else wx.switchTab({ url: '/pages/open/open' });
      }
    });
  },

  failPay() {
    wx.showModal({
      title: '支付失败',
      content: '模拟支付已取消，可重新发起支付。',
      showCancel: false
    });
  },

  showReservationOrderNoticeIfNeeded(items) {
    const state = store.getState();
    const needNotice = state.openMode === 'walkIn' && (items || []).some(item => item.mode === 'reservation');
    if (!needNotice) return Promise.resolve(true);
    const target = (items || []).find(item => item.mode === 'reservation') || {};
    return new Promise(resolve => {
      wx.showModal({
        title: '将按预约订单处理',
        content: `当前场次开始时间为${target.startTime || '稍后时段'}，晚于当前时间，将生成预约订单并为你保留场地。是否继续支付？`,
        cancelText: '再看看',
        confirmText: '继续',
        confirmColor: '#111111',
        success: res => resolve(!!res.confirm),
        fail: () => resolve(false)
      });
    });
  },

  onLoginSuccess() {
    this.setData({ pendingLoginAction: '' });
    this.pay();
  }
});
