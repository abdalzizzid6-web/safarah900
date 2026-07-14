const fs = require('fs');
const file = '/app/applet/src/api/apiClient.ts';
let content = fs.readFileSync(file, 'utf8');

const target1 = `apiClient.interceptors.request.use((config) => {
  const currentKey = getActiveApiKey();
  
  // Set accurate API authorization headers
  config.headers['x-rapidapi-key'] = currentKey;
  config.headers['x-apisports-key'] = currentKey;`;

const replacement1 = `apiClient.interceptors.request.use((config) => {
  const currentKey = getActiveApiKey();
  
  console.log(\`[apiClient Request] URL: \${config.baseURL || ''}\${config.url}\`);
  console.log(\`[apiClient Request] Using API Key (length: \${currentKey?.length || 0})\`);
  
  // Set accurate API authorization headers
  config.headers['x-rapidapi-key'] = currentKey;
  config.headers['x-apisports-key'] = currentKey;`;

const target2 = `apiClient.interceptors.response.use(
  (response) => {
    const logId = (response.config as any)._logId;
    const { data } = response;`;

const replacement2 = `apiClient.interceptors.response.use(
  (response) => {
    console.log(\`[apiClient Response] URL: \${response.config?.url} | Status: \${response.status}\`);
    const logId = (response.config as any)._logId;
    const { data } = response;`;

content = content.replace(target1, replacement1);
content = content.replace(target2, replacement2);
fs.writeFileSync(file, content);
console.log('Patched apiClient.ts');
