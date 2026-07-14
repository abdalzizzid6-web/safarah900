const fs = require('fs');
const path = require('path');
const file = '/app/applet/server/index.ts';
let content = fs.readFileSync(file, 'utf8');

const target = `app.post("/api/test-api-key", authMiddleware('editor'), async (req, res) => {
    const { provider, key } = req.body;
    try {
        let url = '';
        const headers: Record<string, string> = { 'Accept': 'application/json' };
        if (provider === 'API-Football') {
            url = 'https://v3.football.api-sports.io/status';
            headers['x-apisports-key'] = key;
        } else if (provider === 'SportMonks') {
            url = \`https://api.sportmonks.com/v3/core/countries?api_token=\${key}\`;
        } else if (provider === 'TheSportsDB') {
            url = \`https://www.thesportsdb.com/api/v1/json/\${key || '123'}/all_leagues.php\`;
        } else {
            return res.status(400).json({ success: false, message: 'Invalid provider' });
        }

        const start = Date.now();
        const response = await fetch(url, { headers });
        const latency = Date.now() - start;
        const data = await response.json();

        if (response.ok) {
            if (provider === 'API-Football' && (!data.errors || Object.keys(data.errors).length === 0)) {
                return res.json({ success: true, message: \`API-Football Connection Successful!\`, latency, status: response.status });
            } else if (provider === 'SportMonks' && data.data) {
                return res.json({ success: true, message: \`SportMonks connection successful!\`, latency, status: response.status });
            } else if (provider === 'TheSportsDB' && data.leagues) {
                return res.json({ success: true, message: \`TheSportsDB connection successful!\`, latency, status: response.status });
            }
        }
        
        return res.status(response.status).json({ success: false, message: 'API connection failed', latency, status: response.status, data });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});`;

const replacement = `app.post("/api/test-api-key", authMiddleware('editor'), async (req, res) => {
    const { provider, key } = req.body;
    console.log(\`[API Test Route] Received test request for provider: \${provider}\`);
    console.log(\`[API Test Route] Auth Header presence: \${!!req.headers.authorization}\`);
    try {
        let url = '';
        const headers: Record<string, string> = { 'Accept': 'application/json' };
        if (provider === 'API-Football') {
            url = 'https://v3.football.api-sports.io/status';
            headers['x-apisports-key'] = key;
            console.log(\`[API Test Route] Testing API-Football. Key length: \${key?.length}\`);
        } else if (provider === 'SportMonks') {
            url = \`https://api.sportmonks.com/v3/core/countries?api_token=\${key}\`;
            console.log(\`[API Test Route] Testing SportMonks. Key length: \${key?.length}\`);
        } else if (provider === 'TheSportsDB') {
            url = \`https://www.thesportsdb.com/api/v1/json/\${key || '123'}/all_leagues.php\`;
            console.log(\`[API Test Route] Testing TheSportsDB. Key length: \${key?.length}\`);
        } else {
            console.warn(\`[API Test Route] Invalid provider: \${provider}\`);
            return res.status(400).json({ success: false, message: 'Invalid provider' });
        }

        const start = Date.now();
        const response = await fetch(url, { headers });
        const latency = Date.now() - start;
        
        console.log(\`[API Test Route] Provider \${provider} responded with status: \${response.status} in \${latency}ms\`);
        
        let data: any = {};
        const bodyText = await response.text();
        try {
            if (bodyText) {
                data = JSON.parse(bodyText);
            }
        } catch (e) {
            console.warn(\`[API Test Route] Failed to parse JSON response. Body preview:\`, bodyText.substring(0, 100));
        }

        if (response.ok) {
            if (provider === 'API-Football' && (!data.errors || Object.keys(data.errors).length === 0)) {
                return res.json({ success: true, message: \`API-Football Connection Successful!\`, latency, status: response.status });
            } else if (provider === 'SportMonks' && data.data) {
                return res.json({ success: true, message: \`SportMonks connection successful!\`, latency, status: response.status });
            } else if (provider === 'TheSportsDB' && data.leagues) {
                return res.json({ success: true, message: \`TheSportsDB connection successful!\`, latency, status: response.status });
            }
        }
        
        console.warn(\`[API Test Route] Validation failed. Status: \${response.status}, Errors:\`, data.errors || 'Unknown error');
        return res.status(response.status).json({ success: false, message: 'API connection failed', latency, status: response.status, data });
    } catch (err: any) {
        console.error(\`[API Test Route] Exception occurred:\`, err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
console.log('Patched index.ts');
