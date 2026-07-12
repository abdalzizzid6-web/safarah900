import re

file = 'src/services/dataSourceService.ts'
with open(file, 'r') as f:
    code = f.read()

code = "import { settingsRepositoryV2 } from '../core/repository/SettingsRepositoryV2';\n" + code
code = re.sub(r"import \{.*?\} from 'firebase/firestore';", "", code)

code = re.sub(r"const docRef = doc\(db, 'settings', 'data_sources'\);\n\s*const docSnap = await getDoc\(docRef\);\n\s*if \(docSnap\.exists\(\)\) \{\n\s*const data = docSnap\.data\(\) as DataSourceSettings;", "const data = await settingsRepositoryV2.getDataSourceSettings();\n      if (data) {", code)

code = re.sub(r"const docRef = doc\(db, 'settings', 'data_sources'\);\n\s*await setDoc\(docRef, settings\);", "await settingsRepositoryV2.saveDataSourceSettings(settings);", code)

with open(file, 'w') as f:
    f.write(code)
