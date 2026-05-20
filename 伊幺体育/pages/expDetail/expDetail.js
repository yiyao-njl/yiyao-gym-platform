const store = require('../../utils/store.js');

Page({
  data: {
    user: {},
    groups: []
  },

  onShow() {
    if (!store.requireLogin('登录后可查看经验值明细')) return;
    const state = store.getState();
    const records = store.getExpRecords();
    const groupMap = {};
    records.forEach(item => {
      const month = item.month || String(item.time || '').slice(0, 7) || '其他';
      if (!groupMap[month]) groupMap[month] = [];
      groupMap[month].push(item);
    });
    const groups = Object.keys(groupMap).sort((a, b) => b.localeCompare(a)).map(month => ({
      month,
      records: groupMap[month]
    }));
    this.setData({ user: state.user, groups });
  },

  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
      return;
    }
    wx.switchTab({ url: '/pages/mine/mine' });
  }
});
