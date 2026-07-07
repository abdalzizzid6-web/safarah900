import { AxiosInstance } from 'axios';

/**
 * Diagnostic Interceptor for Live Matches
 * Targets /api/matches/live to debug filtering and normalization issues
 */
export const registerMatchDiagnostics = (apiClient: AxiosInstance) => {
  apiClient.interceptors.response.use(
    (response) => {
      const url = response.config.url || '';
      
      if (url.includes('/api/matches/live') || url.includes('/matches/live')) {
        const requestId = response.headers['x-request-id'] || 'N/A';
        const dataSource = response.headers['x-data-source'] || 'N/A';
        const matchCount = response.headers['x-match-count'] || '0';
        const latency = response.headers['x-latency-ms'] || 'N/A';
        const cacheStatus = response.headers['x-cache-status'] || 'MISS';

        console.group(`[Live Match Diagnostic][${requestId}]`);
        console.log(`URL: ${url}`);
        console.log(`Status: ${response.status} ${response.statusText}`);
        console.log(`Source: ${dataSource}`);
        console.log(`Cache: ${cacheStatus}`);
        console.log(`Latency: ${latency}ms`);
        console.log(`Reported Match Count: ${matchCount}`);
        console.log(`Actual Body Length: ${Array.isArray(response.data) ? response.data.length : 'Not an array'}`);
        
        if (Array.isArray(response.data)) {
          if (response.data.length === 0) {
            console.warn('⚠️ RESPONSE IS EMPTY: Data might be filtered out by server or missing from source.');
          } else {
            console.log('Sample Match (Normalized):', response.data[0]);
          }
        }
        
        console.groupEnd();
      }
      
      return response;
    },
    (error) => {
      if (error.config?.url?.includes('/api/matches/live')) {
        console.error(`[Live Match Diagnostic] Request Failed:`, {
          status: error.response?.status,
          message: error.message,
          url: error.config.url
        });
      }
      return Promise.reject(error);
    }
  );
};
