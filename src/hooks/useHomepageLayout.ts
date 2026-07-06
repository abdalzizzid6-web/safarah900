import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cmsRepositoryV2 } from '../core/repository/CmsRepositoryV2';
import { HomepageBlock } from '../types';
import { queryClient } from '../lib/react-query';

export const clearHomepageCache = () => {
  queryClient.invalidateQueries({ queryKey: ['homepageLayoutV2'] });
};

export function useHomepageLayout() {
  const { data: blocks = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: ['homepageLayoutV2'],
    queryFn: async () => {
      const fetched = await cmsRepositoryV2.getHomepageBlocks();
      return fetched.filter(block => block.enabled !== false);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000,
  });

  return { 
    blocks, 
    loading, 
    error: error ? (error as any).message : null,
    refresh: refetch
  };
}
