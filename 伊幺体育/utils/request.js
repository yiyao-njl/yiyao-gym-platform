const DEFAULT_BASE_URL = 'http://localhost';

function getBaseUrl() {
  const configured = wx.getStorageSync('gym-api-base-url');
  return configured || DEFAULT_BASE_URL;
}

function getToken() {
  const state = wx.getStorageSync('gym-front-state') || {};
  return state.auth && state.auth.accessToken ? state.auth.accessToken : '';
}

function request(options) {
  const method = options.method || 'GET';
  const header = Object.assign({
    'Content-Type': 'application/json',
    'X-Client-Type': 'wechat-mini'
  }, options.header || {});
  const token = getToken();
  if (token) header.Authorization = `Bearer ${token}`;
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${getBaseUrl()}${options.url}`,
      method,
      data: options.data || {},
      header,
      success(res) {
        const payload = res.data || {};
        if (res.statusCode === 401) {
          reject(new Error('登录已过期，请重新登录'));
          return;
        }
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(payload.message || payload.error || `请求失败(${res.statusCode})`));
          return;
        }
        if (payload.code && payload.code !== 'SUCCESS') {
          reject(new Error(payload.message || '请求失败'));
          return;
        }
        resolve(payload.data !== undefined ? payload.data : payload);
      },
      fail(error) {
        reject(error);
      }
    });
  });
}

module.exports = {
  getBaseUrl,
  request,
  setBaseUrl(url) {
    wx.setStorageSync('gym-api-base-url', url || DEFAULT_BASE_URL);
  }
};
