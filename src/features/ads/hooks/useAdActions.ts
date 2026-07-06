import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveAd, deleteAd, toggleAdStatus } from '../repositories/adsRepository';
import { Ad } from '../types/ad.types';

export const useAdActions = () => {
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (ad: Partial<Ad> & { id?: string }) => saveAd(ad),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ads'] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAd(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ads'] })
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, active }: { id: string, active: boolean }) => toggleAdStatus(id, active),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ads'] })
  });
  
  return {
    saveAd: saveMutation.mutateAsync,
    deleteAd: deleteMutation.mutateAsync,
    toggleAdStatus: toggleStatusMutation.mutateAsync
  };
};
