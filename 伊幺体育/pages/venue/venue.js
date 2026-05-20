const mock = require('../../utils/mockData.js');
const store = require('../../utils/store.js');
const { validateCartItem } = require('../../utils/cartValidation.js');
const {
  buildTimelineSlots,
  formatClockTime,
  getEndOptions,
  getNextReservationDateValue,
  getStartOptions,
  getVenueAvailability,
  isStoreOpenNow,
  isRangeAvailable
} = require('../../utils/timeSlots.js');

Page({
  refreshTimer: null,

  data: {
    venue: null,
    gym: null,
    packageOptions: [],
    activePkg: null,
    timelineSlots: [],
    timelineRows: [],
    timelineFixedWidth: false,
    startOptions: [],
    endOptions: [],
    startIndex: 0,
    endIndex: 0,
    selectedStartMinute: 0,
    selectedEndMinute: 0,
    defaultStartMinute: 0,
    defaultWalkInMinute: 0,
    startTimeText: '',
    endTimeText: '',
    pageMode: 'walkIn',
    activeDate: '',
    isToday: true,
    canBook: true,
    selectionValid: true,
    total: 0,
    venueNavStyle: '',
    closedWalkInNoticeShown: false,
    startPickerVisible: false,
    startPickerPageStyle: '',
    startPickerPageScrollTop: 0,
    pendingStartIndex: 0,
    pendingStartValue: [0],
    pendingStartScrollTop: 0,
    startPickerItemHeightPx: 0,
    startPickerScrollAnimation: false,
    pendingStartMinute: 0,
    canStepStartBackward: false,
    canStepStartForward: false,
    pendingLoginAction: ''
  },

  onLoad(options) {
    this.setVenueNavStyle();
    const baseVenue = mock.venues.find(item => item.id === options.id) || mock.venues[0];
    const gym = mock.stores.find(item => item.id === baseVenue.storeId) || store.getCurrentStore();
    const pageMode = options.mode || store.getState().openMode || 'walkIn';
    const today = new Date();
    const closedWalkIn = pageMode === 'walkIn' && !isStoreOpenNow(gym, today);
    const activeDate = options.date || (closedWalkIn ? getNextReservationDateValue(gym, today) : this.formatDateValue(today));
    const isToday = closedWalkIn ? activeDate === this.formatDateValue(today) : pageMode === 'walkIn' || activeDate === this.formatDateValue(today);
    const venue = store.getVenueForDate(baseVenue.id, activeDate) || baseVenue;
    const packageOptions = this.buildPackageOptions(venue);

    this.setData({
      venue,
      gym,
      packageOptions,
      pageMode,
      activeDate,
      isToday
    }, () => {
      this.refreshAvailability(false);
      this.showClosedWalkInNoticeIfNeeded(false);
    });
  },

  setVenueNavStyle() {
    const fallbackStyle = 'top: 48px; height: 32px;';
    if (!wx.getMenuButtonBoundingClientRect) {
      this.setData({ venueNavStyle: fallbackStyle });
      return;
    }
    try {
      const menu = wx.getMenuButtonBoundingClientRect();
      this.setData({
        venueNavStyle: `top: ${menu.top}px; height: ${menu.height}px;`
      });
    } catch (err) {
      this.setData({ venueNavStyle: fallbackStyle });
    }
  },

  onShow() {
    this.startRefreshTimer();
  },

  onHide() {
    this.clearRefreshTimer();
  },

  onUnload() {
    this.clearRefreshTimer();
    clearTimeout(this.startPickerSnapTimer);
    clearTimeout(this.startPickerAnimationTimer);
  },

  onPageScroll(e) {
    if (!this.data.startPickerVisible) {
      this.pageScrollTop = Number(e.scrollTop) || 0;
    }
  },

  onShareAppMessage() {
    const venue = this.data.venue || {};
    const title = `${venue.name || '场地详情'} - 伊幺体育`;
    const path = `/pages/venue/venue?id=${venue.id || ''}&mode=${this.data.pageMode || 'walkIn'}&date=${this.data.activeDate || ''}`;
    return {
      title,
      path,
      imageUrl: venue.image || '/images/伊幺体育.jpg'
    };
  },

  formatDateValue(date) {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  },

  isWalkInClosed() {
    return this.data.pageMode === 'walkIn' && this.data.gym && !isStoreOpenNow(this.data.gym);
  },

  showClosedWalkInNoticeIfNeeded(force) {
    if (!this.isWalkInClosed()) return Promise.resolve(true);
    const app = getApp();
    const storeId = this.data.gym && this.data.gym.id ? this.data.gym.id : 'current';
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
    noticeState.pending[storeId] = new Promise(resolve => {
      wx.showModal({
        title: '门店休息中',
        content: '当前门店不在营业时间内，本次到店开场将自动转为预约开场，请确认后继续操作。',
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

  buildPackageOptions(venue) {
    const packages = (venue.packages || []).map(item => Object.assign({}, item, {
      priceText: `¥${item.price}`,
      desc: `${item.duration} 小时`
    }));
    const basePrice = venue.price || (packages[0] && packages[0].price) || 0;
    if (!venue.customOpenTimeEnabled) return packages;
    return packages.concat({
      id: 'custom-time',
      name: '自定义开场时间',
      duration: 1,
      price: basePrice,
      priceText: '按时长计费',
      desc: '可选择开始与结束时间',
      isCustom: true
    });
  },

  chunkTimelineRows(slots) {
    const result = [];
    const visibleSlots = (slots || []).slice(0, 24);
    for (let index = 0; index < visibleSlots.length; index += 12) {
      result.push(visibleSlots.slice(index, index + 12));
    }
    return result;
  },

  startRefreshTimer() {
    this.clearRefreshTimer();
    this.refreshTimer = setInterval(() => this.refreshAvailability(true), 30000);
  },

  clearRefreshTimer() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  },

  findScheduleForPackage(pkg, startOptions, gym, venue) {
    if (!pkg || pkg.isCustom) return null;
    const durationMinutes = Math.max(60, Math.round((Number(pkg.duration) || 1) * 60));
    for (let index = 0; index < startOptions.length; index += 1) {
      const startMinute = startOptions[index].value;
      const endMinute = startMinute + durationMinutes;
      if (isRangeAvailable(gym, venue, startMinute, endMinute)) {
        return {
          startIndex: index,
          selectedStartMinute: startMinute,
          selectedEndMinute: endMinute,
          endIndex: 0,
          endOptions: []
        };
      }
    }
    return null;
  },

  findDefaultPackage(packageOptions, startOptions, gym, venue) {
    return packageOptions.find(item => !item.isCustom && this.findScheduleForPackage(item, startOptions, gym, venue));
  },

  getCustomSchedule(startMinute) {
    const selectedStartMinute = startMinute || (this.data.startOptions[0] && this.data.startOptions[0].value) || 0;
    const startIndex = Math.max(0, this.data.startOptions.findIndex(item => item.value === selectedStartMinute));
    const endOptions = selectedStartMinute ? getEndOptions(this.data.gym, this.data.venue, selectedStartMinute) : [];
    const selectedEndMinute = endOptions[0] ? endOptions[0].value : 0;
    return {
      startIndex,
      endIndex: 0,
      endOptions,
      selectedStartMinute,
      selectedEndMinute
    };
  },

  refreshAvailability(showExpiredTip) {
    const { gym, packageOptions, activePkg, selectedStartMinute, selectedEndMinute, isToday, activeDate } = this.data;
    const venue = this.data.venue && store.getVenueForDate(this.data.venue.id, activeDate) || this.data.venue;
    if (!venue || !gym) return;
    const now = new Date();
    const timeline = buildTimelineSlots(gym, venue, isToday, now);
    const availability = getVenueAvailability(gym, venue, isToday, now);
    const startOptions = getStartOptions(gym, venue, isToday, now);
    const defaultWalkInMinute = Math.max(gym.hours.start * 60, now.getHours() * 60 + now.getMinutes());
    let nextPkg = activePkg || this.findDefaultPackage(packageOptions, startOptions, gym, venue) || packageOptions[0] || null;
    let schedule = null;

    this.setData({
      timelineSlots: timeline.slots,
      timelineRows: this.chunkTimelineRows(timeline.slots),
      timelineFixedWidth: timeline.slots.length > 12,
      startOptions,
      defaultStartMinute: startOptions[0] ? startOptions[0].value : 0,
      defaultWalkInMinute,
      canBook: availability.canBook,
      venue: Object.assign({}, venue, { status: availability.status })
    }, () => {
      if (nextPkg && nextPkg.isCustom) {
        const stillValid = selectedStartMinute && selectedEndMinute
          && getEndOptions(gym, venue, selectedStartMinute).some(item => item.value === selectedEndMinute)
          && this.isFutureStart(selectedStartMinute);
        schedule = stillValid ? {
          startIndex: Math.max(0, startOptions.findIndex(item => item.value === selectedStartMinute)),
          endIndex: Math.max(0, getEndOptions(gym, venue, selectedStartMinute).findIndex(item => item.value === selectedEndMinute)),
          endOptions: getEndOptions(gym, venue, selectedStartMinute),
          selectedStartMinute,
          selectedEndMinute
        } : this.getCustomSchedule(startOptions[0] && startOptions[0].value);
      } else if (nextPkg) {
        schedule = this.findScheduleForPackage(nextPkg, startOptions, gym, venue);
      }

      if (!schedule) {
        this.setData({ selectionValid: false, activePkg: nextPkg, endOptions: [], selectedStartMinute: 0, selectedEndMinute: 0, startTimeText: '', endTimeText: '' }, this.updateTotal);
        if (showExpiredTip) wx.showToast({ title: '当前可预约时长不足，请重新选择时间', icon: 'none' });
        return;
      }

      this.setData({
        selectionValid: true,
        activePkg: nextPkg,
        startIndex: schedule.startIndex,
        endIndex: schedule.endIndex,
        endOptions: schedule.endOptions,
        selectedStartMinute: schedule.selectedStartMinute,
        selectedEndMinute: schedule.selectedEndMinute,
        startTimeText: formatClockTime(schedule.selectedStartMinute),
        endTimeText: formatClockTime(schedule.selectedEndMinute)
      }, () => {
        this.updateTotal();
        if (showExpiredTip && selectedStartMinute && selectedStartMinute !== schedule.selectedStartMinute) {
          wx.showToast({ title: '开始时间已更新为最新可用时段', icon: 'none' });
        }
      });
    });
  },

  isFutureStart(startMinute) {
    if (!this.data.isToday) return true;
    const now = new Date();
    return startMinute >= now.getHours() * 60 + now.getMinutes();
  },

  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
      return;
    }
    wx.switchTab({ url: '/pages/open/open' });
  },

  choosePkg(e) {
    if (!this.data.canBook) {
      wx.showToast({ title: '可预约开场时间不足', icon: 'none' });
      return;
    }
    const activePkg = this.data.packageOptions.find(item => item.id === e.currentTarget.dataset.id);
    if (!activePkg) return;
    if (activePkg.isCustom) {
      const schedule = this.getCustomSchedule(this.data.startOptions[0] && this.data.startOptions[0].value);
      this.setData({ activePkg }, () => this.applySchedule(schedule));
      return;
    }
    const schedule = this.findScheduleForPackage(activePkg, this.data.startOptions, this.data.gym, this.data.venue);
    if (!schedule) {
      wx.showToast({ title: '当前套餐可用时段不足', icon: 'none' });
      return;
    }
    this.setData({ activePkg }, () => this.applySchedule(schedule));
  },

  applySchedule(schedule) {
    this.setData({
      selectionValid: !!schedule,
      startIndex: schedule ? schedule.startIndex : 0,
      endIndex: schedule ? schedule.endIndex : 0,
      endOptions: schedule ? schedule.endOptions : [],
      selectedStartMinute: schedule ? schedule.selectedStartMinute : 0,
      selectedEndMinute: schedule ? schedule.selectedEndMinute : 0,
      startTimeText: schedule ? formatClockTime(schedule.selectedStartMinute) : '',
      endTimeText: schedule ? formatClockTime(schedule.selectedEndMinute) : ''
    }, this.updateTotal);
  },

  noopTouchMove() {
    return false;
  },

  getStartPickerItemHeightPx() {
    if (this.data.startPickerItemHeightPx) return this.data.startPickerItemHeightPx;
    const system = wx.getSystemInfoSync ? wx.getSystemInfoSync() : { windowWidth: 375 };
    return (system.windowWidth || 375) * 88 / 750;
  },

  getCurrentPageScrollTop(callback) {
    if (!wx.createSelectorQuery) {
      callback(this.pageScrollTop || 0);
      return;
    }
    wx.createSelectorQuery()
      .selectViewport()
      .scrollOffset(res => {
        callback(res && Number.isFinite(Number(res.scrollTop)) ? Number(res.scrollTop) : (this.pageScrollTop || 0));
      })
      .exec();
  },

  openStartPicker() {
    if (!this.data.canBook || !this.data.startOptions.length) {
      wx.showToast({ title: '暂无可选开始时间', icon: 'none' });
      return;
    }
    const currentIndex = Math.max(0, this.data.startOptions.findIndex(item => item.value === this.data.selectedStartMinute));
    const option = this.data.startOptions[currentIndex] || this.data.startOptions[0];
    const startPickerItemHeightPx = this.getStartPickerItemHeightPx();
    const scrollTop = currentIndex * startPickerItemHeightPx;
    clearTimeout(this.startPickerSnapTimer);
    clearTimeout(this.startPickerAnimationTimer);
    this.startPickerWheelDelta = 0;
    this.startPickerLastWheelMoveAt = 0;
    this.getCurrentPageScrollTop(pageScrollTop => {
      this.pageScrollTop = pageScrollTop;
      this.setData({
        startPickerVisible: true,
        startPickerPageScrollTop: pageScrollTop,
        startPickerPageStyle: `position: fixed; left: 0; right: 0; top: -${pageScrollTop}px; width: 100%;`,
        pendingStartIndex: currentIndex,
        pendingStartMinute: option.value,
        pendingStartScrollTop: scrollTop,
        startPickerItemHeightPx,
        startPickerScrollAnimation: false,
        canStepStartBackward: this.getStartStepTargetIndex(currentIndex, -30) >= 0,
        canStepStartForward: this.getStartStepTargetIndex(currentIndex, 30) >= 0
      }, () => {
        this.startPickerAnimationTimer = setTimeout(() => {
          this.setData({ startPickerScrollAnimation: true });
        }, 80);
      });
    });
  },

  closeStartPicker() {
    clearTimeout(this.startPickerSnapTimer);
    clearTimeout(this.startPickerAnimationTimer);
    this.startPickerWheelDelta = 0;
    const pageScrollTop = this.data.startPickerPageScrollTop || this.pageScrollTop || 0;
    this.setData({
      startPickerVisible: false,
      startPickerScrollAnimation: false,
      startPickerPageStyle: ''
    }, () => {
      wx.pageScrollTo({ scrollTop: pageScrollTop, duration: 0 });
    });
  },

  onStartPickerScroll(e) {
    const scrollTop = e.detail && Number.isFinite(Number(e.detail.scrollTop)) ? Number(e.detail.scrollTop) : 0;
    const itemHeight = this.getStartPickerItemHeightPx();
    const pendingStartIndex = Math.max(0, Math.min(Math.round(scrollTop / itemHeight), this.data.startOptions.length - 1));
    const option = this.data.startOptions[pendingStartIndex];
    if (!option) return;
    this.setPendingStartOption(pendingStartIndex, option.value, false);
    clearTimeout(this.startPickerSnapTimer);
    this.startPickerSnapTimer = setTimeout(() => {
      this.snapStartPickerToIndex(pendingStartIndex);
    }, 280);
  },

  onStartPickerWheel(e) {
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
    if (e.timeStamp && e.timeStamp === this.lastStartPickerWheelStamp) return;
    this.lastStartPickerWheelStamp = e.timeStamp;
    const detail = e.detail || {};
    const rawDelta = Number(detail.deltaY || detail.dy || e.deltaY || 0);
    if (!rawDelta || !this.data.startOptions.length) return;
    const itemHeight = this.getStartPickerItemHeightPx();
    const threshold = itemHeight * 1.8;
    this.startPickerWheelDelta = (this.startPickerWheelDelta || 0) + rawDelta;
    if (Math.abs(this.startPickerWheelDelta) < threshold) return;
    const now = Date.now();
    if (now - (this.startPickerLastWheelMoveAt || 0) < 120) return;
    const step = this.startPickerWheelDelta > 0 ? 1 : -1;
    this.startPickerLastWheelMoveAt = now;
    this.startPickerWheelDelta = 0;
    const pendingStartIndex = Math.max(0, Math.min(this.data.pendingStartIndex + step, this.data.startOptions.length - 1));
    if (pendingStartIndex === this.data.pendingStartIndex) {
      this.startPickerWheelDelta = 0;
      return;
    }
    const option = this.data.startOptions[pendingStartIndex];
    if (!option) return;
    clearTimeout(this.startPickerSnapTimer);
    this.setPendingStartOption(pendingStartIndex, option.value);
  },

  tapStartPickerItem(e) {
    const pendingStartIndex = Math.max(0, Math.min(Number(e.currentTarget.dataset.index || 0), this.data.startOptions.length - 1));
    const option = this.data.startOptions[pendingStartIndex];
    if (!option) return;
    this.setPendingStartOption(pendingStartIndex, option.value);
  },

  stepStartPicker(e) {
    const delta = Number(e.currentTarget.dataset.delta || 0);
    const pendingStartIndex = this.getStartStepTargetIndex(this.data.pendingStartIndex, delta);
    const option = pendingStartIndex >= 0 ? this.data.startOptions[pendingStartIndex] : null;
    if (!option) return;
    this.setPendingStartOption(pendingStartIndex, option.value);
  },

  setPendingStartOption(pendingStartIndex, pendingStartMinute, syncPickerValue = true) {
    const data = {
      pendingStartIndex,
      pendingStartMinute,
      canStepStartBackward: this.getStartStepTargetIndex(pendingStartIndex, -30) >= 0,
      canStepStartForward: this.getStartStepTargetIndex(pendingStartIndex, 30) >= 0
    };
    if (syncPickerValue) {
      data.pendingStartValue = [pendingStartIndex];
      data.pendingStartScrollTop = pendingStartIndex * this.getStartPickerItemHeightPx();
    }
    this.setData(data);
  },

  snapStartPickerToIndex(pendingStartIndex) {
    this.setData({
      pendingStartScrollTop: pendingStartIndex * this.getStartPickerItemHeightPx()
    });
  },

  getStartOptionSegments() {
    const options = this.data.startOptions || [];
    const segments = [];
    let start = 0;
    for (let index = 1; index <= options.length; index += 1) {
      const prev = options[index - 1];
      const current = options[index];
      if (!current || current.value - prev.value > 1) {
        segments.push({ start, end: index - 1 });
        start = index;
      }
    }
    return segments;
  },

  getStartStepTargetIndex(currentIndex, delta) {
    const options = this.data.startOptions || [];
    if (!options.length || currentIndex < 0 || currentIndex >= options.length || !delta) return -1;
    const direction = delta > 0 ? 1 : -1;
    const current = options[currentIndex];
    const targetMinute = current.value + delta;
    const segments = this.getStartOptionSegments();
    const segment = segments.find(item => currentIndex >= item.start && currentIndex <= item.end);
    if (!segment) return -1;

    const gapBoundaryIndex = this.findStartGapBoundaryIndex(segment, targetMinute, direction);
    if (gapBoundaryIndex >= 0) return gapBoundaryIndex;

    const boundaryIndex = direction > 0 ? segment.end : segment.start;
    const boundaryMinute = options[boundaryIndex].value;
    if ((direction > 0 && current.value >= boundaryMinute) || (direction < 0 && current.value <= boundaryMinute)) {
      return -1;
    }
    if ((direction > 0 && targetMinute >= boundaryMinute) || (direction < 0 && targetMinute <= boundaryMinute)) {
      return boundaryIndex;
    }
    return this.findNearestStartOptionIndex(targetMinute, segment, direction);
  },

  findStartGapBoundaryIndex(segment, targetMinute, direction) {
    const options = this.data.startOptions || [];
    if (direction > 0) {
      const nextSegmentStart = segment.end + 1;
      if (nextSegmentStart < options.length && options[segment.end].value < targetMinute) {
        return nextSegmentStart;
      }
      return -1;
    }
    const prevSegmentEnd = segment.start - 1;
    if (prevSegmentEnd >= 0 && options[segment.start].value > targetMinute) {
      return prevSegmentEnd;
    }
    return -1;
  },

  findNearestStartOptionIndex(targetMinute, segment, direction) {
    const options = this.data.startOptions || [];
    if (direction > 0) {
      for (let index = segment.start; index <= segment.end; index += 1) {
        if (options[index].value >= targetMinute) return index;
      }
      return segment.end;
    }
    for (let index = segment.end; index >= segment.start; index -= 1) {
      if (options[index].value <= targetMinute) return index;
    }
    return segment.start;
  },

  confirmStartPicker() {
    const option = this.data.startOptions[this.data.pendingStartIndex];
    if (!option || option.value !== this.data.pendingStartMinute) {
      wx.showToast({ title: '开始时间不可用，请重新选择', icon: 'none' });
      return;
    }
    if (this.changeStartByIndex(this.data.pendingStartIndex)) {
      clearTimeout(this.startPickerSnapTimer);
      clearTimeout(this.startPickerAnimationTimer);
      this.startPickerWheelDelta = 0;
      const pageScrollTop = this.data.startPickerPageScrollTop || this.pageScrollTop || 0;
      this.setData({
        startPickerVisible: false,
        startPickerScrollAnimation: false,
        startPickerPageStyle: ''
      }, () => {
        wx.pageScrollTo({ scrollTop: pageScrollTop, duration: 0 });
      });
    }
  },

  changeStartByIndex(startIndex) {
    const selectedStartMinute = this.data.startOptions[startIndex].value;
    if (!isRangeAvailable(this.data.gym, this.data.venue, selectedStartMinute, selectedStartMinute + 1)) {
      wx.showToast({ title: '开始时间已被占用，请重新选择', icon: 'none' });
      return false;
    }
    const schedule = this.getCustomSchedule(selectedStartMinute);
    if (!schedule || !schedule.selectedEndMinute) {
      wx.showToast({ title: '开始时间已被占用，请重新选择', icon: 'none' });
      return false;
    }
    this.applySchedule(Object.assign({}, schedule, { startIndex }));
    if (this.data.pageMode === 'walkIn' && this.data.activePkg && this.data.activePkg.isCustom && selectedStartMinute > this.data.defaultWalkInMinute) {
      wx.showToast({ title: '已切换为预约开场，将按所选时段为你保留场地', icon: 'none' });
    }
    return true;
  },

  changeEnd(e) {
    const endIndex = Number(e.detail.value);
    const selectedEndMinute = this.data.endOptions[endIndex].value;
    this.setData({
      endIndex,
      selectedEndMinute,
      endTimeText: formatClockTime(selectedEndMinute)
    }, this.updateTotal);
  },

  updateTotal() {
    if (!this.data.activePkg || !this.data.selectedStartMinute || !this.data.selectedEndMinute) {
      this.setData({ total: 0 });
      return;
    }
    const duration = (this.data.selectedEndMinute - this.data.selectedStartMinute) / 60;
    if (!this.data.activePkg.isCustom) {
      this.setData({ total: this.data.activePkg.price });
      return;
    }
    const unitPrice = this.data.activePkg.price / this.data.activePkg.duration;
    this.setData({ total: Math.round(unitPrice * duration) });
  },

  validateSelection(showToast) {
    if (!this.data.canBook || !this.data.selectionValid || !this.data.activePkg || !this.data.selectedStartMinute || !this.data.selectedEndMinute) {
      if (showToast !== false) wx.showToast({ title: '当前可预约时长不足，请重新选择时间', icon: 'none' });
      return false;
    }
    if (this.data.selectedEndMinute - this.data.selectedStartMinute < 60) {
      if (showToast !== false) wx.showToast({ title: '可预约开场时间不足', icon: 'none' });
      return false;
    }
    const result = validateCartItem(this.makeItem());
    if (!result.valid) {
      if (showToast !== false) wx.showToast({ title: result.reason || '当前可预约时长不足，请重新选择时间', icon: 'none' });
      return false;
    }
    return true;
  },

  makeItem() {
    const { venue, gym, activePkg, selectedStartMinute, selectedEndMinute, total, defaultWalkInMinute, pageMode, activeDate, isToday } = this.data;
    const mode = pageMode === 'walkIn' && !this.isWalkInClosed() && isToday && selectedStartMinute === defaultWalkInMinute ? 'walkIn' : 'reservation';
    const originPrice = activePkg.isCustom ? activePkg.price * ((selectedEndMinute - selectedStartMinute) / 60) : activePkg.price + 10;
    return {
      venueId: venue.id,
      storeId: gym.id,
      storeName: gym.name,
      venueName: venue.name,
      sport: venue.sport,
      packageName: activePkg.name,
      mode,
      date: mode === 'reservation' ? activeDate : '今天',
      dateValue: activeDate,
      startMinute: selectedStartMinute,
      endMinute: selectedEndMinute,
      packageDuration: activePkg.duration,
      isCustom: !!activePkg.isCustom,
      startTime: formatClockTime(selectedStartMinute),
      endTime: formatClockTime(selectedEndMinute),
      price: total,
      originalPrice: Math.max(total, Math.round(originPrice)),
      image: venue.image || '/images/伊幺体育.jpg'
    };
  },

  async addCart() {
    if (!this.ensureLogin('addCart')) return;
    await this.addCartAfterLogin();
  },

  async addCartAfterLogin() {
    if (!this.validateSelection()) return;
    if (!(await this.showClosedWalkInNoticeIfNeeded(true))) return;
    const item = this.makeItem();
    if (!(await this.showReservationOrderNoticeIfNeeded(item))) return;
    store.addCart(item);
    wx.showToast({ title: '已加入购物车', icon: 'success' });
    setTimeout(() => {
      wx.switchTab({ url: '/pages/open/open' });
    }, 300);
  },

  async buyNow() {
    if (!this.ensureLogin('buyNow')) return;
    await this.buyNowAfterLogin();
  },

  async buyNowAfterLogin() {
    if (!this.validateSelection()) return;
    if (!(await this.showClosedWalkInNoticeIfNeeded(true))) return;
    const cartItem = this.makeItem();
    if (!(await this.showReservationOrderNoticeIfNeeded(cartItem))) return;
    const item = store.addCart(cartItem);
    wx.navigateTo({ url: `/pages/payment/payment?cartId=${item.id}` });
  },

  showReservationOrderNoticeIfNeeded(item) {
    const needNotice = this.data.pageMode === 'walkIn' && item && item.mode === 'reservation';
    if (!needNotice) return Promise.resolve(true);
    return new Promise(resolve => {
      wx.showModal({
        title: '将按预约订单处理',
        content: `当前套餐开始时间为${item.startTime || '稍后时段'}，晚于当前时间，将生成预约订单并为你保留场地。是否继续？`,
        cancelText: '再看看',
        confirmText: '继续',
        confirmColor: '#111111',
        success: res => resolve(!!res.confirm),
        fail: () => resolve(false)
      });
    });
  },

  ensureLogin(action) {
    if (store.getState().loggedIn) return true;
    this.setData({ pendingLoginAction: action || '' });
    const popup = this.selectComponent('#loginPopup');
    if (popup) popup.open({ scene: action || 'venue' });
    return false;
  },

  onLoginSuccess() {
    const action = this.data.pendingLoginAction;
    this.setData({ pendingLoginAction: '' });
    if (action === 'addCart') this.addCartAfterLogin();
    if (action === 'buyNow') this.buyNowAfterLogin();
  }
});
