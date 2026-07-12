import re

file = 'src/services/notificationService.ts'
with open(file, 'r') as f:
    code = f.read()

code = "import { notificationRepositoryV2 } from '../core/repository/NotificationRepositoryV2';\n" + code
code = re.sub(r"import \{.*?\} from 'firebase/firestore';", "", code)

code = re.sub(r"const q = query\(collection\(db, 'fcm_tokens'\), where\('uid', '==', uid\)\);\n\s*const snap = await getDocs\(q\);", "const snap = await notificationRepositoryV2.getFCMTokens(uid);", code)

code = re.sub(r"await addDoc\(tokensRef, \{([\s\S]*?)\}\);", r"await notificationRepositoryV2.addFCMToken({\1});", code)
code = re.sub(r"await updateDoc\(doc\(db, 'fcm_tokens', docId\), \{([\s\S]*?)\}\);", r"await notificationRepositoryV2.updateFCMToken(docId, {\1});", code)

code = re.sub(r"const q = query\(\n\s*collection\(db, 'notifications'\),\n\s*where\('userId', '==', userId\),\n\s*orderBy\('createdAt', 'desc'\),\n\s*limit\(50\)\n\s*\);\n\s*return onSnapshot\(q, \(snap\) => \{", "return notificationRepositoryV2.subscribeToUserNotifications(userId, (snap) => {", code)

code = re.sub(r"await updateDoc\(doc\(db, 'notifications', notificationId\), \{ isRead: true \}\);", "await notificationRepositoryV2.markAsRead(notificationId);", code)

code = re.sub(r"const q = query\(\n\s*collection\(db, 'notifications'\),\n\s*where\('targetId', '==', targetId\),\n\s*where\('targetType', '==', targetType\)\n\s*\);\n\s*const snap = await getDocs\(q\);", "const snap = await notificationRepositoryV2.getNotificationsByTarget(targetId, targetType);", code)

code = re.sub(r"const docRef = await addDoc\(collection\(db, 'notifications'\), notifData\);", "const docRef = await notificationRepositoryV2.addNotification(notifData);", code)

code = re.sub(r"await addDoc\(collection\(db, 'notification_history'\), \{([\s\S]*?)\}\);", r"await notificationRepositoryV2.addNotificationHistory({\1});", code)

code = re.sub(r"const followRef = doc\(db, `users/\$\{userId\}/followed_matches/\$\{matchId\}`\);\n\s*const snap = await getDoc\(followRef\);", "const snap = await notificationRepositoryV2.checkFollow(userId, matchId);", code)

with open(file, 'w') as f:
    f.write(code)
