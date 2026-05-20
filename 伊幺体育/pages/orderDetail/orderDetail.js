const store = require('../../utils/store.js');
const api = require('../../utils/api.js');

Page({
  data: {
    order: null,
    canConfirmArrival: false,
    currentMinute: 0
  },

  onLoad(options) {
    this.loadOrder(options.id);
    this.startTimer();
  },

  onUnload() {
    if (this._timer) clearInterval(this._timer);
  },

  startTimer() {
    this.updateTime();
    this._timer = setInterval(() => this.updateTime(), 30000);
  },

  updateTime() {
    const now = new Date();
    const currentMinute = now.getHours() * 60 + now.getMinutes();
    this.setData({ currentMinute });
    this.checkCanConfirm();
  },

  async loadOrder(orderId) {
    try {
      const res = await api.app.orderDetail(orderId);
      const order = res && res.data ? res.data : res;
      this.setData({ order }, () => this.checkCanConfirm());
      // Update local cache
      const state = store.getState();
      const idx = state.orders.findIndex(o => o.id === orderId || o.orderNo === orderId);
      if (idx >= 0) state.orders[idx] = order;
      store.setState({ orders: state.orders });
    } catch (err) {
      // Fallback to local
      const order = store.getState().orders.find(item => item.id === options.id || item.orderNo === options.id) || null;
      this.setData({ order }, () => this.checkCanConfirm());
    }
  },

  checkCanConfirm() {
    const { order, currentMinute } = this.data;
    if (!order || order.orderType !== 'RESERVATION') {
      this.setData({ canConfirmArrival: false });
      return;
    }
    if (order.useStatus !== 'RESERVED') {
      this.setData({ canConfirmArrival: false });
      return;
    }
    const first = (order.items || [])[0];
    if (!first || !first.startTime) {
      this.setData({ canConfirmArrival: false });
      return;
    }
    const timeMatch = String(first.startTime).match(/^(\d{1,2}):(\d{2})/);
    if (!timeMatch) {
      this.setData({ canConfirmArrival: false });
      return;
    }
    const startMinute = Number(timeMatch[1]) * 60 + Number(timeMatch[2]);
    this.setData({ canConfirmArrival: currentMinute >= startMinute });
  },

  async confirmArrival() {
    const { order } = this.data;
    try {
      await api.app.confirmArrival(order.orderId || order.id);
      wx.showToast({ title: '已确认到场，场地使用中', icon: 'success' });
      this.loadOrder(order.orderId || order.id);
    } catch (err) {
      wx.showToast({ title: err.message || '确认失败', icon: 'none' });
    }
  },

  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
      return;
    }
    wx.switchTab({ url: '/pages/orders/orders' });
  },

  goMap() {
    wx.showToast({ title: '已模拟打开导航', icon: 'none' });
  },

  goOpen() {
    wx.switchTab({ url: '/pages/open/open' });
  }
});
