const store = require('../../utils/store.js');

Page({
  data: {
    active: '预约订单',
    orders: [],
    visibleOrders: [],
    displayOrders: [],
    emptyText: '您还没有预约订单'
  },

  onShow() {
    const state = store.getState();
    const active = state.orderListActive === '开场订单' ? '开场订单' : state.orderListActive === '预约订单' ? '预约订单' : this.data.active;
    if (state.orderListActive) {
      store.setState({ orderListActive: '' });
      this.setData({ active }, this.loadOrders);
      return;
    }
    this.loadOrders();
  },

  onPullDownRefresh() {
    this.loadOrders();
    wx.showToast({ title: '状态已同步', icon: 'success' });
    wx.stopPullDownRefresh();
  },

  loadOrders() {
    const orders = store.getState().orders || [];
    const visibleOrders = orders.filter(item => this.getEffectiveOrderType(item) === this.data.active);
    this.setData({
      orders,
      visibleOrders,
      displayOrders: visibleOrders.map(item => this.formatOrder(item)),
      emptyText: this.data.active === '预约订单' ? '您还没有预约订单' : '您还没有开场订单'
    });
  },

  formatOrder(order) {
    const items = order.items || [];
    const first = items[0] || {};
    const effectiveType = this.getEffectiveOrderType(order);
    const summaryParts = [
      first.venueName,
      first.packageName,
      first.date && first.startTime && first.endTime ? `${first.date} ${first.startTime}-${first.endTime}` : ''
    ].filter(Boolean);
    return Object.assign({}, order, {
      storeName: first.storeName || '伊幺体育门店',
      createdAtText: order.createdAt || '',
      summary: summaryParts.join(' · '),
      countText: `共${items.reduce((sum, item) => sum + Math.max(1, Number(item.quantity || 1)), 0) || 1}场`,
      effectiveType,
      badgeText: effectiveType === '预约订单' ? '预约' : '开场',
      statusClass: order.status === '已支付' ? 'paid' : order.status === '退款中' ? 'refund' : order.status === '已取消' ? 'cancelled' : 'pending'
    });
  },

  getEffectiveOrderType(order) {
    if (!order || order.type !== '预约订单') return '开场订单';
    const startDate = this.getOrderStartDate(order);
    if (!startDate) return '预约订单';
    return startDate.getTime() <= Date.now() ? '开场订单' : '预约订单';
  },

  getOrderStartDate(order) {
    const first = order.items && order.items[0];
    if (!first || !first.date || !first.startTime) return null;
    const date = this.parseOrderDate(first.date);
    const time = this.parseOrderTime(first.startTime);
    if (!date || !time) return null;
    date.setHours(time.hour, time.minute, 0, 0);
    if (time.nextDay) date.setDate(date.getDate() + 1);
    return date;
  },

  parseOrderDate(value) {
    const text = String(value);
    const today = new Date();
    if (text === '今天') {
      return new Date(today.getFullYear(), today.getMonth(), today.getDate());
    }
    const fullMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (fullMatch) {
      return new Date(Number(fullMatch[1]), Number(fullMatch[2]) - 1, Number(fullMatch[3]));
    }
    const shortMatch = text.match(/^(\d{1,2})\.(\d{1,2})$/);
    if (shortMatch) {
      return new Date(today.getFullYear(), Number(shortMatch[1]) - 1, Number(shortMatch[2]));
    }
    return null;
  },

  parseOrderTime(value) {
    const raw = String(value);
    const nextDay = raw.indexOf('次日') === 0;
    const text = raw.replace('次日', '');
    const match = text.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    return {
      hour: Number(match[1]),
      minute: Number(match[2]),
      nextDay
    };
  },

  switchTab(e) {
    this.setData({ active: e.currentTarget.dataset.type }, this.loadOrders);
  },

  goDetail(e) {
    wx.navigateTo({ url: `/pages/orderDetail/orderDetail?id=${e.currentTarget.dataset.id}` });
  },

  payAgain(e) {
    wx.navigateTo({ url: `/pages/orderDetail/orderDetail?id=${e.currentTarget.dataset.id}` });
  },

  cancelOrder(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '取消订单',
      content: '确认取消该订单吗？',
      success: res => {
        if (!res.confirm) return;
        store.updateOrder(id, { status: '已取消', useStatus: '已取消' });
        this.loadOrders();
      }
    });
  },

  refund(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '申请退款',
      content: '确认提交退款申请吗？',
      success: res => {
        if (!res.confirm) return;
        store.updateOrder(id, { status: '退款中', useStatus: '退款中' });
        this.loadOrders();
      }
    });
  },

  again() {
    wx.switchTab({ url: '/pages/open/open' });
  },

  noop() {
    return false;
  }
});
