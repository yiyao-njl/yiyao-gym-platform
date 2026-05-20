const mock = require('./mockData.js');

const KEY = 'gym-front-state';

const defaults = {
  loggedIn: false,
  user: mock.user,
  accounts: [],
  currentAccountId: '',
  agreementAccepted: false,
  currentCity: '',
  currentStoreId: '',
  hasSelectedStore: false,
  currentLocation: null,
  openEntrySource: '',
  needResolveLocation: false,
  openMode: 'walkIn',
  cart: [],
  orders: [],
  venueOccupations: [],
  auth: null
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadState() {
  const saved = wx.getStorageSync(KEY);
  const state = Object.assign({}, clone(defaults), saved || {});
  migrateAccounts(state);
  if (!state.hasSelectedStore) {
    state.currentStoreId = '';
  }
  state.user = Object.assign({}, clone(mock.user), state.user || {}, getCurrentAccountUser(state));
  state.expRecords = state.expRecords || clone(mock.expRecords);
  state.venueOccupations = Array.isArray(state.venueOccupations) ? state.venueOccupations : [];
  state.orders = Array.isArray(state.orders) ? state.orders : [];
  syncOrderTimeStatus(state);
  return state;
}

function saveState(next) {
  wx.setStorageSync(KEY, next);
  return next;
}

function getState() {
  return loadState();
}

function setState(patch) {
  return saveState(Object.assign({}, loadState(), patch));
}

function migrateAccounts(state) {
  state.accounts = Array.isArray(state.accounts) ? state.accounts : [];
  if (state.loggedIn && !state.accounts.length) {
    const user = Object.assign({}, clone(mock.user), state.user || {});
    const phone = normalizePhone(user.phone) || '13800002026';
    const account = buildAccount({
      id: `acct-${Date.now()}`,
      phone,
      user,
      loginType: state.auth && state.auth.loginType ? state.auth.loginType : 'legacy'
    });
    state.accounts = [account];
    state.currentAccountId = account.id;
  }
  if (state.currentAccountId && !state.accounts.some(item => item.id === state.currentAccountId)) {
    state.currentAccountId = '';
  }
}

function getCurrentAccountUser(state) {
  const account = getCurrentAccount(state);
  return account ? account.user : null;
}

function getCurrentAccount(stateValue) {
  const state = stateValue || loadState();
  if (!state.currentAccountId) return null;
  return (state.accounts || []).find(item => item.id === state.currentAccountId) || null;
}

function buildAccount(payload) {
  const user = Object.assign({}, clone(mock.user), payload.user || {});
  const phone = normalizePhone(payload.phone || user.phone) || '13800002026';
  const maskedPhone = maskPhone(phone);
  user.phone = maskedPhone;
  return {
    id: payload.id || `acct-${Date.now()}`,
    phone,
    maskedPhone,
    loginType: payload.loginType || 'wechat',
    createdAt: payload.createdAt || formatFullDate(new Date()),
    updatedAt: formatFullDate(new Date()),
    user
  };
}

function upsertAccount(state, payload) {
  const phone = normalizePhone(payload.phone) || mockPhoneFromCode(payload.phoneCode || payload.loginCode || Date.now());
  const current = (state.accounts || []).find(item => item.phone === phone);
  const baseUser = current ? current.user : state.user;
  const user = Object.assign({}, clone(mock.user), baseUser || {}, payload.user || {}, {
    phone: maskPhone(phone)
  });
  const account = buildAccount({
    id: current ? current.id : `acct-${Date.now()}`,
    phone,
    user,
    loginType: payload.loginType,
    createdAt: current && current.createdAt
  });
  state.accounts = (state.accounts || []).filter(item => item.id !== account.id);
  state.accounts.unshift(account);
  state.currentAccountId = account.id;
  state.user = account.user;
  state.loggedIn = true;
  return account;
}

function login() {
  return loginWithWechat();
}

function loginWithWechat() {
  return getWechatProfile()
    .then(profile => wxLogin().then(loginRes => {
      const now = formatFullDate(new Date());
      const userInfo = profile.userInfo || {};
      const user = Object.assign({}, mock.user, loadState().user || {}, {
        avatar: userInfo.avatarUrl || (loadState().user || {}).avatar || mock.user.avatar,
        nickname: userInfo.nickName || (loadState().user || {}).nickname || mock.user.nickname,
        gender: formatGender(userInfo.gender) || (loadState().user || {}).gender || mock.user.gender
      });
      return setState({
        loggedIn: true,
        user,
        auth: {
          provider: 'wechat',
          loginCode: loginRes.code,
          loginAt: now,
          encryptedData: profile.encryptedData || '',
          iv: profile.iv || '',
          signature: profile.signature || '',
          rawData: profile.rawData || ''
        }
      });
    }));
}

function completeWechatLogin(profile) {
  const state = loadState();
  const now = formatFullDate(new Date());
  const nickname = String(profile.nickname || '').trim();
  const phone = normalizePhone(profile.phoneNumber) || mockPhoneFromCode(profile.phoneCode || profile.loginCode || now);
  const account = upsertAccount(state, {
    phone,
    phoneCode: profile.phoneCode || '',
    loginCode: profile.loginCode || '',
    loginType: 'wechat',
    user: {
      avatar: profile.avatar || (state.user || {}).avatar || mock.user.avatar,
      nickname: nickname || (state.user || {}).nickname || mock.user.nickname
    }
  });
  return saveState(Object.assign({}, state, {
    auth: {
      provider: 'wechat',
      loginType: 'wechat',
      loginCode: profile.loginCode || '',
      phoneCode: profile.phoneCode || '',
      scene: profile.scene || 'login',
      clientType: 'WECHAT_MINI_APP',
      loginAt: now,
      accessToken: profile.accessToken || '',
      refreshToken: profile.refreshToken || '',
      userId: profile.userId || '',
      maskedPhone: account.maskedPhone,
      phoneEncryptedData: profile.phoneEncryptedData || '',
      phoneIv: profile.phoneIv || '',
      phoneCloudId: profile.phoneCloudId || ''
    }
  }));
}

function completeSmsLogin(phone, smsCode) {
  const state = loadState();
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    return { success: false, message: '请输入正确的手机号' };
  }
  if (String(smsCode || '') !== getSmsCode()) {
    return { success: false, message: '验证码错误' };
  }
  const now = formatFullDate(new Date());
  const account = upsertAccount(state, {
    phone: normalizedPhone,
    loginType: 'sms',
    user: {
      nickname: `会员${normalizedPhone.slice(-4)}`,
      avatar: (state.user || {}).avatar || mock.user.avatar
    }
  });
  saveState(Object.assign({}, state, {
    auth: {
      provider: 'sms',
      loginType: 'sms',
      scene: 'phone-login',
      clientType: 'WECHAT_MINI_APP',
      loginAt: now,
      maskedPhone: account.maskedPhone,
      accessToken: '',
      refreshToken: ''
    }
  }));
  return { success: true, account };
}

function switchAccountByWechat(profile) {
  return completeWechatLogin(Object.assign({}, profile || {}, { scene: 'switch-account' }));
}

function logout() {
  return logoutAndReset();
}

function logoutAndReset() {
  return setState({ loggedIn: false, currentAccountId: '', user: clone(mock.user), cart: [], auth: null });
}

function updateUser(patch) {
  const state = loadState();
  const user = Object.assign({}, state.user || mock.user, patch || {});
  if (state.currentAccountId) {
    state.accounts = (state.accounts || []).map(account => account.id === state.currentAccountId
      ? Object.assign({}, account, { user: Object.assign({}, account.user || {}, user), updatedAt: formatFullDate(new Date()) })
      : account);
  }
  state.user = user;
  return saveState(state);
}

function getExpRecords() {
  const state = loadState();
  return state.expRecords || mock.expRecords;
}

function addExpRecord(record) {
  const state = loadState();
  const current = state.expRecords || mock.expRecords;
  const expValue = Number(record.value || 0);
  const user = Object.assign({}, state.user || mock.user, {
    exp: Math.max(0, Number((state.user || mock.user).exp || 0) + expValue)
  });
  const nextRecord = Object.assign({
    id: `exp-${Date.now()}`,
    month: formatMonth(new Date()),
    time: formatFullDate(new Date()),
    type: 'order'
  }, record);
  return setState({
    user,
    expRecords: [nextRecord].concat(current)
  });
}

function requireLogin(message) {
  const state = loadState();
  if (state.loggedIn) return true;
  wx.showModal({
    title: '需要登录',
    content: message || '登录后可继续使用该功能',
    confirmText: '去登录',
    success(res) {
      if (res.confirm) wx.navigateTo({ url: '/pages/phoneLogin/phoneLogin' });
    }
  });
  return false;
}

function acceptAgreement() {
  return setState({ agreementAccepted: true });
}

function getSmsCode() {
  return '123456';
}

function wxLogin() {
  return new Promise((resolve, reject) => {
    wx.login({
      success(res) {
        if (res.code) {
          resolve(res);
          return;
        }
        reject(new Error(res.errMsg || '微信登录失败'));
      },
      fail: reject
    });
  });
}

function getWechatProfile() {
  return new Promise((resolve, reject) => {
    if (wx.getUserProfile) {
      wx.getUserProfile({
        desc: '用于完善会员资料和订单服务',
        lang: 'zh_CN',
        success: resolve,
        fail: reject
      });
      return;
    }
    wx.getUserInfo({
      lang: 'zh_CN',
      success: resolve,
      fail: reject
    });
  });
}

function formatGender(value) {
  if (Number(value) === 1) return '男';
  if (Number(value) === 2) return '女';
  return '';
}

function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 11 && digits[0] === '1') return digits;
  return '';
}

function maskPhone(value) {
  const phone = normalizePhone(value);
  if (!phone) return '微信手机号已授权';
  return `${phone.slice(0, 3)}****${phone.slice(7)}`;
}

function mockPhoneFromCode(value) {
  const source = String(value || '2026');
  let hash = 0;
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash * 31 + source.charCodeAt(i)) % 100000000;
  }
  return `13${String(hash).padStart(9, '0').slice(0, 9)}`;
}

function setOpenMode(mode) {
  return setState({ openMode: mode || 'walkIn' });
}

function setStore(storeId, city) {
  return setState({ currentStoreId: storeId, currentCity: city || loadState().currentCity, hasSelectedStore: !!storeId });
}

function getCurrentStore() {
  const state = loadState();
  if (!state.hasSelectedStore || !state.currentStoreId) return null;
  return mock.stores.find(item => item.id === state.currentStoreId) || null;
}

function addCart(item) {
  const state = loadState();
  const cartItem = Object.assign({}, item, {
    id: `cart-${Date.now()}`,
    quantity: Math.max(1, Number(item.quantity || 1)),
    checked: true
  });
  state.cart = state.cart.filter(value => !(value.storeId === cartItem.storeId && value.venueId === cartItem.venueId));
  state.cart.unshift(cartItem);
  saveState(state);
  return cartItem;
}

function getCartByStore(storeId) {
  const state = loadState();
  if (!storeId) return [];
  return state.cart.filter(item => item.storeId === storeId);
}

function updateCart(cart) {
  return setState({ cart });
}

function clearCheckedCart() {
  const state = loadState();
  state.cart = state.cart.filter(item => !item.checked);
  return saveState(state);
}

function removeCartItems(ids) {
  const state = loadState();
  state.cart = state.cart.filter(item => ids.indexOf(item.id) === -1);
  return saveState(state);
}

function createOrder(items, mode, total, extra) {
  const state = loadState();
  const normalizedItems = (items || []).map(item => Object.assign({}, item, {
    orderOccupyType: mode === 'reservation' ? 'booked' : 'using'
  }));
  const order = Object.assign({
    id: `order-${Date.now()}`,
    orderNo: `YY${Date.now()}`,
    type: mode === 'reservation' ? '预约订单' : '开场订单',
    items: normalizedItems,
    total,
    status: '待支付',
    payStatus: '未支付',
    useStatus: '未使用',
    createdAt: formatDate(new Date())
  }, extra || {});
  state.orders.unshift(order);
  saveState(state);
  return order;
}

function payOrder(orderId) {
  const state = loadState();
  let paidOrder = null;
  state.orders = state.orders.map(order => {
    if (order.id !== orderId) return order;
    const nextOrder = Object.assign({}, order, {
      status: '已支付',
      payStatus: '已支付',
      useStatus: getOrderRuntimeUseStatus(order, new Date())
    });
    paidOrder = nextOrder;
    return nextOrder;
  });
  if (paidOrder) {
    upsertOrderOccupations(state, paidOrder);
    syncOrderTimeStatus(state);
  }
  if (paidOrder) {
    const expValue = Math.max(1, Math.round(Number(paidOrder.total || 0) / 10));
    const user = Object.assign({}, state.user || mock.user, {
      exp: Math.min(Number((state.user || mock.user).nextExp || 50), Number((state.user || mock.user).exp || 0) + expValue)
    });
    const records = state.expRecords || mock.expRecords;
    state.user = user;
    state.expRecords = [{
      id: `exp-${Date.now()}`,
      month: formatMonth(new Date()),
      title: '订单消费',
      desc: `订单号：${paidOrder.orderNo}`,
      time: formatFullDate(new Date()),
      value: expValue,
      currentExp: user.exp,
      type: 'order'
    }].concat(records);
  }
  saveState(state);
}

function updateOrder(orderId, patch) {
  const state = loadState();
  state.orders = state.orders.map(order => order.id === orderId ? Object.assign({}, order, patch) : order);
  if (patch && (patch.status === '已取消' || patch.useStatus === '已取消' || patch.status === '退款中' || patch.useStatus === '退款中')) {
    state.venueOccupations = (state.venueOccupations || []).filter(item => item.orderId !== orderId);
  }
  return saveState(state);
}

function getVenueForDate(venueId, dateValue) {
  const venue = mock.venues.find(item => item.id === venueId);
  if (!venue) return null;
  const state = loadState();
  return mergeVenueOccupations(venue, state.venueOccupations, dateValue);
}

function getVenuesForDate(dateValue) {
  const state = loadState();
  return mock.venues.map(venue => mergeVenueOccupations(venue, state.venueOccupations, dateValue));
}

function mergeVenueOccupations(venue, occupations, dateValue) {
  const matched = (occupations || [])
    .filter(item => item.venueId === venue.id && (!dateValue || item.dateValue === dateValue))
    .map(item => ({
      start: Number(item.start),
      end: Number(item.end),
      type: getOccupationRuntimeType(item, new Date())
    }));
  return Object.assign({}, venue, {
    timeRanges: (venue.timeRanges || []).concat(matched)
  });
}

function upsertOrderOccupations(state, order) {
  const activeItems = (order.items || []).filter(item => Number.isFinite(Number(item.startMinute)) && Number(item.endMinute) > Number(item.startMinute));
  state.venueOccupations = (state.venueOccupations || []).filter(item => item.orderId !== order.id);
  state.venueOccupations = state.venueOccupations.concat(activeItems.map(item => ({
    id: `occ-${order.id}-${item.id || item.venueId}`,
    orderId: order.id,
    orderNo: order.orderNo,
    venueId: item.venueId,
    storeId: item.storeId,
    dateValue: item.dateValue || (item.date === '今天' ? todayValue() : item.date),
    start: Number(item.startMinute),
    end: Number(item.endMinute),
    type: order.type === '开场订单' ? 'using' : 'booked'
  })));
}

function syncOrderTimeStatus(state) {
  const now = new Date();
  state.orders = (state.orders || []).map(order => {
    if (order.status !== '已支付' || ['已取消', '退款中', '已完成'].indexOf(order.useStatus) > -1) return order;
    return Object.assign({}, order, { useStatus: getOrderRuntimeUseStatus(order, now) });
  });
  state.venueOccupations = (state.venueOccupations || []).map(item => Object.assign({}, item, {
    type: getOccupationRuntimeType(item, now)
  }));
}

function getOrderRuntimeUseStatus(order, now) {
  if (order.type !== '预约订单') return '使用中';
  const startDate = getOrderStartDate(order);
  return startDate && startDate.getTime() <= (now || new Date()).getTime() ? '使用中' : '已预约';
}

function getOccupationRuntimeType(item, now) {
  if (item.type === 'using') return 'using';
  const startDate = getDateTime(item.dateValue, Number(item.start));
  return startDate && startDate.getTime() <= (now || new Date()).getTime() ? 'using' : 'booked';
}

function getOrderStartDate(order) {
  const first = order.items && order.items[0];
  if (!first) return null;
  return getDateTime(first.dateValue || (first.date === '今天' ? todayValue() : first.date), Number(first.startMinute));
}

function getDateTime(dateValue, minute) {
  if (!dateValue || !Number.isFinite(minute)) return null;
  const parts = String(dateValue).split('-').map(value => Number(value));
  if (parts.length < 3 || parts.some(value => !Number.isFinite(value))) return null;
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  date.setHours(Math.floor(minute / 60), minute % 60, 0, 0);
  if (minute >= 24 * 60) date.setDate(date.getDate() + 1);
  return date;
}

function todayValue(now) {
  const date = now || new Date();
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function formatDate(date) {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = `${date.getMinutes()}`.padStart(2, '0');
  return `${month}.${day} ${hour}:${minute}`;
}

function formatMonth(date) {
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}`;
}

function formatFullDate(date) {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = `${date.getMinutes()}`.padStart(2, '0');
  const second = `${date.getSeconds()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day} ${hour}:${minute}:${second}`;
}

module.exports = {
  getState,
  setState,
  login,
  loginWithWechat,
  completeWechatLogin,
  completeSmsLogin,
  switchAccountByWechat,
  logout,
  logoutAndReset,
  updateUser,
  acceptAgreement,
  getCurrentAccount,
  maskPhone,
  getSmsCode,
  getExpRecords,
  addExpRecord,
  requireLogin,
  setOpenMode,
  setStore,
  getCurrentStore,
  getCartByStore,
  getVenueForDate,
  getVenuesForDate,
  addCart,
  updateCart,
  clearCheckedCart,
  removeCartItems,
  createOrder,
  payOrder,
  updateOrder
};
