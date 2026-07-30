import { startPerformanceTrace } from '@/firebase';
import { telemetry } from './telemetry';
import axios, { InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// Interfaces for Extended Axios Config with performance tracking
interface PerfAxiosRequestConfig extends InternalAxiosRequestConfig {
  _perfTrace?: any;
  _perfStartTime?: number;
  _perfEndpointName?: string;
}

/**
 * Tracks screen rendering time with Firebase Performance Monitoring custom trace.
 */
export const trackScreenRenderTime = (screenName: string, durationMs: number) => {
  const sanitizedName = screenName.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^_+|_+$/g, '');
  const traceName = `screen_render_${sanitizedName || 'home'}`;
  
  const trace = startPerformanceTrace(traceName);
  if (trace) {
    try {
      trace.putMetric('render_time_ms', Math.round(durationMs));
      trace.putAttribute('screen_name', screenName);
      trace.stop();
      console.log(`[Firebase Perf] Screen Render Trace logged: ${traceName} (${Math.round(durationMs)}ms)`);
    } catch (e) {
      console.warn(`[Firebase Perf] Failed to finalize screen trace ${traceName}:`, e);
    }
  }
};

/**
 * Tracks network request latency specifically for real-time football data and API endpoints.
 */
export const trackNetworkLatency = (
  endpoint: string, 
  durationMs: number, 
  statusCode: number = 200, 
  isFootballData: boolean = true
) => {
  const sanitizedEndpoint = endpoint.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^_+|_+$/g, '');
  const traceName = `net_${sanitizedEndpoint || 'api_call'}`;

  const trace = startPerformanceTrace(traceName);
  if (trace) {
    try {
      trace.putMetric('latency_ms', Math.round(durationMs));
      trace.putAttribute('endpoint', endpoint);
      trace.putAttribute('status_code', String(statusCode));
      trace.putAttribute('is_football_data', String(isFootballData));
      trace.stop();
      console.log(`[Firebase Perf] Network Latency Trace logged: ${traceName} (${Math.round(durationMs)}ms, Status: ${statusCode})`);
    } catch (e) {
      console.warn(`[Firebase Perf] Failed to finalize network trace ${traceName}:`, e);
    }
  }

  // Update central telemetry metrics
  telemetry.logResponseTime(Math.round(durationMs));
};

/**
 * Automatically identifies if an API URL corresponds to real-time football data.
 */
export const isFootballDataEndpoint = (url: string = ''): boolean => {
  const footballKeywords = [
    '/api/matches', 
    '/api/live', 
    '/api/standings', 
    '/api/leagues', 
    '/api/teams', 
    '/api/players', 
    '/api/football', 
    '/api/sync', 
    '/api/worldcup',
    '/api/ai'
  ];
  return footballKeywords.some(keyword => url.toLowerCase().includes(keyword));
};

/**
 * Initializes global Axios network performance monitoring interceptors.
 */
export const setupNetworkPerformanceInterceptor = () => {
  if (typeof window === 'undefined') return;

  // Intercept Request to start performance trace
  axios.interceptors.request.use(
    (config: PerfAxiosRequestConfig) => {
      if (config.url && (config.url.startsWith('/api/') || config.url.includes('/api/'))) {
        const urlObj = new URL(config.url, window.location.origin);
        const endpointName = urlObj.pathname.replace(/^\/api\//, '');
        const isFootball = isFootballDataEndpoint(config.url);

        config._perfStartTime = performance.now();
        config._perfEndpointName = endpointName;

        // Start Firebase trace for football data & API calls
        const traceName = `net_${isFootball ? 'fb_' : ''}${endpointName.replace(/[^a-zA-Z0-9_]/g, '_')}`;
        config._perfTrace = startPerformanceTrace(traceName);
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Intercept Response to finalize trace and log latency
  axios.interceptors.response.use(
    (response: AxiosResponse) => {
      const config = response.config as PerfAxiosRequestConfig;
      if (config._perfStartTime) {
        const durationMs = performance.now() - config._perfStartTime;
        const endpoint = config._perfEndpointName || 'unknown';
        const isFootball = isFootballDataEndpoint(config.url);
        const status = response.status || 200;

        if (config._perfTrace) {
          try {
            config._perfTrace.putMetric('latency_ms', Math.round(durationMs));
            config._perfTrace.putAttribute('status_code', String(status));
            config._perfTrace.putAttribute('is_football_data', String(isFootball));
            config._perfTrace.stop();
          } catch (e) {
            console.warn('[Firebase Perf] Error stopping request trace:', e);
          }
        }

        telemetry.logResponseTime(Math.round(durationMs));
      }
      return response;
    },
    (error) => {
      const config = (error.config || {}) as PerfAxiosRequestConfig;
      if (config._perfStartTime) {
        const durationMs = performance.now() - config._perfStartTime;
        const endpoint = config._perfEndpointName || 'unknown';
        const isFootball = isFootballDataEndpoint(config.url);
        const status = error.response?.status || 500;

        if (config._perfTrace) {
          try {
            config._perfTrace.putMetric('latency_ms', Math.round(durationMs));
            config._perfTrace.putAttribute('status_code', String(status));
            config._perfTrace.putAttribute('is_football_data', String(isFootball));
            config._perfTrace.putAttribute('error', 'true');
            config._perfTrace.stop();
          } catch (e) {
            console.warn('[Firebase Perf] Error stopping failed request trace:', e);
          }
        }

        telemetry.logResponseTime(Math.round(durationMs));
      }
      return Promise.reject(error);
    }
  );

  console.log('[Firebase Performance] Network latency interceptor attached for real-time football data.');
};
