const fs = require('fs');
const path = require('path');

// Patch worldCupService.ts
let file = path.join(__dirname, 'src/services/worldCupService.ts');
let code = fs.readFileSync(file, 'utf8');

code = "import { worldCupRepositoryV2 } from '../core/repository/WorldCupRepositoryV2';\n" + code;
code = code.replace(/import \{.*?\} from 'firebase\/firestore';/, "");

code = code.replace(/await addDoc\(collection\(db, 'system_logs'\), \{([\s\S]*?)\}\);/g, "await worldCupRepositoryV2.addSystemLog({$1});");

code = code.replace(/const snap = await getDocs\(query\(collection\(db, 'cms_match_overrides'\), limit\(100\)\)\);\n\s*snap\.forEach\(\(doc: any\) => \{\n\s*overrides\[doc\.id\] = doc\.data\(\);\n\s*\}\);/g, "overrides = await worldCupRepositoryV2.getCmsMatchOverrides();");

code = code.replace(/const snap = await getDocs\(query\(collection\(db, 'cms_teams'\), limit\(100\)\)\);\n\s*snap\.forEach\(\(doc: any\) => \{\n\s*teamOverrides\[doc\.id\] = doc\.data\(\);\n\s*\}\);/g, "teamOverrides = await worldCupRepositoryV2.getCmsTeams();");

fs.writeFileSync(file, code);

// Patch worldCupConfigService.ts
file = path.join(__dirname, 'src/services/worldCupConfigService.ts');
if (fs.existsSync(file)) {
  code = fs.readFileSync(file, 'utf8');
  code = "import { worldCupRepositoryV2 } from '../core/repository/WorldCupRepositoryV2';\n" + code;
  code = code.replace(/import \{.*?\} from 'firebase\/firestore';/, "");
  
  code = code.replace(/const docRef = doc\(db, 'worldcup_configs', year\.toString\(\)\);\n\s*const snap = await getDoc\(docRef\);\n\s*if \(snap\.exists\(\)\) \{\n\s*return snap\.data\(\) as WorldCupConfig;\n\s*\}/g, "const data = await worldCupRepositoryV2.getConfig(year);\n      if (data) {\n        return data as WorldCupConfig;\n      }");
  
  code = code.replace(/const docRef = doc\(db, 'worldcup_configs', year\.toString\(\)\);\n\s*return onSnapshot\(docRef, \(snap\) => \{\n\s*if \(snap\.exists\(\)\) \{\n\s*callback\(snap\.data\(\) as WorldCupConfig\);\n\s*\}\n\s*\}\);/g, "return worldCupRepositoryV2.subscribeConfig(year, (data) => callback(data as WorldCupConfig));");
  
  fs.writeFileSync(file, code);
}
