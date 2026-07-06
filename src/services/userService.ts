import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { UserAccount, UserRole } from '../types';
import { User as FirebaseUser } from 'firebase/auth';

let usersCache: { data: UserAccount[]; timestamp: number } | null = null;
let usersCacheTimestamp = 0;
const USERS_CACHE_TTL = 60 * 60 * 1000; // 1 hour

export const userService = {
  async getOrCreateUserProfile(firebaseUser: FirebaseUser): Promise<UserAccount> {
    const cachedKey = `safera_90_profile_${firebaseUser.uid}`;
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const data = userDocSnap.data() as UserAccount;
        
        // Auto-upgrade specified core admin
        if (firebaseUser.email === 'abdalziz2022@gmail.com' && data.role !== UserRole.SUPER_ADMIN) {
          try {
            await updateDoc(userDocRef, { role: UserRole.SUPER_ADMIN });
            data.role = UserRole.SUPER_ADMIN;
          } catch (upgErr) {
            console.warn('[userService] Failed to auto-upgrade to SUPER_ADMIN, using local state.', upgErr);
            data.role = UserRole.SUPER_ADMIN;
          }
        }
        
        localStorage.setItem(cachedKey, JSON.stringify(data));
        return data;
      } else {
        // Create new profile
        const isSuperAdmin = firebaseUser.email === 'abdalziz2022@gmail.com';
        const newProfile: UserAccount = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'User',
          photoURL: firebaseUser.photoURL || '',
          role: isSuperAdmin ? UserRole.SUPER_ADMIN : UserRole.USER,
          isVip: false,
          notificationsEnabled: true,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
        
        try {
          await setDoc(userDocRef, newProfile);
        } catch (setErr) {
          console.warn('[userService] Failed to setDoc for new profile, using local object.', setErr);
        }
        localStorage.setItem(cachedKey, JSON.stringify(newProfile));
        return newProfile;
      }
    } catch (err: any) {
      const isQuota = err?.message?.toLowerCase().includes('quota') || 
                      err?.message?.toLowerCase().includes('exhausted') || 
                      err?.code === 'resource-exhausted';
      
      if (isQuota) {
        console.warn('[userService] Quota exceeded. Attempting to load user profile from local storage.');
      } else {
        console.error('[userService] Error loading profile, using local fallback:', err);
      }
      
      const cached = localStorage.getItem(cachedKey);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (_) {}
      }
      
      // Complete fallback
      const isSuperAdmin = firebaseUser.email === 'abdalziz2022@gmail.com';
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || 'مشجع غالي',
        photoURL: firebaseUser.photoURL || '',
        role: isSuperAdmin ? UserRole.SUPER_ADMIN : UserRole.USER,
        isVip: false,
        notificationsEnabled: true,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
    }
  },

  async updateLastLogin(uid: string) {
    try {
      const userDocRef = doc(db, 'users', uid);
      await updateDoc(userDocRef, { lastLogin: new Date().toISOString() });
    } catch (err) {
      console.warn('[userService] Failed to update last login timestamp:', err);
    }
  },

  async updateProfile(uid: string, updates: Partial<UserAccount>) {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, { ...updates, updatedAt: new Date().toISOString() });
  },

  async toggleVip(uid: string, isVip: boolean, expiryDays: number = 30) {
    const userDocRef = doc(db, 'users', uid);
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);
    
    await updateDoc(userDocRef, {
      isVip,
      role: isVip ? UserRole.VIP_USER : UserRole.USER,
      vipExpiry: isVip ? expiryDate.toISOString() : null
    });
  },

  // Role check helper (can be used server-side or in security rules)
  hasPermission(currentRole: UserRole, requiredRole: UserRole): boolean {
    const weights: Record<UserRole, number> = {
      [UserRole.SUPER_ADMIN]: 100,
      [UserRole.ADMIN]: 80,
      [UserRole.EDITOR]: 60,
      [UserRole.MODERATOR]: 40,
      [UserRole.AUTHOR]: 20,
      [UserRole.VIP_USER]: 10,
      [UserRole.USER]: 0
    };
    
    return weights[currentRole] >= weights[requiredRole];
  },

  async getAllUsers(): Promise<UserAccount[]> {
    const now = Date.now();
    if (usersCache && now - usersCacheTimestamp < USERS_CACHE_TTL) {
      return usersCache.data;
    }

    try {
      const q = query(collection(db, 'users'), limit(50));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserAccount));
      
      // Update global/module cache
      (usersCache as any) = { data, timestamp: now };
      usersCacheTimestamp = now;

      return data;
    } catch (e) {
      return [];
    }
  }
};
