const mock = require('../../utils/mockData.js');
const store = require('../../utils/store.js');
const throttle = require('../../utils/throttle.js');
const queryDomProperty = require('../../utils/queryDomProperty.js');
const { getTemporaryCloudStorageFilesLink } = require('../../utils/cloudStorageFileLinkUtils.js');

Page({
  data: {
    fallbackImage: mock.image,
    swiperImagesFileIDs: [
      'cloud://cloud1-6g1zde6bb1996733.636c-cloud1-6g1zde6bb1996733-1379897245/images/top-main-img6.png',
      'cloud://cloud1-6g1zde6bb1996733.636c-cloud1-6g1zde6bb1996733-1379897245/images/top-main-img5.png',
      'cloud://cloud1-6g1zde6bb1996733.636c-cloud1-6g1zde6bb1996733-1379897245/images/top-main-img4.png'
    ],
    images: [
      { url: mock.image, loading: true },
      { url: mock.image, loading: true },
      { url: mock.image, loading: true }
    ],
    transitionOpacity: [1, 0, 0],
    swiperItemWidth: 0,
    currentIndex: 0,
    durationTime: 500,
    retryCount: {},
    maxRetryNumber: 2,
    retryTimes: [500, 1000, 3000],
    banners: mock.activities,
    user: mock.user,
    loggedIn: false,
    hotVenues: [],
    activities: mock.activities
  },

  onLoad() {
    this.getTemporaryCloudStorageFilesLink = getTemporaryCloudStorageFilesLink.bind(this);
    this.onSwiperTransitionThrottled = throttle(this.onSwiperTransition, 101);
  },

  async onReady() {
    try {
      await queryDomProperty('.swiper-item', this, 'swiperItemWidth', 'width');
    } catch (err) {
      const { windowWidth } = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
      this.setData({ swiperItemWidth: windowWidth });
    }
    this.getTemporaryCloudStorageFilesLink(this.data.swiperImagesFileIDs, 'images');
  },

  onShow() {
    const state = store.getState();
    this.setData({
      loggedIn: state.loggedIn,
      user: state.user,
      hotVenues: mock.venues.slice(0, 3)
    });
  },

  goOpen(e) {
    store.setState({
      openMode: e.currentTarget.dataset.mode || 'walkIn',
      openEntrySource: 'home',
      needResolveLocation: true,
      currentCity: '',
      currentStoreId: '',
      hasSelectedStore: false,
      currentLocation: null
    });
    wx.switchTab({ url: '/pages/open/open' });
  },

  goMine() {
    wx.switchTab({ url: '/pages/mine/mine' });
  },

  goVenue(e) {
    wx.navigateTo({ url: `/pages/venue/venue?id=${e.currentTarget.dataset.id}` });
  },

  goActivity(e) {
    wx.navigateTo({ url: `/pages/activity/activity?id=${e.currentTarget.dataset.id}` });
  },

  onSwiperTap() {
    const activity = this.data.activities[this.data.currentIndex % this.data.activities.length];
    if (activity) wx.navigateTo({ url: `/pages/activity/activity?id=${activity.id}` });
  },

  onSwiperImageLoad(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.images.slice();
    const retryCount = Object.assign({}, this.data.retryCount);
    images[index].loading = false;
    retryCount[index] = 0;
    this.setData({ images, retryCount });
  },

  onSwiperImageError(e) {
    const index = e.currentTarget.dataset.index;
    const retryCount = Object.assign({}, this.data.retryCount);
    const currentRetry = retryCount[index] || 0;
    const images = this.data.images.slice();

    if (currentRetry < this.data.maxRetryNumber) {
      retryCount[index] = currentRetry + 1;
      images[index] = Object.assign({}, images[index], { loading: true });
      this.setData({ retryCount, images });
      setTimeout(() => {
        this.getTemporaryCloudStorageFilesLink(this.data.swiperImagesFileIDs, 'images', index);
      }, this.data.retryTimes[currentRetry]);
      return;
    }

    images[index] = Object.assign({}, images[index], {
      url: this.data.fallbackImage,
      loading: false
    });
    this.setData({ images, retryCount });
  },

  onSwiperTransition(e) {
    const width = this.data.swiperItemWidth || 1;
    const dx = Number(e.detail.dx || 0);
    const percent = Math.min(1, Math.abs(dx / width));
    const direction = dx >= 0 ? 1 : -1;
    const current = this.data.currentIndex;
    const target = (current + direction + this.data.images.length) % this.data.images.length;
    const transitionOpacity = new Array(this.data.images.length).fill(0);
    transitionOpacity[current] = Number((1 - percent).toFixed(2));
    transitionOpacity[target] = Number(percent.toFixed(2));
    this.setData({ transitionOpacity });
  },

  onSwiperChange(e) {
    const current = e.detail.current;
    const transitionOpacity = new Array(this.data.images.length).fill(0);
    transitionOpacity[current] = 1;
    this.setData({ currentIndex: current, transitionOpacity });
  },

  onImageError(e) {
    const field = e.currentTarget.dataset.field;
    const index = e.currentTarget.dataset.index;
    if (field === 'banners') this.setData({ [`banners[${index}].image`]: this.data.fallbackImage });
    if (field === 'venues') this.setData({ [`hotVenues[${index}].image`]: this.data.fallbackImage });
    if (field === 'activities') this.setData({ [`activities[${index}].image`]: this.data.fallbackImage });
  }
});
