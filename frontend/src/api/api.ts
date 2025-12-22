import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';
import { store } from '../store/store';
import { logout } from '../store/slices/authSlice';

interface ErrorResponse {
  message?: string;
  errors?: Array<{ field: string; message: string }>;
  success?: boolean;
}

const api = axios.create({
  baseURL: 'https://assignment-lf5b.onrender.com/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token') || store.getState().auth.token;
    
    if (token) {
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
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError<ErrorResponse>) => {
    const status = error.response?.status;
    const errorData = error.response?.data;
    
    if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      toast.error('Cannot connect to server. Please check if the backend is running.');
    } else if (status === 401) {
      localStorage.removeItem('token');
      store.dispatch(logout());
      
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
        toast.error('Session expired. Please login again.');
      }
    } else if (status === 403) {
      toast.error('You do not have permission to perform this action.');
    } else if (status === 500) {
      toast.error('Server error. Please try again later.');
    } else if (status === 400) {
      const message = errorData?.message || 'Validation error';
      toast.error(message);
    } else if (!error.response) {
      toast.error('Unable to connect to server. Please try again.');
    }
     
    return Promise.reject(error);
  }
);

export default api;   