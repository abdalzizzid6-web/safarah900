const fs = require('fs');
const file = 'src/admin/matches/components/MatchEditor.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace("leagueName: league.nameAR", "leagueName: league.name");
fs.writeFileSync(file, content);
