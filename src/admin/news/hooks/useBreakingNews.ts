import { useState, useEffect, useCallback } from 'react';
import { db } from '../../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { breakingNewsRepositoryV2 } from '../../../core/repository/BreakingNewsRepositoryV2';
import { featureFlags } from '../../../core/config/featureFlags';

const SETTINGS_DOC_PATH = 'news_settings/breaking_articles';

import { BreakingNewsFlash } from '../types/breakingNews';

export function useBreakingNews() {
  const queryClient = useQueryClient();
  const [breakingFlashes, setBreakingFlashes] = useState<BreakingNewsFlash[]>([]);
  const [loading, setLoading] = useState(true);

  // V2 implementation
  const { data: v2Flashes, isLoading: v2Loading, refetch: v2Refetch } = useQuery({
    queryKey: ['breakingNews'],
    queryFn: () => breakingNewsRepositoryV2.getFlashes(),
    enabled: featureFlags.useNewsV2,
    staleTime: 60 * 1000,
  });

  const saveMutation = useMutation({
    mutationFn: (flashes: BreakingNewsFlash[]) => breakingNewsRepositoryV2.saveFlashes(flashes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['breakingNews'] }),
  });

  // Legacy implementation
  const loadBreaking = useCallback(async () => {
    if (featureFlags.useNewsV2) return;
    try {
      const docRef = doc(db, SETTINGS_DOC_PATH);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setBreakingFlashes(snap.data().flashes || []);
      }
    } catch (err) {
      console.error('Error loading breaking news flashes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!featureFlags.useNewsV2) {
      loadBreaking();
    }
  }, [loadBreaking]);

  const saveBreakingFlashes = useCallback(async (flashes: BreakingNewsFlash[]) => {
    if (featureFlags.useNewsV2) {
      return await saveMutation.mutateAsync(flashes);
    }
    try {
      const docRef = doc(db, SETTINGS_DOC_PATH);
      await setDoc(docRef, { flashes }, { merge: true });
      setBreakingFlashes(flashes);
      return true;
    } catch (err) {
      console.error('Error saving breaking news flashes:', err);
      return false;
    }
  }, [saveMutation]);

  const flashes = featureFlags.useNewsV2 ? (v2Flashes || []) : breakingFlashes;
  const isLoading = featureFlags.useNewsV2 ? v2Loading : loading;

  const addBreakingFlash = useCallback(async (text: string, link?: string, durationHours = 24) => {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + durationHours);

    const newFlash: BreakingNewsFlash = {
      id: `break_${Date.now()}`,
      text,
      link,
      active: true,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString()
    };

    const nextList = [newFlash, ...flashes];
    return await saveBreakingFlashes(nextList);
  }, [flashes, saveBreakingFlashes]);

  const toggleFlashActive = useCallback(async (id: string) => {
    const nextList = flashes.map(f => f.id === id ? { ...f, active: !f.active } : f);
    return await saveBreakingFlashes(nextList);
  }, [flashes, saveBreakingFlashes]);

  const deleteFlash = useCallback(async (id: string) => {
    const nextList = flashes.filter(f => f.id !== id);
    return await saveBreakingFlashes(nextList);
  }, [flashes, saveBreakingFlashes]);

  return {
    breakingFlashes: flashes,
    loading: isLoading,
    addBreakingFlash,
    toggleFlashActive,
    deleteFlash,
    refresh: featureFlags.useNewsV2 ? v2Refetch : loadBreaking
  };
}
