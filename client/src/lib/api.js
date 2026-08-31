import axios from 'axios';

// ── Axios instance with base URL and credentials
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  withCredentials: true, // Send httpOnly refresh cookie automatically
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor: attach access token from memory
api.interceptors.request.use((config) => {
  // Access token is stored in memory (not localStorage — XSS safe)
  const token = (typeof window !== 'undefined') ? window.__accessToken : undefined;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: auto-refresh on 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const ignoreRoutes = ['/auth/refresh', '/auth/login', '/auth/register'];
    if (error.response?.status === 401 && !originalRequest._retry && !ignoreRoutes.includes(originalRequest.url)) {
      if (isRefreshing) {
        // Queue the request while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post('/auth/refresh');
        const newToken = data.accessToken;

        // Store new token in memory
        if (typeof window !== 'undefined') {
          window.__accessToken = newToken;
        }

        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Clear token
        if (typeof window !== 'undefined') {
          window.__accessToken = undefined;
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
