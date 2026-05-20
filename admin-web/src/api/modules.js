import request from './request';

export const authApi = {
  login: (data) => request.post('/auth/admin/login', data),
  me: () => request.get('/admin/me'),
  logout: () => request.post('/auth/logout')
};

export const adminApi = {
  dashboard: (params) => request.get('/admin/statistics/dashboard', { params }),
  statistics: (params) => request.get('/admin/statistics/overview', { params }),
  stores: (params) => request.get('/admin/stores', { params }),
  updateStore: (storeId, data) => request.patch(`/admin/stores/${storeId}`, data),
  venues: (params) => request.get('/admin/venues', { params }),
  updateVenue: (venueId, data) => request.patch(`/admin/venues/${venueId}`, data),
  venueTypes: () => request.get('/admin/venue-types'),
  packages: (params) => request.get('/admin/venue-packages', { params }),
  orders: (params) => request.get('/admin/orders', { params }),
  orderDetail: (orderId) => request.get(`/admin/orders/${orderId}`),
  arriveOrder: (orderId) => request.post(`/admin/orders/${orderId}/arrive`),
  cancelOrder: (orderId) => request.post(`/admin/orders/${orderId}/cancel`),
  refundOrder: (orderId, data) => request.post(`/admin/orders/${orderId}/refund`, data),
  auditRefund: (refundId, data) => request.post(`/admin/refunds/${refundId}/audit`, data),
  payments: (params) => request.get('/admin/payments', { params }),
  paymentSummary: (params) => request.get('/admin/payments/summary', { params }),
  coupons: (params) => request.get('/admin/coupons', { params }),
  activities: (params) => request.get('/admin/activities', { params }),
  reviews: (params) => request.get('/admin/reviews', { params }),
  updateReview: (reviewId, data) => request.patch(`/admin/reviews/${reviewId}`, data),
  accounts: (params) => request.get('/admin/accounts', { params }),
  users: (params) => request.get('/admin/users', { params }),
  userSummary: (params) => request.get('/admin/users/summary', { params }),
  members: (params) => request.get('/admin/members', { params }),
  updateMembers: (data) => request.put('/admin/members', data),
  logs: (params) => request.get('/admin/logs', { params })
};

export function records(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.records)) return payload.records;
  if (Array.isArray(payload?.data?.records)) return payload.data.records;
  return [];
}
