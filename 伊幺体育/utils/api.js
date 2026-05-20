const http = require('./request.js');

module.exports = {
  auth: {
    sendSms(phone) {
      return http.request({ url: '/api/auth/sms/send', method: 'POST', data: { phone } });
    },
    smsLogin(phone, code) {
      return http.request({ url: '/api/auth/sms/login', method: 'POST', data: { phone, code } });
    },
    wechatLogin(data) {
      return http.request({ url: '/api/auth/app/wechat-login', method: 'POST', data });
    }
  },
  app: {
    home() {
      return http.request({ url: '/api/app/home' });
    },
    cities() {
      return http.request({ url: '/api/app/cities' });
    },
    stores() {
      return http.request({ url: '/api/app/stores' });
    },
    venues(params) {
      return http.request({ url: '/api/app/venues', data: params || {} });
    },
    checkReservation(data) {
      return http.request({ url: '/api/app/reservations/check', method: 'POST', data });
    },
    createOrder(data) {
      return http.request({ url: '/api/app/orders', method: 'POST', data });
    },
    createPayment(data) {
      return http.request({ url: '/api/app/payments', method: 'POST', data });
    },
    mockPaySuccess(data) {
      return http.request({ url: '/api/app/payments/mock-success', method: 'POST', data });
    },
    orders() {
      return http.request({ url: '/api/app/orders' });
    },
    orderDetail(orderId) {
      return http.request({ url: `/api/app/orders/${orderId}` });
    },
    cancelOrder(orderId) {
      return http.request({ url: `/api/app/orders/${orderId}/cancel`, method: 'POST' });
    },
    refundOrder(orderId, reason) {
      return http.request({ url: `/api/app/orders/${orderId}/refund`, method: 'POST', data: { reason: reason || '' } });
    },
    confirmArrival(orderId) {
      return http.request({ url: `/api/app/orders/${orderId}/confirm-arrival`, method: 'POST' });
    }
  }
};
