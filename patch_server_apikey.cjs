const fs = require('fs');
const file = 'server/index.ts';
let content = fs.readFileSync(file, 'utf8');

const target = `app.post("/api/test-api-key", authMiddleware('editor'), async (req, res) => {
    const { provider, key } = req.body;`;

const replacement = `app.post("/api/test-api-key", authMiddleware('editor'), async (req, res) => {
    const { provider, key } = req.body;
    console.log('[API Key Test Request]', { provider, keyLength: key?.length });
    const cleanKey = typeof key === 'string' ? key.trim() : key;
`;

content = content.replace(target, replacement);
content = content.replace(/headers\['x-apisports-key'\] = key;/g, "headers['x-apisports-key'] = cleanKey;");
content = content.replace(/api_token=\$\{key\}/g, "api_token=${cleanKey}");
content = content.replace(/\$\{key \|\| '123'\}/g, "${cleanKey || '123'}");

fs.writeFileSync(file, content);
console.log('Patched server/index.ts');
