const fs = require('fs');
const file = 'src/admin/shared/TeamsManager.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("import { useToast } from '../../hooks/useToast';", "import { useError } from '../../context/ErrorContext';");
content = content.replace("const { showToast } = useToast();", "const { showToast } = useError();");
content = content.replace(/teamRepository\.saveTeam\(/g, "teamRepository.updateTeam(");

fs.writeFileSync(file, content);
