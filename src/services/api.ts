import axios from 'axios';
import { message } from 'antd';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const state = JSON.parse(localStorage.getItem('auth-storage') || '{}');
    const token = state?.state?.token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data; // Assumes unified API response structure
  },
  async (error) => {
    const originalRequest = error.config;
    const { response } = error;
    
    if (response) {
      if (response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const state = JSON.parse(localStorage.getItem('auth-storage') || '{}');
          const token = state?.state?.token;
          const refreshToken = state?.state?.refreshToken;
          
          if (token && refreshToken) {
            const res = await axios.post('/api/Auth/refresh-token', { token, refreshToken });
            if (res.data && res.data.success) {
               const newToken = res.data.data.token;
               const newRefreshToken = res.data.data.refreshToken;
               
               // Update local storage directly for simplicity here or use store if possible
               state.state.token = newToken;
               state.state.refreshToken = newRefreshToken;
               localStorage.setItem('auth-storage', JSON.stringify(state));
               
               originalRequest.headers.Authorization = `Bearer ${newToken}`;
               return api(originalRequest);
            }
          }
        } catch (refreshError) {
          localStorage.removeItem('auth-storage');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
        
        // Handle unauthorized
        message.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
      } else if (response.status === 403) {
        message.error('Bạn không có quyền truy cập chức năng này.');
      } else if (response.data && response.data.message) {
        message.error(response.data.message);
      } else {
        message.error('Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } else {
      message.error('Lỗi kết nối máy chủ.');
    }
    return Promise.reject(error);
  }
);

export default api;
