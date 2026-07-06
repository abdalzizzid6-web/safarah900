import { useQuery } from '@tanstack/react-query';
import { cmsRepositoryV2 } from '../../../core/repository/CmsRepositoryV2';
import { featureFlags } from '../../../core/config/featureFlags';

export const useCmsLeagues = () => {
  return useQuery({
    queryKey: ['cms_leagues'],
    queryFn: () => cmsRepositoryV2.getLeagues(),
    enabled: featureFlags.useRepositoryPattern,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCmsTeams = () => {
  return useQuery({
    queryKey: ['cms_teams'],
    queryFn: () => cmsRepositoryV2.getTeams(),
    enabled: featureFlags.useRepositoryPattern,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCmsChannels = () => {
  return useQuery({
    queryKey: ['cms_channels'],
    queryFn: () => cmsRepositoryV2.getChannels(),
    enabled: featureFlags.useRepositoryPattern,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCmsHomepageConfig = () => {
  return useQuery({
    queryKey: ['cms_homepage_config'],
    queryFn: () => cmsRepositoryV2.getHomepageConfig(),
    enabled: featureFlags.useRepositoryPattern,
    staleTime: 5 * 60 * 1000,
  });
};
