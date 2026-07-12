import re
import os

def patch_file(filepath, replacements):
    if not os.path.exists(filepath):
        print(f"Skipping {filepath}, does not exist.")
        return
    with open(filepath, 'r') as f:
        content = f.read()
    
    for pattern, repl in replacements:
        content = re.sub(pattern, repl, content, flags=re.DOTALL)
        
    with open(filepath, 'w') as f:
        f.write(content)

patch_file('src/services/dataSourceService.ts', [
    (r"const docRef = doc\(db, 'settings', 'data_sources'\);\n\s*const docSnap = await getDoc\(docRef\);\n\s*if \(docSnap\.exists\(\)\) \{\n\s*const data = docSnap\.data\(\) as DataSourceSettings;", 
     "const data = await settingsRepositoryV2.getDataSourceSettings();\n      if (data) {"),
     (r"const docRef = doc\(db, 'settings', 'data_sources'\);\n\s*await setDoc\(docRef, settings\);",
     "await settingsRepositoryV2.saveDataSourceSettings(settings);")
])

patch_file('src/services/syncEngine.ts', [
    (r"const matchRef = doc\(db, 'matches', matchId\);\n\s*await setDoc\(matchRef, matchToSave, \{ merge: true \}\);",
     "await matchesRepositoryV2.setDocRaw(matchId, matchToSave);")
])

patch_file('src/services/worldCupService.ts', [
    (r"const snap = await getDocs\(query\(collection\(db, 'cms_match_overrides'\), limit\(100\)\)\);\n\s*snap\.forEach\(\(doc: any\) => \{\n\s*overrides\[doc\.id\] = doc\.data\(\);\n\s*\}\);",
     "const fetchedOverrides = await worldCupRepositoryV2.getCmsMatchOverrides();\n        Object.assign(overrides, fetchedOverrides);"),
    (r"const snap = await getDocs\(query\(collection\(db, 'cms_teams'\), limit\(100\)\)\);\n\s*snap\.forEach\(\(doc: any\) => \{\n\s*teamOverrides\[doc\.id\] = doc\.data\(\);\n\s*\}\);",
     "const fetchedTeams = await worldCupRepositoryV2.getCmsTeams();\n        Object.assign(teamOverrides, fetchedTeams);")
])

patch_file('src/services/notificationService.ts', [
    (r"const q = query\(collection\(db, 'fcm_tokens'\), where\('uid', '==', uid\)\);\n\s*const snap = await getDocs\(q\);",
     "const snap = await notificationRepositoryV2.getFCMTokens(uid);"),
    (r"const q = query\(\n\s*collection\(db, 'notifications'\),\n\s*where\('userId', '==', userId\),\n\s*orderBy\('createdAt', 'desc'\),\n\s*limit\(50\)\n\s*\);\n\s*return onSnapshot\(q, \(snap\) => \{",
     "return notificationRepositoryV2.subscribeToUserNotifications(userId, (snap) => {"),
    (r"const q = query\(\n\s*collection\(db, 'notifications'\),\n\s*where\('targetId', '==', targetId\),\n\s*where\('targetType', '==', targetType\)\n\s*\);\n\s*const snap = await getDocs\(q\);",
     "const snap = await notificationRepositoryV2.getNotificationsByTarget(targetId, targetType);"),
    (r"const followRef = doc\(db, `users/\$\{userId\}/followed_matches/\$\{matchId\}`\);\n\s*await setDoc\(followRef, \{([\s\S]*?)\}\);",
     r"await notificationRepositoryV2.setFollow(userId, matchId, {\1});"),
    (r"const followRef = doc\(db, `users/\$\{userId\}/followed_matches/\$\{matchId\}`\);\n\s*await setDoc\(followRef, \{ active: false \}, \{ merge: true \}\);",
     "await notificationRepositoryV2.unfollow(userId, matchId);"),
    (r"const followRef = doc\(db, `users/\$\{userId\}/followed_matches/\$\{matchId\}`\);\n\s*const snap = await getDoc\(followRef\);",
     "const snap = await notificationRepositoryV2.checkFollow(userId, matchId);")
])

patch_file('src/services/dashboardService.ts', [
    (r"const teamsQuery = query\(collection\(db, 'cms_teams'\), orderBy\('updatedAt', 'desc'\), limit\(5\)\);\n\s*const teamsSnapshot = await getDocs\(teamsQuery\);",
     "const teamsSnapshot = await dashboardRepositoryV2.getRecentTeams(5);"),
    (r"const playersQuery = query\(collection\(db, 'cms_players'\), orderBy\('updatedAt', 'desc'\), limit\(5\)\);\n\s*const playersSnapshot = await getDocs\(playersQuery\);",
     "const playersSnapshot = await dashboardRepositoryV2.getRecentPlayers(5);")
])

patch_file('src/services/worldCupConfigService.ts', [
    (r"const docRef = doc\(db, 'worldcup_configs', year\.toString\(\)\);\n\s*const snap = await getDoc\(docRef\);\n\s*if \(snap\.exists\(\)\) \{\n\s*return snap\.data\(\) as WorldCupConfig;\n\s*\}",
     "const data = await worldCupRepositoryV2.getConfig(year);\n      if (data) {\n        return data as WorldCupConfig;\n      }"),
    (r"const docRef = doc\(db, 'worldcup_configs', year\.toString\(\)\);\n\s*await setDoc\(docRef, config\);",
     "await worldCupRepositoryV2.setConfig(year, config);"),
    (r"const docRef = doc\(db, 'worldcup_configs', year\.toString\(\)\);\n\s*return onSnapshot\(docRef, \(snap\) => \{\n\s*if \(snap\.exists\(\)\) \{\n\s*callback\(snap\.data\(\) as WorldCupConfig\);\n\s*\}\n\s*\}\);",
     "return worldCupRepositoryV2.subscribeConfig(year, (data) => callback(data as WorldCupConfig));")
])

