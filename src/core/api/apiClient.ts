import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api', // Proxy
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  if (config.url && config.url.startsWith('/api/')) {
    config.baseURL = '';
  }
  return config;
});

export default apiClient;
