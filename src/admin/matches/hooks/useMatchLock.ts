import { useState, useEffect, useCallback } from 'react';
import { matchEnterpriseService, MatchLock } from '../services/matchEnterpriseService';
import { auth } from '@/src/firebase';

export function useMatchLock(matchId: string | null) {
  const [lock, setLock] = useState<MatchLock | null>(null);
  const [isLockedByMe, setIsLockedByMe] = useState(false);
  const [isLockedByOther, setIsLockedByOther] = useState(false);
  const [loading, setLoading] = useState(false);

  const acquireLock = useCallback(async () => {
    if (!matchId) return;
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    try {
      const result = await matchEnterpriseService.acquireLock(
        matchId, 
        user.uid, 
        user.displayName || user.email || 'Admin'
      );

      if (result.success) {
        setIsLockedByMe(true);
        setIsLockedByOther(false);
        setLock({
          matchId,
          userId: user.uid,
          userName: user.displayName || user.email || 'Admin',
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          editingSince: new Date()
        });
      } else {
        setIsLockedByMe(false);
        setIsLockedByOther(true);
        setLock(result.lock as any);
      }
    } catch (err) {
      console.error('Failed to acquire lock:', err);
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  const releaseLock = useCallback(async () => {
    if (!matchId) return;
    const user = auth.currentUser;
    if (!user) return;

    try {
      await matchEnterpriseService.releaseLock(matchId, user.uid);
      setIsLockedByMe(false);
      setLock(null);
    } catch (err) {
      console.error('Failed to release lock:', err);
    }
  }, [matchId]);

  useEffect(() => {
    if (matchId) {
      acquireLock();
      
      // Refresh lock every 4 minutes
      const interval = setInterval(acquireLock, 4 * 60 * 1000);
      return () => {
        clearInterval(interval);
        releaseLock();
      };
    } else {
      setIsLockedByMe(false);
      setIsLockedByOther(false);
      setLock(null);
    }
  }, [matchId, acquireLock, releaseLock]);

  return { lock, isLockedByMe, isLockedByOther, loading, acquireLock, releaseLock };
}
