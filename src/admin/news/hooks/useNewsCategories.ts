import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NewsCategory } from '../types';
import { newsCategoryService } from '../services/newsCategoryService';
import { featureFlags } from '../../../core/config/featureFlags';

export function useNewsCategories() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: categories = [], isLoading, refetch } = useQuery({
    queryKey: ['newsCategories'],
    queryFn: () => newsCategoryService.getCategories(),
    staleTime: 30 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation({
    mutationFn: ({name, description}: {name: string, description?: string}) => newsCategoryService.createCategory(name, description),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['newsCategories'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({id, name, description}: {id: string, name: string, description?: string}) => newsCategoryService.updateCategory(id, name, description),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['newsCategories'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => newsCategoryService.deleteCategory(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['newsCategories'] }),
  });

  const addCategory = useCallback(async (name: string, description?: string) => {
    try {
      await createMutation.mutateAsync({name, description});
      return true;
    } catch (err: any) {
      setError(err.message || 'فشل في إضافة التصنيف');
      return false;
    }
  }, [createMutation]);

  const updateCategory = useCallback(async (id: string, name: string, description?: string) => {
    try {
      await updateMutation.mutateAsync({id, name, description});
      return true;
    } catch (err: any) {
      setError(err.message || 'فشل في تحديث التصنيف');
      return false;
    }
  }, [updateMutation]);

  const deleteCategory = useCallback(async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch (err: any) {
      setError(err.message || 'فشل في حذف التصنيف');
      return false;
    }
  }, [deleteMutation]);

  return {
    categories,
    loading: isLoading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    refresh: refetch
  };
}
