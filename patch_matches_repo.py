import re

file = 'src/core/repository/MatchesRepositoryV2.ts'
with open(file, 'r') as f:
    code = f.read()

replacement = """
  async getDocRaw(id: string) {
    return await getDoc(doc(db, 'matches', id));
  }

  async setDocRaw(id: string, data: any) {
    return await setDoc(doc(db, 'matches', id), data);
  }
"""

code = code.replace("export class MatchesRepositoryV2 extends BaseRepository {", "export class MatchesRepositoryV2 extends BaseRepository {\n" + replacement)

with open(file, 'w') as f:
    f.write(code)
