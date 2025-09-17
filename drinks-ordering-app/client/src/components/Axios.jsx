// components/Axios.js
import axios from 'axios';

const baseUrl = 'http://127.0.0.1:8000/'

const AxiosInstance = axios.create({
    baseURL: baseUrl,
    timeout: 5000,
    headers: {
        "Content-Type": 'application/json',
        accept: 'application/json'
    }
});

// The following is added by Kirsten
// Store auth context reference (will be set by AuthProvider)
let authContextRef = null;

export const setAuthContext = (authContext) => {
  authContextRef = authContext;
};

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor
AxiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('access token');
    if (accessToken && accessToken !== 'null') {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
AxiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return AxiosInstance(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        let newToken = null;
        
        // Use auth context if available, otherwise fallback to direct API call
        if (authContextRef?.refreshAccessToken) {
          newToken = await authContextRef.refreshAccessToken();
        } else {
          // Fallback refresh logic
          const refreshToken = localStorage.getItem('refresh token');
          if (refreshToken && refreshToken !== 'null') {
            const response = await axios.post(`${baseUrl}api/token/refresh/`, {
              refresh: refreshToken
            });
            newToken = response.data.access;
            localStorage.setItem('access token', newToken);
          }
        }

        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          processQueue(null, newToken);
          return AxiosInstance(originalRequest);
        } else {
          throw new Error('Token refresh failed');
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        
        // Use auth context logout if available
        if (authContextRef?.logout) {
          authContextRef.logout();
        } else {
          // Fallback cleanup
          localStorage.removeItem('access token');
          localStorage.removeItem('refresh token');
          localStorage.setItem('loggedin', 'false');
          window.location.href = '/';
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default AxiosInstance;