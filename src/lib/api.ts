import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { getToken } from './auth';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Create axios instance with base URL and headers
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    
    // Handle 401 Unauthorized errors (token expired or invalid)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Attempt to refresh the token
        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {}, { withCredentials: true });
        const { accessToken } = response.data;
        
        // Store the new token
        localStorage.setItem('authToken', accessToken);
        
        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login
        localStorage.removeItem('authToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper function to handle API errors
const handleApiError = (error: any) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error('API Error Response:', {
      status: error.response.status,
      data: error.response.data,
      headers: error.response.headers,
    });
    
    // Handle specific status codes
    if (error.response.status === 404) {
      throw new Error('The requested resource was not found.');
    }
    
    if (error.response.status === 403) {
      throw new Error('You do not have permission to perform this action.');
    }
    
    // Use server error message if available, otherwise use a generic message
    const errorMessage = error.response.data?.message || 'An error occurred while processing your request.';
    throw new Error(errorMessage);
  } else if (error.request) {
    // The request was made but no response was received
    console.error('API Request Error:', error.request);
    throw new Error('No response received from the server. Please check your network connection.');
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error('API Setup Error:', error.message);
    throw new Error('An error occurred while setting up the request.');
  }
};

// Wrapper functions for HTTP methods with error handling
export const api = {
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response = await apiClient.get<T>(url, config);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  post: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response = await apiClient.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  put: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response = await apiClient.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  patch: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response = await apiClient.patch<T>(url, data, config);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response = await apiClient.delete<T>(url, config);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// Export the axios instance for direct use if needed
export { apiClient };
