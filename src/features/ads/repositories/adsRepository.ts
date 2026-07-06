import { Ad } from '../../../types';
import { adCampaignsRepositoryV2 } from '../../../core/repository/AdCampaignsRepositoryV2';

export type { Ad };

export const getAllAds = async (count: number = 100): Promise<Ad[]> => {
  try {
    return await adCampaignsRepositoryV2.getAdCampaigns(count);
  } catch (error) {
    console.error('[adsRepository] Error getting ads:', error);
    throw error;
  }
};

export const saveAd = async (ad: Partial<Ad> & { id?: string }) => {
  try {
    return await adCampaignsRepositoryV2.saveCampaign(ad);
  } catch (error) {
    console.error('[adsRepository] Error saving ad:', error);
    throw error;
  }
};

export const deleteAd = async (id: string) => {
  try {
    await adCampaignsRepositoryV2.delete(id);
  } catch (error) {
    console.error('[adsRepository] Error deleting ad:', error);
    throw error;
  }
};

export const toggleAdStatus = async (id: string, active: boolean) => {
  try {
    await adCampaignsRepositoryV2.toggleStatus(id, active);
  } catch (error) {
    console.error('[adsRepository] Error toggling ad status:', error);
    throw error;
  }
};

export const subscribeToAds = (callback: (ads: Ad[]) => void) => {
  return adCampaignsRepositoryV2.subscribeToActiveCampaigns(callback);
};

// Aliases for compatibility with AdvertiserPortalPage
export const getAdCampaigns = getAllAds;
export const createAdCampaign = saveAd;
export const deleteAdCampaign = deleteAd;
export const subscribeToAdCampaigns = subscribeToAds;

export const adsRepository = {
  getAllAds,
  saveAd,
  deleteAd,
  toggleAdStatus,
  subscribeToAds,
  getAdCampaigns,
  createAdCampaign,
  deleteAdCampaign,
  subscribeToAdCampaigns
};
