const MIN_BOOK_MINUTES = 60;
const END_STEP_MINUTES = 30;

const PRIORITY = {
  free: 0,
  booked: 1,
  using: 2
};

function getNowMinute(now) {
  const date = now || new Date();
  return date.getHours() * 60 + date.getMinutes();
}

function getBusinessMinutes(store) {
  const startHour = Number(store && store.hours && store.hours.start);
  const endHour = Number(store && store.hours && store.hours.end);
  const businessStart = Number.isFinite(startHour) ? startHour * 60 : 0;
  const businessEnd = Number.isFinite(endHour) ? endHour * 60 : businessStart;
  return { businessStart, businessEnd };
}

function isStoreManuallyOpen(store) {
  const status = store && store.status ? store.status : '休息中';
  return status === '营业中';
}

function isWithinBusinessHours(store, now) {
  const business = getBusinessMinutes(store);
  const current = getNowMinute(now);
  if (business.businessEnd <= business.businessStart) return false;
  if (business.businessEnd <= 24 * 60) {
    return current >= business.businessStart && current < business.businessEnd;
  }
  return current >= business.businessStart || current < business.businessEnd - 24 * 60;
}

function isStoreOpenNow(store, now) {
  if (!isStoreManuallyOpen(store)) return false;
  return isWithinBusinessHours(store, now);
}

function getStoreDisplayStatus(store, now) {
  const status = store && store.status ? store.status : '休息中';
  if (status === '营业中') {
    return isWithinBusinessHours(store, now) ? '营业中' : '休息中';
  }
  return status;
}

function isStoreDisabled(store) {
  const status = store && store.status ? store.status : '';
  return ['停用', '已停用', '维护中'].indexOf(status) > -1;
}

function isStoreBookable(store) {
  return !isStoreDisabled(store);
}

function isBusinessRangeAvailable(store, start, end) {
  const business = getBusinessMinutes(store);
  if (business.businessEnd <= business.businessStart) return false;
  return start >= business.businessStart && end <= business.businessEnd && end > start;
}

function formatDateValue(date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function getNextReservationDateValue(store, now) {
  const date = now || new Date();
  const current = getNowMinute(date);
  const business = getBusinessMinutes(store);
  const target = new Date(date);
  const afterSameDayClose = business.businessEnd <= 24 * 60
    && business.businessEnd > business.businessStart
    && current >= business.businessEnd;
  if (afterSameDayClose) {
    target.setDate(target.getDate() + 1);
  }
  return formatDateValue(target);
}

function normalizeIntervals(intervals, type) {
  if (!Array.isArray(intervals)) return [];
  return intervals
    .filter(item => item && Number.isFinite(Number(item.start)) && Number(item.end) > Number(item.start))
    .map(item => ({
      start: Number(item.start),
      end: Number(item.end),
      type: item.type || type || 'booked'
    }))
    .sort((a, b) => a.start - b.start);
}

function getCloseIntervals(store, venue) {
  const venueIntervals = normalizeIntervals(venue && venue.closeIntervals, 'booked');
  if (venueIntervals.length) return venueIntervals;
  return normalizeIntervals(store && store.closeIntervals, 'booked');
}

function getBusinessWindow(store, isToday, now) {
  const { businessStart, businessEnd } = getBusinessMinutes(store);
  const current = getNowMinute(now);
  const startMinute = isToday ? Math.max(businessStart, current) : businessStart;
  return {
    businessStart,
    businessEnd,
    startMinute,
    startHour: Math.floor(startMinute / 60),
    maxEndHour: businessEnd / 60
  };
}

function getBlockRanges(store, venue) {
  return normalizeIntervals(venue && venue.timeRanges)
    .concat(getCloseIntervals(store, venue))
    .sort((a, b) => a.start - b.start);
}

function getMaxEndMinute(store, venue, startMinute) {
  const endHour = Number(store && store.hours && store.hours.end);
  const defaultEnd = Number.isFinite(endHour) ? endHour * 60 : startMinute;
  const closeInterval = getCloseIntervals(store, venue).find(item => item.start >= startMinute);
  if (!closeInterval) return defaultEnd;
  return Math.min(defaultEnd, closeInterval.start);
}

function rangeOverlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}

function getRangeType(ranges, start, end) {
  return ranges.reduce((type, item) => {
    if (!rangeOverlaps(start, end, item.start, item.end)) return type;
    return PRIORITY[item.type] > PRIORITY[type] ? item.type : type;
  }, 'free');
}

function isRangeAvailable(store, venue, start, end) {
  if (!isStoreBookable(store) || !isBusinessRangeAvailable(store, start, end)) return false;
  return !getBlockRanges(store, venue).some(item => rangeOverlaps(start, end, item.start, item.end));
}

function getContinuousEndMinute(store, venue, startMinute) {
  const maxEnd = getMaxEndMinute(store, venue, startMinute);
  if (!isRangeAvailable(store, venue, startMinute, startMinute + 1)) return startMinute;
  const nextBlock = getBlockRanges(store, venue).find(item => item.start >= startMinute);
  return Math.min(maxEnd, nextBlock ? nextBlock.start : maxEnd);
}

function formatSlotLabel(hour, maxEndHour) {
  if (hour === 24 && maxEndHour <= 24) return '24';
  if (hour === 24 && maxEndHour > 24) return '次';
  if (hour > 24) return `${hour - 24}`;
  return `${hour}`;
}

function formatClockHour(hour) {
  if (hour === 24) return '次日0';
  if (hour > 24) return `次日${hour - 24}`;
  return `${hour}`;
}

function formatClockTime(value) {
  const minuteValue = Math.round(Number(value) || 0);
  const hour = Math.floor(minuteValue / 60);
  const minute = minuteValue % 60;
  return `${formatClockHour(hour)}:${`${minute}`.padStart(2, '0')}`;
}

function buildHourTicks(store, isToday, now, venue) {
  const window = getBusinessWindow(store, isToday, now);
  const maxEndMinute = getMaxEndMinute(store, venue, window.startMinute);
  const startHour = Math.floor(window.startMinute / 60);
  const endHour = Math.floor(maxEndMinute / 60);
  const count = Math.min(24, Math.max(1, endHour - startHour + 1));
  const hours = Array.from({ length: count }).map((_, index) => startHour + index);
  const maxEndHour = maxEndMinute / 60;
  return {
    startMinute: window.startMinute,
    startHour,
    maxEndMinute,
    maxEndHour,
    hours,
    labels: hours.map(hour => formatSlotLabel(hour, maxEndHour))
  };
}

function buildTimelineSlots(store, venue, isToday, now) {
  const range = buildHourTicks(store, isToday, now, venue);
  const ranges = getBlockRanges(store, venue);
  const slots = range.hours.map(hour => {
    const hourStart = hour * 60;
    const hourEnd = hourStart + 60;
    const points = [hourStart, hourEnd];
    ranges.forEach(item => {
      const start = Math.max(hourStart, item.start);
      const end = Math.min(hourEnd, item.end);
      if (start < end) points.push(start, end);
    });
    const sorted = Array.from(new Set(points)).sort((a, b) => a - b);
    const segments = [];
    for (let index = 0; index < sorted.length - 1; index += 1) {
      const start = sorted[index];
      const end = sorted[index + 1];
      const type = getRangeType(ranges, start, end);
      const width = ((end - start) / 60) * 100;
      const left = ((start - hourStart) / 60) * 100;
      if (width > 0) {
        segments.push({ type, left: `${left}%`, width: `${width}%` });
      }
    }
    return {
      hour,
      label: formatSlotLabel(hour, range.maxEndHour),
      segments
    };
  });
  return Object.assign({}, range, { slots });
}

function getStartOptions(store, venue, isToday, now) {
  const window = getBusinessWindow(store, isToday, now);
  const maxEnd = getMaxEndMinute(store, venue, window.startMinute);
  const options = [];
  for (let minute = window.startMinute; minute + MIN_BOOK_MINUTES <= maxEnd; minute += 1) {
    if (getContinuousEndMinute(store, venue, minute) - minute >= MIN_BOOK_MINUTES) {
      options.push({ label: formatClockTime(minute), value: minute });
    }
  }
  return options;
}

function getEndOptions(store, venue, startMinute) {
  const continuousEnd = getContinuousEndMinute(store, venue, startMinute);
  const options = [];
  for (let minute = startMinute + MIN_BOOK_MINUTES; minute <= continuousEnd; minute += END_STEP_MINUTES) {
    if (isRangeAvailable(store, venue, startMinute, minute)) {
      options.push({ label: formatClockTime(minute), value: minute });
    }
  }
  return options;
}

function getVenueAvailability(store, venue, isToday, now) {
  const startOptions = getStartOptions(store, venue, isToday, now);
  const nowMinute = getNowMinute(now);
  const usingNow = normalizeIntervals(venue && venue.timeRanges)
    .some(item => item.type === 'using' && item.start <= nowMinute && item.end > nowMinute);
  if (!startOptions.length) {
    return { status: '不可预定', canBook: false, startOptions };
  }
  if (usingNow) {
    return { status: '使用中', canBook: true, startOptions };
  }
  return { status: '可预定', canBook: true, startOptions };
}

function buildSlotRange(options) {
  const range = buildHourTicks(options.store, options.isToday, options.now, options.venue);
  return {
    startHour: range.startHour,
    maxEndHour: range.maxEndHour,
    hours: range.hours,
    labels: range.labels
  };
}

function clampDuration(startHour, duration, maxEndHour) {
  const maxDuration = Math.max(0, maxEndHour - startHour);
  return Math.min(Number(duration) || 1, maxDuration);
}

module.exports = {
  MIN_BOOK_MINUTES,
  buildSlotRange,
  buildTimelineSlots,
  clampDuration,
  formatClockHour,
  formatClockTime,
  formatSlotLabel,
  getEndOptions,
  getNextReservationDateValue,
  getStoreDisplayStatus,
  getStartOptions,
  getVenueAvailability,
  isStoreBookable,
  isStoreOpenNow,
  isRangeAvailable
};
