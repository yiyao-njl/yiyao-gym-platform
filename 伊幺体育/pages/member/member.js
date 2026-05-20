const mock = require('../../utils/mockData.js');
const store = require('../../utils/store.js');

Page({
  data: {
    tabs: [],
    active: 'upgrade',
    activeBenefit: {},
    visibleRules: []
  },

  onShow() {
    if (!store.requireLogin('登录后可查看会员权益')) return;
    this.setData({
      tabs: mock.memberBenefits,
      visibleRules: mock.levelRules
    }, this.syncActiveBenefit);
  },

  syncActiveBenefit() {
    const activeBenefit = this.data.tabs.find(item => item.id === this.data.active) || this.data.tabs[0] || {};
    const ruleMap = {
      upgrade: mock.levelRules,
      birthday: ['生日月可领取生日运动券 *1', '生日当天预约场地可获得双倍经验值', '生日权益每个自然年可领取一次'],
      exchange: ['LV.1 可兑换新人体验券', 'LV.2 可兑换项目折扣券', 'LV.3 及以上可兑换活动报名名额'],
      level: ['等级越高，可解锁更多预约提醒和活动优先权益', '经验值来自订单消费与活动参与', '会员等级到期后将根据最近周期经验值重新定级']
    };
    this.setData({
      activeBenefit,
      visibleRules: ruleMap[this.data.active] || mock.levelRules
    });
  },

  switchTab(e) {
    this.setData({ active: e.currentTarget.dataset.id }, this.syncActiveBenefit);
  },

  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
      return;
    }
    wx.switchTab({ url: '/pages/mine/mine' });
  }
});
