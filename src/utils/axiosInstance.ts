import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_URI,
  withCredentials: true,
});

// -------------------------------
// Token Management
// -------------------------------
const getStoredToken = (): string | null => {
  return localStorage.getItem('accessToken');
};

const setStoredToken = (token: string): void => {
  localStorage.setItem('accessToken', token);
  axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

const clearTokens = (): void => {
  localStorage.removeItem('accessToken');
  delete axiosInstance.defaults.headers.common['Authorization'];
};

// -------------------------------
// Refresh Token Logic
// -------------------------------
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

const onRefreshSuccess = (token: string) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

// -------------------------------
// Logout Handler
// -------------------------------
const handleLogout = () => {
  clearTokens();
  
  axiosInstance.post('/auth/logout', {}, { withCredentials: true }).catch(() => {});
  
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
};

// -------------------------------
// REQUEST INTERCEPTOR
// -------------------------------
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getStoredToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// -------------------------------
// RESPONSE INTERCEPTOR
// -------------------------------
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }
    
    // Skip refresh endpoint to avoid loops
    if (originalRequest.url?.includes('/auth/refresh-token') || 
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/logout')) {
      handleLogout(); // ✅ Logout if refresh fails
      return Promise.reject(error);
    }
    
    if (originalRequest._retry) {
      handleLogout();
      return Promise.reject(error);
    }
    
    // Queue requests during refresh
    if (isRefreshing) {
      return new Promise((resolve) => {
        subscribeTokenRefresh((token: string) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(axiosInstance(originalRequest));
        });
      });
    }
    
    originalRequest._retry = true;
    isRefreshing = true;
    
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URI}/auth/refresh-token`,
        {},
        { 
          withCredentials: true,
          baseURL: process.env.NEXT_PUBLIC_URI
        }
      );
      
      // ✅ Extract accessToken from response
      const { accessToken } = response.data;
      
      if (!accessToken) {
        throw new Error('No access token in refresh response');
      }
      
      setStoredToken(accessToken);
      
      isRefreshing = false;
      onRefreshSuccess(accessToken);
      
      // Retry original request
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      isRefreshing = false;
      refreshSubscribers = [];
      handleLogout();
      return Promise.reject(refreshError);
    }
  }
);

export const setAuthToken = (token: string): void => {
  setStoredToken(token);
};

export const clearAuth = (): void => {
  handleLogout();
};

export default axiosInstance;