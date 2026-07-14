const fs = require('fs');
const file = 'src/main.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `  axios.interceptors.request.use(async (config) => {`;
const replacement = `  // 2. Axios Interceptors with Comprehensive Logging
  axios.interceptors.request.use(async (config) => {
    console.log('[Axios Request]', config.method?.toUpperCase(), config.url, 'Headers:', config.headers);
`;

const responseInterceptorTarget = `  }, (error) => {`;
const responseInterceptorReplacement = `  });

  axios.interceptors.response.use((response) => {
    console.log('[Axios Response]', response.config.method?.toUpperCase(), response.config.url, 'Status:', response.status);
    return response;
  }, (error) => {
    if (error.response) {
      console.error('[Axios Error Response]', error.config?.method?.toUpperCase(), error.config?.url, 'Status:', error.response.status, 'Data:', error.response.data);
    } else if (error.request) {
      console.error('[Axios Error Request]', error.config?.method?.toUpperCase(), error.config?.url, 'No response received');
    } else {
      console.error('[Axios Error]', error.message);
    }
`;

content = content.replace(target, replacement);
content = content.replace(responseInterceptorTarget, responseInterceptorReplacement);
fs.writeFileSync(file, content);
console.log('Patched main.tsx');
