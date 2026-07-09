import fs from 'fs';

const filePath = 'core-engine/infrastructure/adapters/ApiManagerAdapter.ts';
let content = fs.readFileSync(filePath, 'utf8');

const sportsDbReplacement = `    } else if (selected.provider === 'TheSportsDB') {
        if (cleanPath.includes('date=')) {
            const date = cleanPath.split('date=')[1].split('&')[0];
            targetUrl = \`https://www.thesportsdb.com/api/v1/json/\${key}/eventsday.php?d=\${date}\`;
        } else if (cleanPath.includes('live=all')) {
            targetUrl = \`https://www.thesportsdb.com/api/v1/json/\${key}/latestschedule.php\`;
        } else if (cleanPath.startsWith('fixtures?id=')) {
            const id = cleanPath.split('id=')[1].split('&')[0];
            targetUrl = \`https://www.thesportsdb.com/api/v1/json/\${key}/lookupevent.php?id=\${id}\`;
        } else if (cleanPath.startsWith('standings')) {
            // e.g. standings?league=123&season=2025
            const urlParams = new URLSearchParams(cleanPath.split('?')[1] || '');
            const league = urlParams.get('league') || '';
            const season = urlParams.get('season') || '';
            targetUrl = \`https://www.thesportsdb.com/api/v1/json/\${key}/lookuptable.php?l=\${league}&s=\${season}\`;
        } else if (cleanPath.startsWith('fixtures/lineups')) {
            const fixture = cleanPath.split('fixture=')[1].split('&')[0];
            targetUrl = \`https://www.thesportsdb.com/api/v1/json/\${key}/lookuplineup.php?id=\${fixture}\`;
        } else if (cleanPath.startsWith('fixtures/statistics') || cleanPath.startsWith('fixtures/events')) {
            // Not well supported by TheSportsDB free tier, mock an empty response JSON structure
            targetUrl = ''; // We will handle this by returning empty response directly
            return { data: { response: [] }, targetProviderName: selected.provider };
        } else {
            targetUrl = \`https://www.thesportsdb.com/api/v1/json/\${key}/\${cleanPath}\`;
        }`;

content = content.replace(/\} else if \(selected\.provider === 'TheSportsDB'\) \{[\s\S]*?\} else if \(selected\.provider === 'SportMonks'\) \{/, sportsDbReplacement + "\n    } else if (selected.provider === 'SportMonks') {");

fs.writeFileSync(filePath, content);
console.log('Patched API manager adapter');
