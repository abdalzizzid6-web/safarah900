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
  timeout: 8000,
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

export default apiClient;
