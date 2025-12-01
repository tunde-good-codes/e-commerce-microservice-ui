// import axios from "axios";

// const axiosInstance = axios.create({
//   baseURL: process.env.NEXT_PUBLIC_URI,
//   withCredentials: true,
// });

// // -------------------------------
// // Token Refresh State
// // -------------------------------
// let isRefreshing = false;
// let refreshSubscribers: Array<() => void> = [];

// // -------------------------------
// // Logout Handler
// // -------------------------------
// const handleLogout = () => {
//   if (window.location.pathname !== "/login") {
//     window.location.href = "/login";
//   }
// };

// // -------------------------------
// // Subscribe waiting requests
// // -------------------------------
// const subscribeTokenRefresh = (callback: () => void) => {
//   refreshSubscribers.push(callback);
// };

// // -------------------------------
// // Resolve all queued requests
// // -------------------------------
// const onRefreshSuccess = () => {
//   refreshSubscribers.forEach((callback) => callback());
//   refreshSubscribers = [];
// };

// // -------------------------------
// // REQUEST INTERCEPTOR
// // -------------------------------
// axiosInstance.interceptors.request.use(
//   (config) => config,
//   (error) => Promise.reject(error)
// );

// // -------------------------------
// // RESPONSE INTERCEPTOR
// // -------------------------------
// axiosInstance.interceptors.response.use(
//   (response) => response,

//   async (error) => {
//     const originalRequest = error.config;

//     // Not a 401 error → reject
//     if (error.response?.status !== 401) {
//       return Promise.reject(error);
//     }

//     // Already retried → logout or reject
//     if (originalRequest._retry) {
//       handleLogout();
//       return Promise.reject(error);
//     }

//     // If refresh already in progress → queue request
//     if (isRefreshing) {
//       return new Promise((resolve) => {
//         subscribeTokenRefresh(() => {
//           resolve(axiosInstance(originalRequest));
//         });
//       });
//     }

//     // Start refresh logic
//     originalRequest._retry = true;
//     isRefreshing = true;

//     try {
//       await axios.post(
//         `${process.env.NEXT_PUBLIC_URI}/auth/refresh-token`,
//         {},
//         { withCredentials: true }
//       );

//       isRefreshing = false;
//       onRefreshSuccess(); // replay queued requests

//       return axiosInstance(originalRequest);
//     } catch (refreshError) {
//       isRefreshing = false;
//       refreshSubscribers = [];
//       handleLogout();
//       return Promise.reject(refreshError);
//     }
//   }
// );

// export default axiosInstance;




import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_URI,
  withCredentials: true, // For cookies
});

// -------------------------------
// Token Management
// -------------------------------
const getStoredToken = (): string | null => {
  return localStorage.getItem('accessToken');
};

const setStoredToken = (token: string): void => {
  localStorage.setItem('accessToken', token);
  // Update axios default header
  axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

const clearTokens = (): void => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
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
  
  // Optional: Call logout endpoint
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
    // Add Authorization header from localStorage (for Bearer token)
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
    
    // Skip non-401 errors
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }
    
    // Skip refresh endpoint to avoid loops
    if (originalRequest.url?.includes('/auth/refresh-token') || 
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/logout')) {
      return Promise.reject(error);
    }
    
    // Already retried → logout
    if (originalRequest._retry) {
      handleLogout();
      return Promise.reject(error);
    }
    
    // Queue requests during refresh
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((token: string) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(axiosInstance(originalRequest));
        });
      });
    }
    
    // Start refresh
    originalRequest._retry = true;
    isRefreshing = true;
    
    try {
      // Call refresh endpoint
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_URI}/auth/refresh-token`,
        {},
        { 
          withCredentials: true,
          baseURL: process.env.NEXT_PUBLIC_URI
        }
      );
      
      // Store new tokens if provided in response
      const { accessToken, refreshToken } = response.data;
      
      if (accessToken) {
        setStoredToken(accessToken);
      }
      
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      
      isRefreshing = false;
      onRefreshSuccess(accessToken || '');
      
      // Retry original request
      if (accessToken) {
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      }
      
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      isRefreshing = false;
      refreshSubscribers = [];
      handleLogout();
      return Promise.reject(refreshError);
    }
  }
);

// -------------------------------
// Helper methods for components
// -------------------------------
export const setAuthToken = (token: string): void => {
  setStoredToken(token);
};

export const clearAuth = (): void => {
  handleLogout();
};

export default axiosInstance;