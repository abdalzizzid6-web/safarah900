import re
with open('src/services/userService.ts', 'r') as f:
    code = f.read()

code = "import { userRepositoryV2 } from '../core/repository/UserRepositoryV2';\n" + code
code = re.sub(r"import \{[^}]*\} from 'firebase/firestore';", "", code)

code = re.sub(r"const userDocRef = doc\(db, 'users', uid\);\n\s*const userDocSnap = await getDoc\(userDocRef\);\n\s*if \(userDocSnap.exists\(\)\) \{\n\s*return userDocSnap.data\(\)\?.role as UserRole;\n\s*\}\n\s*return null;", "return await userRepositoryV2.getUserRole(uid) as UserRole;", code)
code = re.sub(r"const userDocRef = doc\(db, 'users', uid\);\n\s*const userDocSnap = await getDoc\(userDocRef\);\n\s*if \(userDocSnap.exists\(\)\) \{\n\s*if \(userDocSnap.data\(\)\.role !== UserRole.SUPER_ADMIN\) \{\n\s*await updateDoc\(userDocRef, \{ role: UserRole.SUPER_ADMIN \}\);\n\s*console.log\(`User \$\{email\} promoted to SUPER_ADMIN`\);\n\s*\}\n\s*\}\n", "await userRepositoryV2.ensureSuperAdmin(uid, email);\n", code)

code = re.sub(r"const userDocRef = doc\(db, 'users', uid\);\n\s*await updateDoc\(userDocRef, \{ lastLogin: new Date\(\).toISOString\(\) \}\);", "await userRepositoryV2.updateLastLogin(uid);", code)
code = re.sub(r"const userDocRef = doc\(db, 'users', uid\);\n\s*await updateDoc\(userDocRef, \{ \.\.\.updates, updatedAt: new Date\(\).toISOString\(\) \}\);", "await userRepositoryV2.updateUser(uid, updates);", code)

code = re.sub(r"const userDocRef = doc\(db, 'users', uid\);\n\s*await updateDoc\(userDocRef, \{\n\s*displayName: data.displayName,\n\s*photoURL: data.photoURL\n\s*\}\);", "await userRepositoryV2.updateProfile(uid, { displayName: data.displayName, photoURL: data.photoURL });", code)

code = re.sub(r"const q = query\(\n\s*collection\(db, 'users'\),\n\s*where\('email', '>=', searchQuery\),\n\s*where\('email', '<=', searchQuery \+ '\\\uf8ff'\)\n\s*\);\n\s*const snapshot = await getDocs\(q\);\n\s*return snapshot.docs.map\(doc => \(\{ uid: doc.id, \.\.\.doc.data\(\) \}\)\);", "return await userRepositoryV2.searchUsers(searchQuery);", code)

with open('src/services/userService.ts', 'w') as f:
    f.write(code)
