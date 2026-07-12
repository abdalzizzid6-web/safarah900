import { userRepositoryV2 } from '../core/repository/UserRepositoryV2';
import { UserAccount, UserRole } from '../types';
import { User as FirebaseUser } from 'firebase/auth';

let usersCache: { data: UserAccount[]; timestamp: number } | null = null;
let usersCacheTimestamp = 0;
const USERS_CACHE_TTL = 60 * 60 * 1000; // 1 hour

export const userService = {
  async getOrCreateUserProfile(firebaseUser: FirebaseUser): Promise<UserAccount> {
    const cachedKey = `safera_90_profile_${firebaseUser.uid}`;
    try {
      const userDocSnap = await userRepositoryV2.getDocRaw(firebaseUser.uid);
      if (userDocSnap && userDocSnap.exists()) {
        const data = userDocSnap.data() as UserAccount;
        
        // Auto-upgrade specified core admin
        if (firebaseUser.email === 'abdalziz2022@gmail.com' && data.role !== UserRole.SUPER_ADMIN) {
          try {
            await userRepositoryV2.updateUser(firebaseUser.uid, { role: UserRole.SUPER_ADMIN });
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
          await userRepositoryV2.setDocRaw(firebaseUser.uid, newProfile);
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
      await userRepositoryV2.updateLastLogin(uid);
    } catch (err) {
      console.warn('[userService] Failed to update last login timestamp:', err);
    }
  },

  async updateProfile(uid: string, updates: Partial<UserAccount>) {
    await userRepositoryV2.updateUser(uid, updates);
  },

  async toggleVip(uid: string, isVip: boolean, expiryDays: number = 30) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);
    
    await userRepositoryV2.updateUser(uid, {
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
      return (usersCache as any).data;
    }
    try {
      const data = await userRepositoryV2.getAllUsers(50);
      
      // Update global/module cache
      (usersCache as any) = { data, timestamp: now };
      usersCacheTimestamp = now;
      return data as UserAccount[];
    } catch (e) {
      return [];
    }
  }
};
