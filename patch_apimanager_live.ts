import fs from 'fs';

const filePath = 'core-engine/infrastructure/adapters/ApiManagerAdapter.ts';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
    /targetUrl = \`https:\/\/www.thesportsdb.com\/api\/v1\/json\/\$\{key\}\/latestschedule.php\`;/,
    "const todayStr = new Date().toISOString().split('T')[0];\n            targetUrl = `https://www.thesportsdb.com/api/v1/json/${key}/eventsday.php?d=${todayStr}`;"
);

// We should also make sure response fetching safely handles HTML just in case
const tryCatch = `
    try {
        const data = JSON.parse(text);
        if (selected.provider === 'TheSportsDB') {
            return { data: { response: data.events || data.results || [] }, targetProviderName: selected.provider };
        }
        return { data, targetProviderName: selected.provider };
    } catch (e) {
        console.error(\`[ApiManagerAdapter] JSON Parse Error. Start of response: \${text.substring(0, 100)}\`);
        // Instead of throwing, let's gracefully return empty to not crash shadow validation
        return { data: { response: [] }, targetProviderName: selected.provider };
    }
`;

content = content.replace(/try \{[\s\S]*?throw e;\s*\}/, tryCatch.trim());

fs.writeFileSync(filePath, content);
console.log('Patched latestschedule -> eventsday, and graceful catch.');
