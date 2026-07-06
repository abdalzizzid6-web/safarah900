import { useQuery } from '@tanstack/react-query';
import { getAllAds, Ad } from '../repositories/adsRepository';

export const useAds = () => {
  return useQuery<Ad[]>({
    queryKey: ['ads'],
    queryFn: () => getAllAds(),
    staleTime: 60000 
  });
};
