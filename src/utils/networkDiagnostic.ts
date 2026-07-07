/**
 * SAFARA 90 - Network Diagnostic Utility
 * Logs the lifecycle of critical API requests to identify caching or data drop issues.
 */

export const networkDiagnostic = {
  logRequest: (url: string, options: any = {}) => {
    if (!url.includes('/api/matches/live')) return;
    
    const requestId = Math.random().toString(36).substring(7);
    const timestamp = new Date().toISOString();
    
    console.group(`[Network Diagnostic] 🚀 Request ${requestId}`);
    console.log(`URL: ${url}`);
    console.log(`Timestamp: ${timestamp}`);
    console.log(`Method: ${options.method || 'GET'}`);
    console.log(`Headers:`, options.headers || {});
    console.groupEnd();
    
    return requestId;
  },

  logResponse: async (requestId: string, response: Response | any, isAxios: boolean = false) => {
    const timestamp = new Date().toISOString();
    
    console.group(`[Network Diagnostic] ✅ Response ${requestId}`);
    console.log(`Timestamp: ${timestamp}`);
    
    if (isAxios) {
      // Axios Response
      console.log(`Status: ${response.status} ${response.statusText}`);
      console.log(`Server Request ID: ${response.headers?.['x-request-id'] || 'N/A'}`);
      console.log(`Server Data Source: ${response.headers?.['x-data-source'] || 'N/A'}`);
      console.log(`Server Latency: ${response.headers?.['x-latency-ms'] || 'N/A'}ms`);
      console.log(`Match Count Header: ${response.headers?.['x-match-count'] || 'N/A'}`);
      console.log(`Data Type: ${typeof response.data}`);
      if (Array.isArray(response.data)) {
        console.log(`Actual Matches Count: ${response.data.length}`);
        if (response.data.length > 0) {
          console.log(`First Match Sample:`, response.data[0]);
        }
      } else {
        console.warn(`Data is NOT an array:`, response.data);
      }
    } else if (response instanceof Response) {
      // Native Fetch Response
      console.log(`Status: ${response.status} ${response.statusText}`);
      console.log(`Type: ${response.type}`); // 'basic', 'cors', 'error', 'opaque', 'opaqueredirect'
      
      // Log custom headers from server
      console.log(`Server Request ID: ${response.headers.get('x-request-id') || 'N/A'}`);
      console.log(`Server Data Source: ${response.headers.get('x-data-source') || 'N/A'}`);
      console.log(`Server Latency: ${response.headers.get('x-latency-ms') || 'N/A'}ms`);
      console.log(`Match Count Header: ${response.headers.get('x-match-count') || 'N/A'}`);
      
      // Check if it came from Service Worker
      const fromSW = response.headers.get('x-serviceworker-cache');
      console.log(`From SW Cache: ${fromSW || 'No'}`);
      
      try {
        const clonedResponse = response.clone();
        const data = await clonedResponse.json();
        console.log(`Matches Count: ${Array.isArray(data) ? data.length : 'N/A'}`);
      } catch (e) {
        console.log(`Could not parse JSON from response body`);
      }
    }
    
    console.groupEnd();
  },

  logError: (requestId: string, error: any) => {
    console.group(`[Network Diagnostic] ❌ Error ${requestId}`);
    console.error(`Message: ${error.message}`);
    console.error(`Stack:`, error.stack);
    if (error.response) {
      console.log(`Response Status: ${error.response.status}`);
      console.log(`Response Data:`, error.response.data);
    }
    console.groupEnd();
  }
};
