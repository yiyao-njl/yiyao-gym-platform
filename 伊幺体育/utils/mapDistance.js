const { QQ_MAP_KEY } = require('./mapConfig.js');

function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    wx.getLocation({
      type: 'gcj02',
      success: res => resolve({
        latitude: res.latitude,
        longitude: res.longitude
      }),
      fail: reject
    });
  });
}

function formatDistance(meters) {
  const value = Number(meters);
  if (!Number.isFinite(value) || value < 0) return '';
  if (value < 1000) return `${Math.round(value)}m`;
  return `${(value / 1000).toFixed(value < 10000 ? 1 : 0)}km`;
}

function haversineDistance(from, to) {
  const rad = Math.PI / 180;
  const lat1 = Number(from.latitude) * rad;
  const lat2 = Number(to.latitude) * rad;
  const dLat = (Number(to.latitude) - Number(from.latitude)) * rad;
  const dLng = (Number(to.longitude) - Number(from.longitude)) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function requestDistanceMatrix(location, stores) {
  const targets = stores.filter(item => Number.isFinite(Number(item.latitude)) && Number.isFinite(Number(item.longitude)));
  if (!QQ_MAP_KEY || !targets.length) {
    return Promise.reject(new Error('QQ_MAP_KEY missing or no target stores'));
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: 'https://apis.map.qq.com/ws/distance/v1/matrix/',
      method: 'GET',
      data: {
        mode: 'driving',
        from: `${location.latitude},${location.longitude}`,
        to: targets.map(item => `${item.latitude},${item.longitude}`).join(';'),
        key: QQ_MAP_KEY
      },
      success: res => {
        const elements = res.data && res.data.result && res.data.result.rows
          && res.data.result.rows[0] && res.data.result.rows[0].elements;
        if (!elements || !elements.length) {
          reject(new Error('Tencent distance response invalid'));
          return;
        }
        const distances = {};
        targets.forEach((item, index) => {
          const distance = elements[index] && elements[index].distance;
          if (Number.isFinite(Number(distance))) distances[item.id] = Number(distance);
        });
        resolve(distances);
      },
      fail: reject
    });
  });
}

async function getDistanceMap(location, stores) {
  try {
    return await requestDistanceMatrix(location, stores);
  } catch (err) {
    const distances = {};
    stores.forEach(item => {
      if (Number.isFinite(Number(item.latitude)) && Number.isFinite(Number(item.longitude))) {
        distances[item.id] = Math.round(haversineDistance(location, item));
      }
    });
    return distances;
  }
}

async function getNearestStoreByLocation(location, stores) {
  const distances = await getDistanceMap(location, stores);
  const ranked = stores
    .filter(item => Number.isFinite(Number(distances[item.id])))
    .map(item => ({ store: item, distance: distances[item.id] }))
    .sort((a, b) => a.distance - b.distance);
  return ranked[0] || null;
}

module.exports = {
  getCurrentLocation,
  getDistanceMap,
  getNearestStoreByLocation,
  formatDistance
};
