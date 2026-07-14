const fs = require('fs');
const file = '/app/applet/server/routes/admin.ts';
let content = fs.readFileSync(file, 'utf8');

const target = `// POST /api-management/test-key
// Direct server diagnostics endpoint to ping actual sports APIs with a given key
router.post("/api-management/test-key", authMiddleware('admin'), async (req, res) => {
    try {
        const body = req.body || {};
        const { provider, key } = body;

        if (!provider || !key) {
            return res.status(400).json({ error: true, message: "المزود والمفتاح مطلوبان للفحص" });
        }

        let testUrl = '';
        const headers: Record<string, string> = { 'Accept': 'application/json' };

        if (provider === 'API-Football') {
            const isApiSports = key.length === 32;
            const isRapidApiFootball = key.length === 50;

            if (isApiSports) {
                testUrl = 'https://v3.football.api-sports.io/status';
                headers['x-apisports-key'] = key;
            } else if (isRapidApiFootball) {
                testUrl = 'https://api-football-v1.p.rapidapi.com/v3/status';
                headers['X-RapidAPI-Key'] = key;
                headers['X-RapidAPI-Host'] = 'api-football-v1.p.rapidapi.com';
            } else {
                testUrl = 'https://free-api-live-football-data.p.rapidapi.com/v3/status';
                headers['X-RapidAPI-Key'] = key;
                headers['X-RapidAPI-Host'] = 'free-api-live-football-data.p.rapidapi.com';
            }
        } else if (provider === 'SportMonks') {
            testUrl = 'https://api.sportmonks.com/v3/sports';
            headers['Authorization'] = key;
        } else if (provider === 'TheSportsDB') {
            testUrl = \`https://www.thesportsdb.com/api/v1/json/\${key}/all_sports.php\`;
        } else {
            testUrl = 'https://api-football-v1.p.rapidapi.com/v3/status';
        }

        const start = Date.now();
        const testRes = await fetch(testUrl, { method: 'GET', headers });
        const latency = Date.now() - start;

        const contentType = testRes.headers.get("content-type") || "";
        const bodyText = await testRes.text();`;

const replacement = `// POST /api-management/test-key
// Direct server diagnostics endpoint to ping actual sports APIs with a given key
router.post("/api-management/test-key", authMiddleware('admin'), async (req, res) => {
    try {
        const body = req.body || {};
        const { provider, key } = body;
        
        console.log(\`[Admin API Test Route] Received test request for provider: \${provider}\`);
        console.log(\`[Admin API Test Route] Auth Header presence: \${!!req.headers.authorization}\`);

        if (!provider || !key) {
            return res.status(400).json({ error: true, message: "المزود والمفتاح مطلوبان للفحص" });
        }

        let testUrl = '';
        const headers: Record<string, string> = { 'Accept': 'application/json' };

        if (provider === 'API-Football') {
            const isApiSports = key.length === 32;
            const isRapidApiFootball = key.length === 50;
            
            console.log(\`[Admin API Test Route] Testing API-Football. Key length: \${key.length}\`);

            if (isApiSports) {
                testUrl = 'https://v3.football.api-sports.io/status';
                headers['x-apisports-key'] = key;
            } else if (isRapidApiFootball) {
                testUrl = 'https://api-football-v1.p.rapidapi.com/v3/status';
                headers['X-RapidAPI-Key'] = key;
                headers['X-RapidAPI-Host'] = 'api-football-v1.p.rapidapi.com';
            } else {
                testUrl = 'https://free-api-live-football-data.p.rapidapi.com/v3/status';
                headers['X-RapidAPI-Key'] = key;
                headers['X-RapidAPI-Host'] = 'free-api-live-football-data.p.rapidapi.com';
            }
        } else if (provider === 'SportMonks') {
            testUrl = 'https://api.sportmonks.com/v3/sports';
            headers['Authorization'] = key;
            console.log(\`[Admin API Test Route] Testing SportMonks. Key length: \${key.length}\`);
        } else if (provider === 'TheSportsDB') {
            testUrl = \`https://www.thesportsdb.com/api/v1/json/\${key}/all_sports.php\`;
            console.log(\`[Admin API Test Route] Testing TheSportsDB. Key length: \${key.length}\`);
        } else {
            testUrl = 'https://api-football-v1.p.rapidapi.com/v3/status';
        }

        const start = Date.now();
        const testRes = await fetch(testUrl, { method: 'GET', headers });
        const latency = Date.now() - start;
        
        console.log(\`[Admin API Test Route] Provider \${provider} responded with status: \${testRes.status} in \${latency}ms\`);

        const contentType = testRes.headers.get("content-type") || "";
        const bodyText = await testRes.text();`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
console.log('Patched admin.ts');
