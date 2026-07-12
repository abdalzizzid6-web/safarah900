import re

# Add setFollow and unfollow to NotificationRepositoryV2
file = 'src/core/repository/NotificationRepositoryV2.ts'
with open(file, 'r') as f:
    code = f.read()

replacement = """
  async setFollow(uid: string, matchId: string, data: any) {
    const followRef = doc(db, `users/${uid}/followed_matches/${matchId}`);
    return await setDoc(followRef, data);
  }

  async unfollow(uid: string, matchId: string) {
    const followRef = doc(db, `users/${uid}/followed_matches/${matchId}`);
    return await setDoc(followRef, { active: false }, { merge: true });
  }
"""
if "setFollow" not in code:
    code = code.replace("export const notificationRepositoryV2", replacement + "\nexport const notificationRepositoryV2")
    with open(file, 'w') as f:
        f.write(code)

# Add setConfig to WorldCupRepositoryV2
file = 'src/core/repository/WorldCupRepositoryV2.ts'
with open(file, 'r') as f:
    code = f.read()

replacement2 = """
  async setConfig(year: number, config: any) {
    const docRef = doc(db, 'worldcup_configs', year.toString());
    return await setDoc(docRef, config);
  }
"""
if "setConfig" not in code:
    code = code.replace("export const worldCupRepositoryV2", replacement2 + "\nexport const worldCupRepositoryV2")
    with open(file, 'w') as f:
        f.write(code)

