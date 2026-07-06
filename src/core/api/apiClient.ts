import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api', // Proxy
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  return config;
});

export default apiClient;
