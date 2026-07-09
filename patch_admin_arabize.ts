import fs from 'fs';

const filePath = 'server/routes/admin.ts';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/firestore\.collection\('league_settings'\)/g, "firestore.collection('cms_leagues')");
content = content.replace(/firestore\.collection\('team_settings'\)/g, "firestore.collection('cms_teams')");

fs.writeFileSync(filePath, content);
console.log('Patched collections to cms_leagues and cms_teams');
