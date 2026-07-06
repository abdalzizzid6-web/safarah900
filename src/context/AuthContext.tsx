import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, User, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { UserAccount, UserRole } from '../types';
import { userService } from '../services/userService';

interface AuthContextType {
  user: User | null;
  profile: UserAccount | null;
  role: UserRole | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (requiredRole: UserRole) => boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  role: null,
  loading: true,
  signInWithGoogle: async () => {},
  logout: async () => {},
  hasPermission: () => false,
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const userProfile = await userService.getOrCreateUserProfile(u);
          setProfile(userProfile);
          await userService.updateLastLogin(u.uid);
        } catch (error) {
          console.error('[AuthContext] Error loading profile:', error);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error(e);
    }
  };

  const logout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
  };

  const hasPermission = (requiredRole: UserRole): boolean => {
    if (!profile) return false;
    return userService.hasPermission(profile.role, requiredRole);
  };

  const refreshProfile = async () => {
    const auth = getAuth();
    const u = auth.currentUser;
    if (u) {
      setLoading(true);
      try {
        const userProfile = await userService.getOrCreateUserProfile(u);
        setProfile(userProfile);
      } catch (error) {
        console.error('[AuthContext] Error refreshing profile:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      role: profile?.role || null, 
      loading, 
      signInWithGoogle, 
      logout,
      hasPermission,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
