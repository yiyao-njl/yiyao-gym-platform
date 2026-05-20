const mock = require('./mockData.js');
const store = require('./store.js');
const { isRangeAvailable } = require('./timeSlots.js');

function todayValue(now) {
  const date = now || new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function normalizeDateValue(value) {
  if (!value) return todayValue();
  const parts = String(value).split('-');
  if (parts.length !== 3) return String(value);
  return `${parts[0]}-${String(parts[1]).padStart(2, '0')}-${String(parts[2]).padStart(2, '0')}`;
}

function nowMinute(now) {
  const date = now || new Date();
  return date.getHours() * 60 + date.getMinutes();
}

function getCartPricing(items, coupon) {
  const subtotal = (items || []).reduce((sum, item) => {
    const quantity = Math.max(1, Number(item.quantity || 1));
    return sum + Number(item.price || 0) * quantity;
  }, 0);
  const originTotal = (items || []).reduce((sum, item) => {
    const quantity = Math.max(1, Number(item.quantity || 1));
    return sum + Number(item.originalPrice || item.price || 0) * quantity;
  }, 0);
  const couponDiscount = coupon && subtotal >= Number(coupon.threshold || 0) ? Number(coupon.amount || 0) : 0;
  const lineDiscount = Math.max(0, originTotal - subtotal);
  const discount = Math.min(subtotal, lineDiscount + couponDiscount);
  return {
    subtotal,
    originTotal,
    discount,
    total: Math.max(0, subtotal - couponDiscount),
    couponDiscount,
    lineDiscount
  };
}

function validateCartItem(item, options) {
  const now = options && options.now ? options.now : new Date();
  const dateValue = item.dateValue || (item.date === '今天' ? todayValue(now) : '');
  const venue = store.getVenueForDate(item.venueId, dateValue) || mock.venues.find(value => value.id === item.venueId);
  const gym = mock.stores.find(value => value.id === item.storeId);
  if (!venue || !gym) {
    return { valid: false, reason: '场地或门店不存在，请重新选择' };
  }
  const start = Number(item.startMinute);
  const end = Number(item.endMinute);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return { valid: false, reason: '时段信息异常，请重新选择' };
  }
  if (dateValue === todayValue(now) && start < nowMinute(now)) {
    return { valid: false, reason: '开始时间已过，请重新选择' };
  }
  if (!isRangeAvailable(gym, venue, start, end)) {
    return { valid: false, reason: '当前可预约时长不足，请重新选择时间' };
  }
  return { valid: true, venue, gym };
}

function validateCartItems(items, options) {
  const invalid = [];
  (items || []).forEach(item => {
    const result = validateCartItem(item, options);
    if (!result.valid) invalid.push(Object.assign({ item }, result));
  });
  return {
    valid: invalid.length === 0,
    invalid
  };
}

function buildBackendOrderRequest(items, mode, coupon) {
  return {
    orderType: mode === 'walkIn' ? 'WALK_IN' : 'RESERVATION',
    couponId: coupon && coupon.id ? coupon.id : null,
    cartItemIds: (items || []).map(item => item.id).filter(Boolean),
    items: (items || []).map(item => ({
      cartItemId: item.id || '',
      venueId: item.venueId,
      venueName: item.venueName,
      storeId: item.storeId,
      packageId: item.packageId || '',
      bizDate: normalizeDateValue(item.dateValue || (item.date === '今天' ? todayValue() : item.date)),
      startTime: minuteToBackendTime(item.startMinute),
      endTime: minuteToBackendTime(item.endMinute),
      priceCent: Math.round(Number(item.price || 0) * 100)
    }))
  };
}

function minuteToBackendTime(value) {
  const minuteValue = Number(value) || 0;
  const hour = Math.floor(minuteValue / 60) % 24;
  const minute = minuteValue % 60;
  return `${`${hour}`.padStart(2, '0')}:${`${minute}`.padStart(2, '0')}:00`;
}

module.exports = {
  buildBackendOrderRequest,
  getCartPricing,
  normalizeDateValue,
  todayValue,
  validateCartItem,
  validateCartItems
};
