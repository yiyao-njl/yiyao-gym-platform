const mock = require('../../utils/mockData.js');
const store = require('../../utils/store.js');
const mapDistance = require('../../utils/mapDistance.js');
const { getStoreDisplayStatus } = require('../../utils/timeSlots.js');

const cityCenters = {
  深圳: { latitude: 22.543096, longitude: 114.057865 },
  广州: { latitude: 23.12911, longitude: 113.264385 },
  上海: { latitude: 31.230416, longitude: 121.473701 },
  北京: { latitude: 39.9042, longitude: 116.407396 },
  成都: { latitude: 30.572815, longitude: 104.066801 },
  武汉: { latitude: 30.592849, longitude: 114.305539 },
  长沙: { latitude: 28.228209, longitude: 112.938814 },
  郑州: { latitude: 34.746611, longitude: 113.625328 },
  杭州: { latitude: 30.274085, longitude: 120.15507 },
  南京: { latitude: 32.060255, longitude: 118.796877 },
  厦门: { latitude: 24.479834, longitude: 118.089425 },
  西安: { latitude: 34.341568, longitude: 108.940174 }
};

function normalizeCity(city) {
  if (!city) return '深圳';
  return city.endsWith('市') ? city.slice(0, -1) : city;
}

function formatHours(hours) {
  const end = hours.end > 24 ? `次日${hours.end - 24}:00` : `${hours.end}:00`;
  return `${hours.start}:00-${end}`;
}

function getStoreLocation(item, index) {
  const fallback = cityCenters[normalizeCity(item.city)] || cityCenters.深圳;
  const offset = (index + 1) * 0.006;
  return {
    latitude: Number(item.latitude) || fallback.latitude + offset,
    longitude: Number(item.longitude) || fallback.longitude + offset
  };
}

function getStatusClass(statusText) {
  return statusText === '营业中' ? 'open' : 'resting';
}

Page({
  data: {
    city: '深圳市',
    searchText: '',
    stores: [],
    markers: [],
    mapCenter: cityCenters.深圳,
    mapVisible: true,
    locationEnabled: false,
    selectedStoreId: ''
  },

  onLoad(options) {
    const state = store.getState();
    const city = normalizeCity(options.city || state.currentCity || '深圳');
    this.needCity = options.needCity === '1';
    this.hasOpenedCity = false;
    this.setData({ selectedStoreId: state.hasSelectedStore ? state.currentStoreId : '' });
    this.loadStores(city);
    this.locateMe({ silent: true });
  },

  onShow() {
    const state = store.getState();
    this.setData({ selectedStoreId: state.hasSelectedStore ? state.currentStoreId : '' });
    this.loadStores(state.currentCity || this.data.city);
    if (this.needCity && !this.hasOpenedCity) {
      this.hasOpenedCity = true;
      wx.navigateTo({ url: '/pages/city/city' });
    }
  },

  onReady() {
    this.mapCtx = wx.createMapContext('storeMap', this);
  },

  onUnload() {
    if (this.statusTimer) {
      clearInterval(this.statusTimer);
      this.statusTimer = null;
    }
  },

  loadStores(city) {
    const cityName = normalizeCity(city);
    const keyword = this.data.searchText.trim();
    const stores = mock.stores
      .filter(item => normalizeCity(item.city) === cityName)
      .filter(item => !keyword || item.name.indexOf(keyword) > -1 || item.address.indexOf(keyword) > -1)
      .map((item, index) => {
        const location = getStoreLocation(item, index);
        const statusText = getStoreDisplayStatus(item);
        return Object.assign({}, item, location, {
          hoursText: formatHours(item.hours),
          statusText,
          statusClass: getStatusClass(statusText)
        });
      });

    const center = stores[0]
      ? { latitude: stores[0].latitude, longitude: stores[0].longitude }
      : (cityCenters[cityName] || cityCenters.深圳);

    this.setData({
      city: `${cityName}市`,
      stores,
      mapCenter: center,
      markers: stores.map((item, index) => ({
        id: index + 1,
        latitude: item.latitude,
        longitude: item.longitude,
        title: item.name,
        iconPath: '/images/icons/store-map-marker.png',
        width: 32,
        height: 32,
        callout: {
          content: `${item.name} >`,
          color: '#111111',
          fontSize: 14,
          borderRadius: 18,
          bgColor: '#ffffff',
          padding: 8,
          display: index === 0 ? 'ALWAYS' : 'BYCLICK'
        }
      }))
    }, () => {
      const state = store.getState();
      if (state.currentLocation) this.refreshStoreDistances(state.currentLocation);
      this.startStatusTimer();
    });
  },

  startStatusTimer() {
    if (this.statusTimer) return;
    this.statusTimer = setInterval(() => {
      this.refreshStoreStatuses();
    }, 60 * 1000);
  },

  refreshStoreStatuses() {
    const stores = this.data.stores.map(item => {
      const statusText = getStoreDisplayStatus(item);
      return Object.assign({}, item, {
        statusText,
        statusClass: getStatusClass(statusText)
      });
    });
    this.setData({ stores });
  },

  async refreshStoreDistances(location) {
    if (!location || !this.data.stores.length) return;
    const distances = await mapDistance.getDistanceMap(location, this.data.stores);
    const stores = this.data.stores.map(item => Object.assign({}, item, {
      distance: mapDistance.formatDistance(distances[item.id]) || item.distance
    }));
    this.setData({ stores });
  },

  onSearchInput(e) {
    this.setData({ searchText: e.detail.value || '' });
    this.loadStores(this.data.city);
  },

  locateMe(options = {}) {
    wx.getLocation({
      type: 'gcj02',
      success: res => {
        const nextCenter = {
          latitude: res.latitude,
          longitude: res.longitude
        };
        store.setState({ currentLocation: nextCenter });
        const patch = { locationEnabled: true };
        if (!options.silent) {
          patch.mapCenter = nextCenter;
        }
        this.setData(patch, () => {
          this.refreshStoreDistances(nextCenter);
          if (!options.silent && this.mapCtx) {
            this.mapCtx.moveToLocation(nextCenter);
          }
        });
      },
      fail: () => {
        if (!options.silent) {
          wx.showToast({ title: '定位失败', icon: 'none' });
        }
      }
    });
  },

  goCity() {
    wx.navigateTo({ url: '/pages/city/city' });
  },

  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
      return;
    }
    wx.switchTab({ url: '/pages/open/open' });
  },

  chooseStore(e) {
    const target = this.data.stores.find(item => item.id === e.currentTarget.dataset.id);
    if (!target) return;
    store.setStore(target.id, normalizeCity(target.city));
    this.setData({ selectedStoreId: target.id });
    wx.showToast({ title: '门店已切换', icon: 'success' });
    setTimeout(() => {
      if (getCurrentPages().length > 1) {
        wx.navigateBack();
        return;
      }
      wx.switchTab({ url: '/pages/open/open' });
    }, 250);
  },

  callStore(e) {
    const target = this.data.stores.find(item => item.id === e.currentTarget.dataset.id);
    if (!target) return;
    wx.makePhoneCall({ phoneNumber: target.phone || '4008002026' });
  },

  openMap(e) {
    const target = this.data.stores.find(item => item.id === e.currentTarget.dataset.id);
    if (!target) return;
    wx.openLocation({
      latitude: target.latitude,
      longitude: target.longitude,
      name: target.name,
      address: target.address,
      scale: 16
    });
  }
});
