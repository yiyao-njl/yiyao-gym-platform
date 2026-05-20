const mock = require('../../utils/mockData.js');
const store = require('../../utils/store.js');
const mapDistance = require('../../utils/mapDistance.js');
const { getCartPricing, validateCartItems } = require('../../utils/cartValidation.js');
const {
  buildSlotRange,
  buildTimelineSlots,
  formatClockTime,
  getNextReservationDateValue,
  getVenueAvailability,
  isStoreOpenNow
} = require('../../utils/timeSlots.js');

Page({
  data: {
    currentMinute: 0,
    mode: 'walkIn',
    modeText: '到店开场',
    keyword: '',
    store: null,
    sportTabs: [
      { key: 'all', label: '全部' },
      { key: 'basketball', label: '篮球' },
      { key: 'badminton', label: '羽毛球' },
      { key: 'airvolley', label: '气排球' },
      { key: 'pingpong', label: '乒乓球' },
      { key: 'pickleball', label: '匹克球' }
    ],
    activeSport: 'all',
    dates: [],
    activeDate: '',
    venues: [],
    displayVenues: [],
    cartCount: 0,
    cartItems: [],
    cartPricing: { subtotal: 0, originTotal: 0, discount: 0, total: 0 },
    cartPanel: '',
    shopToolsStyle: '',
    fallbackImage: '/images/伊幺体育.jpg',
    cartIcon: '/images/icons/open-cart-bag.png',
    deleteIcon: '/images/icons/cart-trash-simple.png',
    slotHours: [],
    slotStartHour: 0,
    slotMaxEndHour: 0,
    promoImages: [
      { image: '/images/伊幺体育.jpg', title: '门店环境' },
      { image: '/images/伊幺体育.jpg', title: '夏日推荐' },
      { image: '/images/伊幺体育.jpg', title: '用券下单' }
    ],
    headerHeightPx: 0,
    promoHeightPx: 0,
    promoVisibleHeightPx: 0,
    promoProgress: 1,
    filterTopPx: 0,
    filterHeightPx: 0,
    contentOffsetStyle: '',
    promoStyle: '',
    filterStyle: '',
    closedWalkInNoticeShown: false,
    pendingLoginAction: '',
    pendingVenueId: ''
  },

  onLoad() {
    this.setShopToolsStyle();
    this.initOpenChromeMetrics();
  },

  onHide() {
    if (this._timeTimer) {
      clearInterval(this._timeTimer);
      this._timeTimer = null;
    }
  },

  startTimePolling() {
    this.updateCurrentMinute();
    if (this._timeTimer) clearInterval(this._timeTimer);
    this._timeTimer = setInterval(() => this.updateCurrentMinute(), 30000);
  },

  updateCurrentMinute() {
    const now = new Date();
    const currentMinute = now.getHours() * 60 + now.getMinutes();
    const oldMinute = this.data.currentMinute || 0;
    this.setData({ currentMinute });
    if (oldMinute !== currentMinute && this.data.mode === 'walkIn') {
      this.checkExpiredSlots(currentMinute);
    }
  },

  checkExpiredSlots(currentMinute) {
    const venues = this.data.venues || [];
    let hasExpired = false;
    venues.forEach(venue => {
      (venue.slotItems || []).forEach(slot => {
        if (slot.startMinute < currentMinute && slot.status !== 'expired') {
          slot.status = 'expired';
          hasExpired = true;
        }
      });
    });
    if (hasExpired) {
      this.setData({ venues });
      const cart = store.getState().cart || [];
      const expiredCartItems = cart.filter(item => {
        const slotStart = Number(item.startMinute);
        return slotStart < currentMinute && item.storeId === this.data.store.id;
      });
      if (expiredCartItems.length > 0) {
        const names = expiredCartItems.map(item => item.venueName).join('.');
        wx.showToast({ title: `${names} 时段已过期，请重新选择`, icon: 'none', duration: 2000 });
        store.removeCartItems(expiredCartItems.map(item => item.id));
        this.startTimePolling();
      this.loadCartBar();
      }
    }
  },

  onShow() {
    const state = store.getState();
    const currentStore = store.getCurrentStore();
    const dates = this.makeDates();
    const mode = state.openMode || 'walkIn';
    this.setData({
      mode,
      modeText: mode === 'reservation' ? '预约开场' : '到店开场',
      store: this.formatStore(currentStore),
      dates,
      activeDate: this.data.activeDate || dates[0].value,
      closedWalkInNoticeShown: mode === 'reservation'
    }, () => {
      this.loadCartBar();
      this.refreshVenues();
      if (!(state.openEntrySource === 'home' && state.needResolveLocation)) {
        this.showClosedWalkInNoticeIfNeeded(false);
      }
      this.measureOpenChrome();
    });

    if (state.openEntrySource === 'home' && state.needResolveLocation) {
      this.resolveHomeEntryLocation();
      return;
    }
    if (state.currentLocation && currentStore) {
      this.refreshCurrentStoreDistance(state.currentLocation);
    }
  },

  onPageScroll(e) {
    this.updateOpenChrome(e.scrollTop || 0);
  },

  setShopToolsStyle() {
    const fallbackStyle = 'padding-top: 48px; padding-right: 16px;';
    if (!wx.getMenuButtonBoundingClientRect) {
      this.setData({ shopToolsStyle: fallbackStyle });
      return;
    }
    try {
      const menu = wx.getMenuButtonBoundingClientRect();
      const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
      const rightReserve = Math.max(16, windowInfo.windowWidth - menu.left + 8);
      this.setData({
        shopToolsStyle: `padding-top: ${menu.top}px; min-height: ${menu.height}px; padding-right: ${rightReserve}px;`
      });
    } catch (err) {
      this.setData({ shopToolsStyle: fallbackStyle });
    }
  },

  getRpxScale() {
    try {
      const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
      return windowInfo.windowWidth / 750;
    } catch (err) {
      return 0.5;
    }
  },

  initOpenChromeMetrics() {
    const scale = this.getRpxScale();
    const headerHeightPx = Math.round(306 * scale);
    const promoHeightPx = Math.round(392 * scale);
    const filterHeightPx = Math.round(196 * scale);
    this.setData({
      headerHeightPx,
      promoHeightPx,
      promoVisibleHeightPx: promoHeightPx,
      filterTopPx: headerHeightPx + promoHeightPx,
      filterHeightPx
    }, () => this.updateOpenChrome(0));
  },

  measureOpenChrome() {
    const runMeasure = () => {
      const query = wx.createSelectorQuery();
      query.select('#fixedOpenHeader').boundingClientRect();
      query.select('.promo-scroll').boundingClientRect();
      query.select('#stickyVenueFilter').boundingClientRect();
      query.exec(res => {
        const headerRect = res && res[0];
        const promoRect = res && res[1];
        const filterRect = res && res[2];
        const headerHeightPx = headerRect && headerRect.height ? Math.round(headerRect.height) : this.data.headerHeightPx;
        const promoHeightPx = promoRect && promoRect.height ? Math.round(promoRect.height) : this.data.promoHeightPx;
        const filterHeightPx = filterRect && filterRect.height ? Math.round(filterRect.height) : this.data.filterHeightPx;
        this.setData({
          headerHeightPx,
          promoHeightPx,
          filterHeightPx
        }, () => this.updateOpenChrome(this._lastScrollTop || 0, true));
      });
    };
    if (wx.nextTick) {
      wx.nextTick(runMeasure);
      return;
    }
    setTimeout(runMeasure, 0);
  },

  updateOpenChrome(scrollTop, force) {
    const headerHeightPx = this.data.headerHeightPx || Math.round(306 * this.getRpxScale());
    const promoHeightPx = this.data.promoHeightPx || Math.round(392 * this.getRpxScale());
    const filterHeightPx = this.data.filterHeightPx || Math.round(196 * this.getRpxScale());
    const collapse = Math.min(Math.max(scrollTop, 0), promoHeightPx);
    const visibleHeight = Math.max(0, promoHeightPx - collapse);
    const progress = promoHeightPx ? visibleHeight / promoHeightPx : 0;
    const filterTop = headerHeightPx + visibleHeight;
    const contentOffset = headerHeightPx + promoHeightPx + filterHeightPx;
    const roundedTop = Math.round(scrollTop);
    if (!force && this._lastChromeTop !== undefined && Math.abs(roundedTop - this._lastChromeTop) < 2) return;
    this._lastChromeTop = roundedTop;
    this._lastScrollTop = scrollTop;
    this.setData({
      promoVisibleHeightPx: Math.round(visibleHeight),
      promoProgress: progress,
      filterTopPx: Math.round(filterTop),
      contentOffsetStyle: `height: ${Math.round(contentOffset)}px;`,
      promoStyle: [
        `top: ${Math.round(headerHeightPx)}px`,
        `height: ${Math.round(visibleHeight)}px`,
        `opacity: ${Math.max(0, Math.min(1, progress)).toFixed(2)}`,
        `transform: translateY(${-Math.round(collapse * 0.08)}px)`,
        visibleHeight < 8 ? 'pointer-events: none' : 'pointer-events: auto'
      ].join(';'),
      filterStyle: `top: ${Math.round(filterTop)}px;`
    });
  },

  onPullDownRefresh() {
    this.refreshVenues();
    wx.showToast({ title: '已同步', icon: 'success' });
    wx.stopPullDownRefresh();
  },

  makeDates() {
    const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const result = [];
    const today = new Date();
    for (let i = 0; i < 7; i += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const month = `${date.getMonth() + 1}`.padStart(2, '0');
      const day = `${date.getDate()}`.padStart(2, '0');
      result.push({
        value: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
        dateText: `${month}.${day}`,
        day: i === 0 ? '今天' : i === 1 ? '明天' : week[date.getDay()],
        week: week[date.getDay()]
      });
    }
    return result;
  },

  getTodayValue() {
    return this.data.dates[0] && this.data.dates[0].value;
  },

  isWalkInClosed() {
    return this.data.mode === 'walkIn' && this.data.store && !isStoreOpenNow(this.data.store);
  },

  getEffectiveDateValue() {
    if (this.isWalkInClosed()) {
      return getNextReservationDateValue(this.data.store);
    }
    return this.data.activeDate || this.getTodayValue();
  },

  isEffectiveDateToday() {
    return this.getEffectiveDateValue() === this.getTodayValue();
  },

  getEffectiveIsToday() {
    if (this.isWalkInClosed()) {
      return this.isEffectiveDateToday();
    }
    if (this.data.mode === 'reservation') {
      return this.isEffectiveDateToday();
    }
    return true;
  },

  showClosedWalkInNoticeIfNeeded(force) {
    if (!this.isWalkInClosed()) return Promise.resolve(true);
    const app = getApp();
    const storeId = this.data.store && this.data.store.id ? this.data.store.id : 'current';
    app.globalData = app.globalData || {};
    const noticeState = app.globalData.closedWalkInNotice || {
      acknowledged: {},
      pending: {}
    };
    app.globalData.closedWalkInNotice = noticeState;
    if (noticeState.acknowledged[storeId] || this.data.closedWalkInNoticeShown) {
      if (!this.data.closedWalkInNoticeShown) {
        this.setData({ closedWalkInNoticeShown: true });
      }
      return Promise.resolve(true);
    }
    if (!force && this.data.closedWalkInNoticeShown) return Promise.resolve(true);
    if (noticeState.pending[storeId]) return noticeState.pending[storeId];
    const dateText = this.getEffectiveDateValue() === this.getTodayValue() ? '今天营业开始后' : '下一个营业日';
    noticeState.pending[storeId] = new Promise(resolve => {
      wx.showModal({
        title: '门店休息中',
        content: `当前门店不在营业时间内，到店开场将自动转为预约开场，可预约${dateText}的可用时段。`,
        showCancel: false,
        confirmText: '我知道了',
        success: () => {
          noticeState.acknowledged[storeId] = true;
          this.setData({ closedWalkInNoticeShown: true });
          resolve(true);
        },
        fail: () => resolve(false),
        complete: () => {
          delete noticeState.pending[storeId];
        }
      });
    });
    return noticeState.pending[storeId];
  },

  makeSlotRange(isToday) {
    const currentStore = this.data.store;
    if (!currentStore) {
      return { labels: [], startHour: 0, maxEndHour: 0, hours: [] };
    }
    return buildSlotRange({ store: currentStore, isToday: isToday !== undefined ? isToday : this.getEffectiveIsToday() });
  },

  refreshVenues() {
    const { activeSport, keyword, store: currentStore } = this.data;
    const activeDateValue = this.getEffectiveDateValue();
    const isToday = this.getEffectiveIsToday();
    const slotRange = this.makeSlotRange(isToday);
    if (!currentStore) {
      this.setData({ venues: [], displayVenues: [], slotHours: [], slotStartHour: 0, slotMaxEndHour: 0 });
      return;
    }
    const words = keyword.trim();
    const venues = store.getVenuesForDate(activeDateValue).filter(item => {
      const sameStore = item.storeId === currentStore.id;
      const display = this.formatVenue(item, isToday);
      const sameSport = activeSport === 'all' || display.sportKey === activeSport;
      const match = !words || `${display.name}${display.code}${display.sport}${display.desc}`.indexOf(words) > -1;
      return sameStore && sameSport && match;
    });
    this.setData({
      venues,
      displayVenues: venues.map(item => this.formatVenue(item, isToday)),
      slotHours: slotRange.labels,
      slotStartHour: slotRange.startHour,
      slotMaxEndHour: slotRange.maxEndHour
    });
  },

  loadCartBar() {
    const currentStore = this.data.store;
    if (!currentStore || !currentStore.id) {
      this.setData({
        cartItems: [],
        cartCount: 0,
        cartPricing: { subtotal: 0, originTotal: 0, discount: 0, total: 0 },
        cartPanel: ''
      });
      return;
    }
    const storeVenueIds = mock.venues
      .filter(venue => venue.storeId === currentStore.id)
      .map(venue => venue.id);
    let scopedCart = store.getCartByStore(currentStore.id);
    const invalidScopedCart = scopedCart.filter(item => storeVenueIds.indexOf(item.venueId) === -1);
    if (invalidScopedCart.length) {
      store.removeCartItems(invalidScopedCart.map(item => item.id));
      scopedCart = store.getCartByStore(currentStore.id);
    }
    const stateCart = store.getState().cart;
    const normalizedCart = stateCart.map(item => {
      if (item.storeId !== currentStore.id || Number(item.quantity || 1) === 1) return item;
      return Object.assign({}, item, { quantity: 1 });
    });
    if (normalizedCart.some((item, index) => item !== stateCart[index])) {
      store.updateCart(normalizedCart);
      scopedCart = store.getCartByStore(currentStore.id);
    }
    const cartItems = scopedCart
      .filter(item => storeVenueIds.indexOf(item.venueId) > -1)
      .map(item => Object.assign({
        quantity: 1,
        checked: true
      }, item, {
        quantity: 1,
        checked: item.checked !== false,
        displaySub: this.formatCartItemSub(item),
        displayPrice: Number(item.price || 0).toFixed(Number(item.price || 0) % 1 === 0 ? 0 : 1)
      }));
    const checkedItems = cartItems.filter(item => item.checked);
    const cartPricing = getCartPricing(checkedItems, mock.coupons[0]);
    const cartPanel = cartItems.length ? this.data.cartPanel : '';
    const cartCount = cartItems.length;
    this.setData({
      cartItems,
      cartCount,
      cartPricing,
      cartPanel
    });
  },

  formatStore(currentStore) {
    if (!currentStore) return null;
    return Object.assign({}, currentStore, {
      name: `${currentStore.city}${currentStore.name}`,
      status: currentStore.status || '营业中',
      distance: currentStore.distance || ''
    });
  },

  formatCartItemSub(item) {
    const packageName = `${item.packageName || '单场'}`.replace(/\s+/g, '');
    const dateText = item.dateValue ? this.formatCartDate(item.dateValue) : (item.date || '');
    const timeText = item.startTime && item.endTime ? `${item.startTime}-${item.endTime}` : '';
    return [packageName, [dateText, timeText].filter(Boolean).join(' ')].filter(Boolean).join('，');
  },

  formatCartDate(value) {
    if (!value) return '';
    if (value === this.getTodayValue()) return '今天';
    const parts = `${value}`.split('-').map(part => `${Number(part) || part}`);
    if (parts.length >= 3) return `${parts[1]}月${parts[2]}日`;
    return `${value}`;
  },

  async resolveHomeEntryLocation() {
    store.setState({ needResolveLocation: false });
    try {
      const location = await mapDistance.getCurrentLocation();
      const nearest = await mapDistance.getNearestStoreByLocation(location, mock.stores);
      if (!nearest || !nearest.store) throw new Error('nearest store missing');
      store.setStore(nearest.store.id, nearest.store.city);
      store.setState({ currentLocation: location, openEntrySource: '' });
      const nextStore = this.formatStore(Object.assign({}, nearest.store, {
        distance: mapDistance.formatDistance(nearest.distance) || nearest.store.distance
      }));
      this.setData({ store: nextStore, closedWalkInNoticeShown: false }, () => {
        this.loadCartBar();
        this.refreshVenues();
        this.showClosedWalkInNoticeIfNeeded(false);
      });
    } catch (err) {
      store.setState({ openEntrySource: '' });
      wx.navigateTo({ url: '/pages/city/city?redirectStore=1' });
    }
  },

  async refreshCurrentStoreDistance(location) {
    const currentStore = store.getCurrentStore();
    if (!currentStore) return;
    const distances = await mapDistance.getDistanceMap(location, [currentStore]);
    const distanceText = mapDistance.formatDistance(distances[currentStore.id]) || currentStore.distance;
    this.setData({
      store: this.formatStore(Object.assign({}, currentStore, { distance: distanceText }))
    }, () => {
      this.loadCartBar();
      this.refreshVenues();
      this.showClosedWalkInNoticeIfNeeded(false);
    });
  },

  formatVenue(item, isTodayOverride) {
    const displayMap = {
      'venue-001': {
        name: 'A1 全场篮球馆',
        code: 'A1',
        sport: '篮球',
        sportKey: 'basketball',
        desc: '标准全场，适合团队训练、好友约赛和半场对抗。',
        tags: ['单场8.5折', '篮球', '团体'],
        memberPrice: 74.8
      },
      'venue-002': {
        name: 'B2 羽毛球场',
        code: 'B2',
        sport: '羽毛球',
        sportKey: 'badminton',
        desc: '弹性地胶场地，灯光柔和，适合双打和亲友练习。',
        tags: ['单场8.5折', '羽毛球', '双打'],
        memberPrice: 30.6
      },
      'venue-003': {
        name: 'C3 气排球场',
        code: 'C3',
        sport: '气排球',
        sportKey: 'airvolley',
        desc: '休闲团队活动优选，支持多人预约和连续时段。',
        tags: ['单场8.5折', '气排球', '团队'],
        memberPrice: 49.3
      },
      'venue-004': {
        name: 'D1 乒乓球台',
        code: 'D1',
        sport: '乒乓球',
        sportKey: 'pingpong',
        desc: '轻量开场，适合短时运动、练球和亲子活动。',
        tags: ['会员价', '乒乓球', '休闲'],
        memberPrice: 23.8
      },
      'venue-005': {
        name: 'P1 匹克球场',
        code: 'P1',
        sport: '匹克球',
        sportKey: 'pickleball',
        desc: '新兴运动体验场，入门友好，适合好友组局。',
        tags: ['新品体验', '匹克球', '好友局'],
        memberPrice: 40.8
      }
    };
    const display = displayMap[item.id] || {};
    const isToday = isTodayOverride !== undefined ? isTodayOverride : this.getEffectiveIsToday();
    const timeline = buildTimelineSlots(this.data.store, item, isToday);
    const availability = getVenueAvailability(this.data.store, item, isToday);
    const customOpenTimeEnabled = !!item.customOpenTimeEnabled;
    const specCount = (item.packages || []).length + (customOpenTimeEnabled ? 1 : 0);
    return Object.assign({}, item, display, {
      customOpenTimeEnabled,
      specCount,
      status: availability.status,
      canBook: availability.canBook,
      timelineSlots: timeline.slots,
      startOptions: availability.startOptions,
      image: item.image || '/images/伊幺体育.jpg',
      packageText: specCount > 1 ? '选规格' : '加入',
      priceText: `¥${item.price}起`,
      memberPriceText: `¥${(display.memberPrice || item.price * 0.85).toFixed(1)}起`
    });
  },

  switchMode(e) {
    const mode = e.currentTarget.dataset.mode;
    store.setOpenMode(mode);
    this.setData({
      mode,
      modeText: mode === 'reservation' ? '预约开场' : '到店开场',
      closedWalkInNoticeShown: mode === 'reservation'
    }, () => {
      this.refreshVenues();
      this.showClosedWalkInNoticeIfNeeded(false);
      this.measureOpenChrome();
    });
  },

  chooseDate(e) {
    this.setData({ activeDate: e.currentTarget.dataset.value }, this.refreshVenues);
  },

  chooseSport(e) {
    this.setData({ activeSport: e.currentTarget.dataset.sport }, this.refreshVenues);
  },

  onSearch(e) {
    this.setData({ keyword: e.detail.value }, this.refreshVenues);
  },

  goCity() {
    wx.navigateTo({ url: '/pages/store/store?needCity=1' });
  },

  goStore() {
    wx.navigateTo({ url: `/pages/store/store?city=${store.getState().currentCity || ''}` });
  },

  goCart() {
    this.showCartPanel();
  },

  goVenue(e) {
    wx.navigateTo({
      url: `/pages/venue/venue?id=${e.currentTarget.dataset.id}&mode=${this.data.mode}&date=${this.getEffectiveDateValue() || ''}`
    });
  },

  handleSpecTap(e) {
    const venue = store.getVenueForDate(e.currentTarget.dataset.id, this.getEffectiveDateValue());
    const display = this.formatVenue(venue);
    if (!display.canBook) {
      wx.showToast({ title: '可预约开场时间不足', icon: 'none' });
      return;
    }
    this.goVenue(e);
  },

  async addCart(e) {
    const venueId = e.currentTarget.dataset.id;
    if (!this.ensureLogin('addCart', venueId)) return;
    await this.addCartByVenueId(venueId);
  },

  async addCartByVenueId(venueId) {
    if (!(await this.showClosedWalkInNoticeIfNeeded(true))) return;
    const venue = store.getVenueForDate(venueId, this.getEffectiveDateValue());
    const display = this.formatVenue(venue);
    if (!display.canBook || !display.startOptions.length) {
      wx.showToast({ title: '可预约开场时间不足', icon: 'none' });
      return;
    }
    const currentStore = this.data.store;
    const pkg = venue.packages[0];
    const start = display.startOptions[0].value;
    const end = start + pkg.duration * 60;
    const now = new Date();
    const walkInMinute = Math.max(currentStore.hours.start * 60, now.getHours() * 60 + now.getMinutes());
    const mode = this.isWalkInClosed() || start !== walkInMinute ? 'reservation' : 'walkIn';
    const dateValue = mode === 'reservation' ? this.getEffectiveDateValue() : this.getTodayValue();
    const cartItem = {
      venueId: venue.id,
      storeId: currentStore.id,
      storeName: currentStore.name,
      venueName: display.name,
      sport: display.sport,
      packageName: pkg.name,
      mode,
      date: mode === 'reservation' ? dateValue : '今天',
      dateValue,
      startMinute: start,
      endMinute: end,
      packageDuration: pkg.duration,
      isCustom: false,
      startTime: formatClockTime(start),
      endTime: formatClockTime(end),
      price: pkg.price,
      originalPrice: pkg.price + 10,
      image: venue.image || this.data.fallbackImage
    };
    if (!(await this.showReservationOrderNoticeIfNeeded([cartItem]))) return;
    store.addCart(cartItem);
    this.loadCartBar();
    wx.showToast({ title: '已加入购物车', icon: 'success' });
  },

  showReservationOrderNoticeIfNeeded(items) {
    const needNotice = this.data.mode === 'walkIn' && (items || []).some(item => item.mode === 'reservation');
    if (!needNotice) return Promise.resolve(true);
    const target = (items || []).find(item => item.mode === 'reservation') || {};
    return new Promise(resolve => {
      wx.showModal({
        title: '将按预约订单处理',
        content: `当前选择的开始时间为${target.startTime || '稍后时段'}，晚于当前时间，将生成预约订单并为你保留场地。是否继续？`,
        cancelText: '再看看',
        confirmText: '继续',
        confirmColor: '#111111',
        success: res => resolve(!!res.confirm),
        fail: () => resolve(false)
      });
    });
  },

  ensureLogin(action, venueId) {
    if (store.getState().loggedIn) return true;
    this.setData({ pendingLoginAction: action || '', pendingVenueId: venueId || '' });
    const popup = this.selectComponent('#loginPopup');
    if (popup) popup.open({ scene: action || 'open' });
    return false;
  },

  onLoginSuccess() {
    const action = this.data.pendingLoginAction;
    const venueId = this.data.pendingVenueId;
    this.setData({ pendingLoginAction: '', pendingVenueId: '' });
    if (action === 'addCart' && venueId) this.addCartByVenueId(venueId);
    if (action === 'checkoutCart') this.checkoutCart();
  },

  showCartPanel() {
    if (!this.data.cartItems.length) return;
    this.setCartPanel('items');
  },

  toggleDiscountPanel() {
    if (!this.data.cartItems.length || !this.data.cartPricing.discount) return;
    this.setCartPanel(this.data.cartPanel === 'discount' ? '' : 'discount');
  },

  closeCartPanel() {
    this.setCartPanel('');
  },

  setCartPanel(panel) {
    this.setData({ cartPanel: panel });
  },

  noopTouchMove() {
    return false;
  },

  removeCartItem(e) {
    store.removeCartItems([e.currentTarget.dataset.id]);
    this.loadCartBar();
  },

  clearCartItems() {
    if (!this.data.cartItems.length) return;
    wx.showModal({
      title: '清空已选场次',
      content: '确定要清空当前门店已选购的全部场次吗？',
      cancelText: '再看看',
      confirmText: '清空',
      confirmColor: '#c63730',
      success: (res) => {
        if (!res.confirm) return;
        store.removeCartItems(this.data.cartItems.map(item => item.id));
        this.loadCartBar();
      }
    });
  },

  toggleCartItem(e) {
    const id = e.currentTarget.dataset.id;
    const nextCart = store.getState().cart.map(item => item.id === id ? Object.assign({}, item, {
      checked: item.checked === false
    }) : item);
    store.updateCart(nextCart);
    this.loadCartBar();
  },

  async checkoutCart() {
    if (!this.ensureLogin('checkoutCart')) return;
    const checkedItems = this.data.cartItems.filter(item => item.checked !== false);
    if (!checkedItems.length) {
      wx.showToast({ title: '请选择场次', icon: 'none' });
      return;
    }
    if (!(await this.showClosedWalkInNoticeIfNeeded(true))) return;
    const result = validateCartItems(checkedItems);
    if (!result.valid) {
      wx.showToast({ title: result.invalid[0].reason || '当前可预约时长不足，请重新选择时间', icon: 'none' });
      return;
    }
    if (!(await this.showReservationOrderNoticeIfNeeded(checkedItems))) return;
    wx.navigateTo({ url: `/pages/payment/payment?storeId=${this.data.store.id}` });
  },

  openLocationTip() {
    wx.showModal({
      title: '开启定位服务',
      content: '请在微信设置中允许定位，或手动选择城市和门店。',
      confirmText: '选择门店',
      success: res => {
        if (res.confirm) this.goCity();
      }
    });
  }
});
