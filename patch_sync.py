import re

file = 'src/services/syncEngine.ts'
with open(file, 'r') as f:
    code = f.read()

code = "import { matchesRepositoryV2 } from '../core/repository/MatchesRepositoryV2';\n" + code
code = re.sub(r"import \{.*?\} from 'firebase/firestore';", "", code)

code = re.sub(r"const matchRef = doc\(db, 'matches', matchId\);\n\s*// Check if exists\n\s*const existingDoc = await getDoc\(matchRef\);", "const existingDoc = await matchesRepositoryV2.getDocRaw(matchId);", code)

code = re.sub(r"await setDoc\(matchRef, matchToSave\);", "await matchesRepositoryV2.setDocRaw(matchId, matchToSave);", code)

with open(file, 'w') as f:
    f.write(code)
