const store = require('../../utils/store.js');
const api = require('../../utils/api.js');

Page({
  data: {
    active: '预约订单',
    orders: [],
    visibleOrders: [],
    displayOrders: [],
    emptyText: '您还没有预约订单',
    loading: false
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
    wx.stopPullDownRefresh();
  },

  async loadOrders() {
    this.setData({ loading: true });
    try {
      const res = await api.app.orders();
      const orders = (res && res.records) || (res && res.data && res.data.records) || [];
      const visibleOrders = orders.filter(item => {
        const itemType = item.type || (item.orderType === 'WALK_IN' ? '开场订单' : '预约订单');
        return itemType === this.data.active;
      });
      // Also cache locally
      const state = store.getState();
      state.orders = orders;
      store.setState({ orders });
      
      this.setData({
        orders,
        visibleOrders,
        displayOrders: visibleOrders.map(item => this.formatOrder(item)),
        emptyText: this.data.active === '预约订单' ? '您还没有预约订单' : '您还没有开场订单',
        loading: false
      });
    } catch (error) {
      // Fallback to local storage
      const orders = store.getState().orders || [];
      const visibleOrders = orders.filter(item => {
        const itemType = item.type || (item.orderType === 'WALK_IN' ? '开场订单' : '预约订单');
        return itemType === this.data.active;
      });
      this.setData({
        orders,
        visibleOrders,
        displayOrders: visibleOrders.map(item => this.formatOrder(item)),
        emptyText: this.data.active === '预约订单' ? '您还没有预约订单' : '您还没有开场订单',
        loading: false
      });
    }
  },

  formatOrder(order) {
    const items = order.items || [];
    const first = items[0] || {};
    const summaryParts = [
      first.venueName,
      first.store || first.storeName,
      first.bizDate && first.startTime && first.endTime ? `${first.bizDate} ${first.startTime}-${first.endTime}` : ''
    ].filter(Boolean);
    return Object.assign({}, order, {
      storeName: first.store || first.storeName || '伊幺体育门店',
      createdAtText: order.createdAt || '',
      summary: summaryParts.join(' · '),
      countText: `共${items.length || 1}场`,
      badgeText: order.type === '预约订单' ? '预约' : '开场',
      statusClass: order.orderStatus === '已支付' ? 'paid' : order.orderStatus === '退款中' ? 'refund' : order.orderStatus === '已取消' ? 'cancelled' : 'pending'
    });
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

  async cancelOrder(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '取消订单',
      content: '确认取消该订单吗？',
      success: async res => {
        if (!res.confirm) return;
        try {
          await api.app.cancelOrder(id);
          wx.showToast({ title: '已取消', icon: 'success' });
        } catch (err) {
          wx.showToast({ title: err.message || '取消失败', icon: 'none' });
        }
        this.loadOrders();
      }
    });
  },

  async refund(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '申请退款',
      content: '确认提交退款申请吗？',
      success: async res => {
        if (!res.confirm) return;
        try {
          await api.app.refundOrder(id);
          wx.showToast({ title: '已提交退款', icon: 'success' });
        } catch (err) {
          wx.showToast({ title: err.message || '退款失败', icon: 'none' });
        }
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
