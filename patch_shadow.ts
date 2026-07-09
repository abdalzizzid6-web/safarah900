import fs from 'fs';

const filePath = 'core-engine/application/services/ShadowValidationService.ts';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
    /const matchRate = \(\(legacy\.length - \(missingMatches \+ extraMatches\)\) \/ legacy\.length\) \* 100;/,
    "const matchRate = legacy.length > 0 ? ((legacy.length - (missingMatches + extraMatches)) / legacy.length) * 100 : 100;"
);

fs.writeFileSync(filePath, content);
console.log('Patched ShadowValidationService');
