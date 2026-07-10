import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { featuredNewsRepositoryV2 } from '../../../core/repository/FeaturedNewsRepositoryV2';
import { featureFlags } from '../../../core/config/featureFlags';

export function useFeaturedNews() {
  const queryClient = useQueryClient();
  const [featuredIds, setFeaturedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // V2 implementation
  const { data: v2Ids, isLoading: v2Loading, refetch: v2Refetch } = useQuery({
    queryKey: ['featuredNews'],
    queryFn: () => featuredNewsRepositoryV2.getFeaturedIds(),
    enabled: featureFlags.useNewsV2,
    staleTime: 5 * 60 * 1000,
  });

  const toggleMutation = useMutation({
    mutationFn: (ids: string[]) => featuredNewsRepositoryV2.saveFeaturedIds(ids),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['featuredNews'] }),
  });

  // Legacy implementation
  const loadFeatured = useCallback(async () => {
    if (featureFlags.useNewsV2) return;
    try {
      const doc = await featuredNewsRepositoryV2.getById('featured_articles');
      if (doc) {
        setFeaturedIds(doc.ids || []);
      }
    } catch (err) {
      console.error('Error loading featured articles settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!featureFlags.useNewsV2) {
        loadFeatured();
    }
  }, [loadFeatured]);

  const toggleFeatured = useCallback(async (articleId: string) => {
    const currentIds = featureFlags.useNewsV2 ? (v2Ids || []) : featuredIds;
    const nextIds = currentIds.includes(articleId)
        ? currentIds.filter(id => id !== articleId)
        : [...currentIds, articleId];

    if (featureFlags.useNewsV2) {
       return await toggleMutation.mutateAsync(nextIds);
    }

    try {
      await featuredNewsRepositoryV2.setById('featured_articles', { ids: nextIds });
      setFeaturedIds(nextIds);
      return true;
    } catch (err) {
      console.error('Error updating featured status:', err);
      return false;
    }
  }, [featuredIds, v2Ids, toggleMutation]);

  const ids = featureFlags.useNewsV2 ? (v2Ids || []) : featuredIds;
  const isLoading = featureFlags.useNewsV2 ? v2Loading : loading;

  return {
    featuredIds: ids,
    loading: isLoading,
    toggleFeatured,
    refresh: featureFlags.useNewsV2 ? v2Refetch : loadFeatured
  };
}
