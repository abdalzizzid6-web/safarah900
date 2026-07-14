const fs = require('fs');
const file = 'src/admin/shared/TeamsManager.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/await repositories\.apiManagement\.teamRepository\.saveTeam\(newTeam\);/g, "await repositories.apiManagement.teamRepository.createTeam(newTeam);");
content = content.replace(/await repositories\.apiManagement\.teamRepository\.saveTeam\(editingTeam\);/g, "await repositories.apiManagement.teamRepository.updateTeam(editingTeam);");

fs.writeFileSync(file, content);
console.log('Patched TeamsManager.tsx');
