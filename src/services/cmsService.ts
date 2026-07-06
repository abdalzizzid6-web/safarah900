import { cmsRepositoryV2 } from '../core/repository/CmsRepositoryV2';
import { cmsService as legacyCmsService } from '../core/compatibility/cmsService';
import { featureFlags } from '../core/config/featureFlags';

export type { LeagueSettings, TeamSettings, ChannelServerSettings, HomepageConfig } from '../core/compatibility/cmsService';

export const cmsService = {
  async updateLeagueSettings(leagueId: string, settings: any) {
    if (featureFlags.useCmsV2) return await cmsRepositoryV2.updateLeague(leagueId, settings);
    return await legacyCmsService.updateLeagueSettings(leagueId, settings);
  },
  async getLeagueSettingsList() {
    if (featureFlags.useCmsV2) return await cmsRepositoryV2.getLeagues();
    return await legacyCmsService.getLeagueSettingsList();
  },
  async getLeagueSettingsMap() {
    if (featureFlags.useCmsV2) return await cmsRepositoryV2.getLeaguesMap(); // Need to add this to V2
    return await legacyCmsService.getLeagueSettingsMap();
  },
  async getEnabledLeagues() {
    if (featureFlags.useCmsV2) return (await cmsRepositoryV2.getLeagues()).filter(l => l.enabled !== false);
    return await legacyCmsService.getEnabledLeagues();
  },
  async setMatchOverride(matchId: string, override: any) {
    // Legacy only for now
    return await legacyCmsService.setMatchOverride(matchId, override);
  },
  async getMatchOverrides() {
    // Legacy only for now
    return await legacyCmsService.getMatchOverrides();
  },
  async updateTeamSettings(teamId: string, settings: any) {
    if (featureFlags.useCmsV2) return await cmsRepositoryV2.updateTeam(teamId, settings);
    return await legacyCmsService.updateTeamSettings(teamId, settings);
  },
  async getTeamSettingsList() {
    if (featureFlags.useCmsV2) return await cmsRepositoryV2.getTeams();
    return await legacyCmsService.getTeamSettingsList();
  },
  async getTeamSettingsMap() {
    if (featureFlags.useCmsV2) return await cmsRepositoryV2.getTeamsMap(); // Need to add this
    return await legacyCmsService.getTeamSettingsMap();
  },
  async updateChannelServerSettings(id: string, settings: any) {
    if (featureFlags.useCmsV2) return await cmsRepositoryV2.updateChannel(id, settings);
    return await legacyCmsService.updateChannelServerSettings(id, settings);
  },
  async deleteChannelServerSettings(id: string) {
    if (featureFlags.useCmsV2) return await cmsRepositoryV2.deleteChannel(id);
    return await legacyCmsService.deleteChannelServerSettings(id);
  },
  async getChannelServerSettingsList() {
    if (featureFlags.useCmsV2) return await cmsRepositoryV2.getChannels();
    return await legacyCmsService.getChannelServerSettingsList();
  },
  async getHomepageConfig() {
    if (featureFlags.useCmsV2) return await cmsRepositoryV2.getHomepageConfig();
    return await legacyCmsService.getHomepageConfig();
  },
  async updateHomepageConfig(config: any) {
    if (featureFlags.useCmsV2) return await cmsRepositoryV2.updateHomepageConfig(config);
    return await legacyCmsService.updateHomepageConfig(config);
  }
};
