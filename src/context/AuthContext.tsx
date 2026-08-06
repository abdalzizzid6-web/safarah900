import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth as firebaseAuth } from '../firebase';
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
  useEffect(() => {
    console.log('[BOOT] Stage 7 OK: AuthProvider mounted');
  }, []);

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.error('[Provider Timeout] AuthProvider stayed loading more than 5 seconds!');
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    let isMounted = true;
    
    // Safety fallback timeout to guarantee loading becomes false within 3.5 seconds
    const fallbackTimer = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 3500);

    let unsubscribe = () => {};

    try {
      if (firebaseAuth) {
        unsubscribe = onAuthStateChanged(firebaseAuth, async (u) => {
          if (!isMounted) return;
          setUser(u);
          try {
            if (u) {
              const userProfile = await userService.getOrCreateUserProfile(u);
              if (isMounted) setProfile(userProfile);
              await userService.updateLastLogin(u.uid).catch(err => {
                console.warn('[AuthContext] Non-critical error updating last login:', err);
              });
            } else {
              if (isMounted) setProfile(null);
            }
          } catch (error) {
            console.error('[AuthContext] Error loading profile:', error);
          } finally {
            if (isMounted) {
              setLoading(false);
              clearTimeout(fallbackTimer);
            }
          }
        });
      } else {
        console.warn('[AuthContext] Firebase Auth is unavailable. Proceeding in guest mode.');
        if (isMounted) {
          setLoading(false);
        }
      }
    } catch (err) {
      console.warn('[AuthContext] Auth subscription failed, using fallback:', err);
      if (isMounted) {
        setLoading(false);
      }
    }

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      if (!firebaseAuth) {
        console.warn('[AuthContext] Cannot sign in: Auth is unavailable.');
        return;
      }
      const provider = new GoogleAuthProvider();
      await signInWithPopup(firebaseAuth, provider);
    } catch (e) {
      console.error(e);
    }
  };

  const logout = async () => {
    try {
      if (!firebaseAuth) return;
      await signOut(firebaseAuth);
    } catch (e) {
      console.error(e);
    }
  };

  const hasPermission = (requiredRole: UserRole): boolean => {
    if (!profile) return false;
    return userService.hasPermission(profile.role, requiredRole);
  };

  const refreshProfile = async () => {
    if (!firebaseAuth) return;
    const u = firebaseAuth.currentUser;
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
