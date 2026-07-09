import axios from 'axios';
import { registerMatchDiagnostics } from '../utils/matchDiagnostics';

const apiClient = axios.create({
  baseURL: '/api', // Proxy
  timeout: 20000,
});

// Register diagnostics
registerMatchDiagnostics(apiClient);

apiClient.interceptors.request.use((config) => {
  if (config.url && config.url.startsWith('/api/')) {
    config.baseURL = '';
  }
  return config;
});

export default apiClient;
