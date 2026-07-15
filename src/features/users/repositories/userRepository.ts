import { doc, onSnapshot, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../../firebase';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role: string;
  notifiedMatches?: string[];
  favoriteTeamIds?: string[];
  favoriteLeagues?: string[];
}

export const subscribeToUserProfile = (uid: string, callback: (profile: UserProfile | null) => void) => {
  if (!uid || uid === 'undefined') {
    callback(null);
    return () => {};
  }
  const docRef = doc(db, 'users', uid);
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ uid: snapshot.id, ...snapshot.data() } as UserProfile);
    } else {
      callback(null);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    callback(null);
  });
};

// Let's implement caching
let userProfileCache: Record<string, { profile: UserProfile | null; timestamp: number }> = {};
const STORAGE_PREFIX = "safara90_users_profile_";

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  if (!uid || uid === 'undefined') {
    return null;
  }
  const cacheKey = STORAGE_PREFIX + uid;
  const now = Date.now();
  
  // 1. Check in-memory cache first
  if (userProfileCache[uid] && (now - userProfileCache[uid].timestamp < 5 * 60 * 1000)) {
    return userProfileCache[uid].profile;
  }

  // 2. Check localStorage cache
  try {
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      userProfileCache[uid] = parsed;
      return parsed.profile;
    }
  } catch (e) {
    console.error('[userRepository] Failed to read from local storage cache:', e);
  }

  // 3. Fallback to Firestore
  try {
    const docRef = doc(db, 'users', uid);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = { uid: snapshot.id, ...snapshot.data() } as UserProfile;
      userProfileCache[uid] = { profile: data, timestamp: now };
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ profile: data, timestamp: now }));
      } catch (e) {}
      return data;
    }
    userProfileCache[uid] = { profile: null, timestamp: now };
    return null;
  } catch (error) {
    console.error('[userRepository] Error getting user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
  try {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('[userRepository] Error updating user profile:', error);
    throw error;
  }
};

export const createUserProfile = async (uid: string, profile: UserProfile) => {
  try {
    const docRef = doc(db, 'users', uid);
    await setDoc(docRef, {
      ...profile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('[userRepository] Error creating user profile:', error);
    throw error;
  }
};
