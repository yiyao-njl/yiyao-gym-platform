// app.js
App({
  onLaunch() {
    // 初始化云开发环境
    if (!wx.cloud) {
      console.error('当前微信版本不支持云开发');
    } else {
      wx.cloud.init({
        env: 'cloud1-6g1zde6bb1996733',
        traceUser: true
      });
    }
  },

})
