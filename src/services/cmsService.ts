import { cmsRepositoryV2 } from '../core/repository/CmsRepositoryV2';
export type { LeagueSettings, TeamSettings, ChannelServerSettings, HomepageConfig } from '../types';

export const cmsService = {
  async updateLeagueSettings(leagueId: string, settings: any) {
    return await cmsRepositoryV2.updateLeague(leagueId, settings);
  },
  async getLeagueSettingsList() {
    return await cmsRepositoryV2.getLeagues();
  },
  async getLeagueSettingsMap() {
    return await cmsRepositoryV2.getLeaguesMap();
  },
  async getEnabledLeagues() {
    return (await cmsRepositoryV2.getLeagues()).filter(l => l.enabled !== false);
  },
  async setMatchOverride(matchId: string, override: any) {
    return await cmsRepositoryV2.setMatchOverride(matchId, override);
  },
  async getMatchOverrides() {
    return await cmsRepositoryV2.getMatchOverrides();
  },
  async updateTeamSettings(teamId: string, settings: any) {
    return await cmsRepositoryV2.updateTeam(teamId, settings);
  },
  async getTeamSettingsList() {
    return await cmsRepositoryV2.getTeams();
  },
  async getTeamSettingsMap() {
    return await cmsRepositoryV2.getTeamsMap();
  },
  async updateChannelServerSettings(id: string, settings: any) {
    return await cmsRepositoryV2.updateChannel(id, settings);
  },
  async deleteChannelServerSettings(id: string) {
    return await cmsRepositoryV2.deleteChannel(id);
  },
  async getChannelServerSettingsList() {
    return await cmsRepositoryV2.getChannels();
  },
  async getHomepageConfig() {
    return await cmsRepositoryV2.getHomepageConfig();
  },
  async updateHomepageConfig(config: any) {
    return await cmsRepositoryV2.updateHomepageConfig(config);
  }
};
