import axios from 'axios';
import { registerMatchDiagnostics } from '../utils/matchDiagnostics';

const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`;
  }
  return '/api';
};

const apiClient = axios.create({
  baseURL: getBaseURL(),
  timeout: 25000,
});

// Register diagnostics
registerMatchDiagnostics(apiClient);

apiClient.interceptors.request.use((config) => {
  if (config.url && config.url.startsWith('/api/')) {
    if (typeof window !== 'undefined') {
      config.baseURL = window.location.origin;
    } else {
      config.baseURL = '';
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.warn('[Axios Warning / Timeout Handled]', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message
    });
    return Promise.reject(error);
  }
);

export default apiClient;
