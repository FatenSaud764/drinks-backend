// axios instance for API requests - session-based authentication for now
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/",
  withCredentials: false, // send session cookies
  // HAD TO CHANGE TO FALSE TO WORK WITH "CORS_ALLOW_ALL_ORIGINS = True" in setting.py
  headers: {
    // "Content-Type": "application/json",
    accept: "application/json"
  },
});

// Request interceptor to set Content-Type per request
api.interceptors.request.use(
  (config) => {
    // Only set JSON content type if no other content type is specified
    // and we're not sending FormData
    if (!config.headers['Content-Type'] && !(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Request interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't log expected PIN verification errors when searching for orders
    const isOTPVerificationError = 
      error.config?.url?.includes('/otp/verify/') && 
      error.response?.status === 400 &&
      error.response?.data?.detail === 'Invalid code.';
    
    if (!isOTPVerificationError) {
      console.error('API Error:', error.response?.data || error.message); // Old behavior preserved
    }
    
    return Promise.reject(error); // Old behavior preserved
  }
);

export default api;
