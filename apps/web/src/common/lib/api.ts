import axios from 'axios';

// Singleton API instance shared across the app
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}`,
  withCredentials: true,
});

// Auto-logout on expired or invalid session
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const code = error?.response?.data?.error?.code;

    if (status === 401 || (status === 403 && code === 'NO_STORE_CONTEXT')) {
      // Clear local auth state and redirect to login
      import('../../features/auth/stores/useAuthStore').then(({ useAuthStore }) => {
        useAuthStore.getState().logout();
      });
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
