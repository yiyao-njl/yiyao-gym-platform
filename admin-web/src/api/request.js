import axios from 'axios';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '../stores/auth';

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
});

request.interceptors.request.use((config) => {
  const auth = useAuthStore();
  if (auth.token) {
    config.headers.Authorization = `Bearer ${auth.token}`;
  }
  config.headers['X-Client-Type'] = 'admin-web';
  return config;
});

request.interceptors.response.use(
  (response) => {
    const payload = response.data;
    if (payload?.code && payload.code !== 'SUCCESS') {
      ElMessage.error(payload.message || '请求失败');
      return Promise.reject(payload);
    }
    return payload?.data ?? payload;
  },
  (error) => {
    const message = error.response?.data?.message || error.message || '网络请求失败';
    if (error.response?.status === 401) {
      useAuthStore().logout();
    }
    ElMessage.error(message);
    return Promise.reject(error);
  }
);

export default request;
