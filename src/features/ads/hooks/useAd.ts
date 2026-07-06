import { useAds } from './useAds';
import { Ad } from '../repositories/adsRepository';

export const useAd = (id: string) => {
  const { data: ads } = useAds(); 
  return (ads as Ad[])?.find(a => a.id === id);
};

// Actually, I need to fetch all ads to filter, 
// or implement getAd in repository. 
// For now, let's just re-use useAds or fetch specially if needed.
// Keeping it simple as requested by instructions.
