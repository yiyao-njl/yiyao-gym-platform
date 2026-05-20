import { defineStore } from 'pinia';
import router from '../router';
import { authApi } from '../api/modules';

const defaultUser = {
  name: '农佳磊',
  account: 'admin',
  role: '超级管理员',
  store: '全部门店',
  phone: '13800000000',
  lastLoginAt: '2026-05-18 09:18'
};

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('gym-admin-token') || '',
    user: JSON.parse(localStorage.getItem('gym-admin-user') || 'null') || defaultUser,
    permissions: ['dashboard', 'stores', 'venues', 'orders', 'payments', 'users', 'marketing', 'reviews', 'statistics', 'system']
  }),
  actions: {
    async login(form) {
      const loginData = await authApi.login({ account: form.account, password: form.password });
      this.token = loginData.accessToken;
      this.user = {
        ...defaultUser,
        account: form.account || 'admin',
        name: form.account === 'manager' ? '门店店长' : defaultUser.name,
        role: form.account === 'staff' ? '员工' : form.account === 'manager' ? '店长' : defaultUser.role,
        permissions: loginData.permissions || []
      };
      try {
        const me = await authApi.me();
        this.user = { ...this.user, ...me };
      } catch (error) {
        // The login token is already valid; keep seed profile if /admin/me is unavailable.
      }
      localStorage.setItem('gym-admin-token', this.token);
      localStorage.setItem('gym-admin-user', JSON.stringify(this.user));
    },
    logout() {
      this.token = '';
      localStorage.removeItem('gym-admin-token');
      localStorage.removeItem('gym-admin-user');
      router.replace('/login');
    }
  }
});
