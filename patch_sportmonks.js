const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/services/sportMonksService.ts');
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/import axios from 'axios';/g, "import apiClient from '../api/apiClient';");
code = code.replace(/const BASE_URL = 'https:\/\/api.sportmonks.com\/v3';/g, "");
code = code.replace(/function getApiKey\(\)[\s\S]*?}/g, "");
code = code.replace(/async function fetchSportMonks[\s\S]*?return response.data;\n}/g, `
async function fetchSportMonks(endpoint: string, params: Record<string, string> = {}): Promise<any> {
  const queryParams = new URLSearchParams(params);
  const url = \`/football-api/\${endpoint}?\${queryParams.toString()}\`;
  const response = await apiClient.get(url, {
    headers: {
      'x-api-category': 'matches',
      'x-api-provider': 'SportMonks'
    }
  });
  return response.data;
}
`);

fs.writeFileSync(file, code);
