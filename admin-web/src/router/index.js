import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const routes = [
  { path: '/login', name: 'login', component: () => import('../views/Login.vue') },
  {
    path: '/',
    component: () => import('../layout/AdminLayout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'dashboard', meta: { title: '首页看板' }, component: () => import('../views/Dashboard.vue') },
      { path: 'resources', name: 'resources', meta: { title: '门店场地' }, component: () => import('../views/ResourceManagement.vue') },
      { path: 'orders', name: 'orders', meta: { title: '订单管理' }, component: () => import('../views/Orders.vue') },
      { path: 'payments', name: 'payments', meta: { title: '支付退款' }, component: () => import('../views/Payments.vue') },
      { path: 'users', name: 'users', meta: { title: '用户会员' }, component: () => import('../views/UsersMembers.vue') },
      { path: 'marketing', name: 'marketing', meta: { title: '营销管理' }, component: () => import('../views/Marketing.vue') },
      { path: 'reviews', name: 'reviews', meta: { title: '评价管理' }, component: () => import('../views/Reviews.vue') },
      { path: 'statistics', name: 'statistics', meta: { title: '数据统计' }, component: () => import('../views/Statistics.vue') },
      { path: 'system', name: 'system', meta: { title: '系统管理' }, component: () => import('../views/System.vue') }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.path !== '/login' && !auth.token) return '/login';
  if (to.path === '/login' && auth.token) return '/dashboard';
  return true;
});

export default router;
