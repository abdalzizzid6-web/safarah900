import re
import os

file = 'src/services/worldCupService.ts'
with open(file, 'r') as f:
    code = f.read()

code = "import { worldCupRepositoryV2 } from '../core/repository/WorldCupRepositoryV2';\n" + code
code = re.sub(r"import \{.*?\} from 'firebase/firestore';", "", code)

code = re.sub(r"await addDoc\(collection\(db, 'system_logs'\), \{([\s\S]*?)\}\);", r"await worldCupRepositoryV2.addSystemLog({\1});", code)

code = re.sub(r"const snap = await getDocs\(query\(collection\(db, 'cms_match_overrides'\), limit\(100\)\)\);\n\s*snap\.forEach\(\(doc: any\) => \{\n\s*overrides\[doc\.id\] = doc\.data\(\);\n\s*\}\);", "const fetchedOverrides = await worldCupRepositoryV2.getCmsMatchOverrides();\n        Object.assign(overrides, fetchedOverrides);", code)

code = re.sub(r"const snap = await getDocs\(query\(collection\(db, 'cms_teams'\), limit\(100\)\)\);\n\s*snap\.forEach\(\(doc: any\) => \{\n\s*teamOverrides\[doc\.id\] = doc\.data\(\);\n\s*\}\);", "const fetchedTeams = await worldCupRepositoryV2.getCmsTeams();\n        Object.assign(teamOverrides, fetchedTeams);", code)

with open(file, 'w') as f:
    f.write(code)

file2 = 'src/services/worldCupConfigService.ts'
if os.path.exists(file2):
    with open(file2, 'r') as f:
        code = f.read()
    
    code = "import { worldCupRepositoryV2 } from '../core/repository/WorldCupRepositoryV2';\n" + code
    code = re.sub(r"import \{.*?\} from 'firebase/firestore';", "", code)
    
    code = re.sub(r"const docRef = doc\(db, 'worldcup_configs', year\.toString\(\)\);\n\s*const snap = await getDoc\(docRef\);\n\s*if \(snap\.exists\(\)\) \{\n\s*return snap\.data\(\) as WorldCupConfig;\n\s*\}", "const data = await worldCupRepositoryV2.getConfig(year);\n      if (data) {\n        return data as WorldCupConfig;\n      }", code)
    
    code = re.sub(r"const docRef = doc\(db, 'worldcup_configs', year\.toString\(\)\);\n\s*return onSnapshot\(docRef, \(snap\) => \{\n\s*if \(snap\.exists\(\)\) \{\n\s*callback\(snap\.data\(\) as WorldCupConfig\);\n\s*\}\n\s*\}\);", "return worldCupRepositoryV2.subscribeConfig(year, (data) => callback(data as WorldCupConfig));", code)
    
    with open(file2, 'w') as f:
        f.write(code)
