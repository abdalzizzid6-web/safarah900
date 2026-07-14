const fs = require('fs');
const file = 'src/admin/matches/components/MatchEditor.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("import { ILeague } from '../../../core/api-management/models/league.model';", "import { LeagueSettings } from '../../../types';");
content = content.replace("const [leagues, setLeagues] = useState<ILeague[]>([]);", "const [leagues, setLeagues] = useState<LeagueSettings[]>([]);");

fs.writeFileSync(file, content);
console.log('Patched MatchEditor.tsx');
