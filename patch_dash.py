import re

file = 'src/services/dashboardService.ts'
with open(file, 'r') as f:
    code = f.read()

code = "import { dashboardRepositoryV2 } from '../core/repository/DashboardRepositoryV2';\n" + code
code = re.sub(r"import \{.*?\} from 'firebase/firestore';", "", code)

code = re.sub(r"const snapshot = await getCountFromServer\(collection\(db, colInfo\.col\)\);\n\s*counts\[colInfo\.key\] = snapshot\.data\(\)\.count;", "counts[colInfo.key] = await dashboardRepositoryV2.getCollectionCount(colInfo.col);", code)

code = re.sub(r"const teamsQuery = query\(collection\(db, 'cms_teams'\), orderBy\('updatedAt', 'desc'\), limit\(5\)\);\n\s*const teamsSnapshot = await getDocs\(teamsQuery\);", "const teamsSnapshot = await dashboardRepositoryV2.getRecentTeams(5);", code)

code = re.sub(r"const playersQuery = query\(collection\(db, 'cms_players'\), orderBy\('updatedAt', 'desc'\), limit\(5\)\);\n\s*const playersSnapshot = await getDocs\(playersQuery\);", "const playersSnapshot = await dashboardRepositoryV2.getRecentPlayers(5);", code)

with open(file, 'w') as f:
    f.write(code)
