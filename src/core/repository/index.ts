import { MatchesRepositoryV2 } from './MatchesRepositoryV2';
import { LeaguesRepositoryV2 } from './LeaguesRepositoryV2';
import { TeamsRepositoryV2 } from './TeamsRepositoryV2';
import { NewsRepositoryV2 } from './NewsRepositoryV2';
import { PlayersRepositoryV2 } from './PlayersRepositoryV2';
import { SettingsRepositoryV2 } from './SettingsRepositoryV2';
import { AdsRepositoryV2 } from './AdsRepositoryV2';
import { BaseRepository } from './BaseRepository';
import { ApiManagementRepository } from '../api-management/repository/ApiManagementRepository';

// Define specialized types for administrative repositories
export class NewsTagsRepository extends BaseRepository<any> { constructor() { super('news_tags'); } }
export class HomepageRepository extends BaseRepository<any> { constructor() { super('homepage_blocks'); } }
export class AnalyticsRepository extends BaseRepository<any> { constructor() { super('system_stats'); } }
export class ErrorLogRepository extends BaseRepository<any> { constructor() { super('error_logs'); } }
export class UserManagementRepository extends BaseRepository<any> { constructor() { super('users'); } }
export class MediaRepository extends BaseRepository<any> { constructor() { super('media_assets'); } }

export const repositories = {
  matches: new MatchesRepositoryV2(),
  leagues: new LeaguesRepositoryV2(),
  teams: new TeamsRepositoryV2(),
  news: new NewsRepositoryV2(),
  players: new PlayersRepositoryV2(),
  settings: new SettingsRepositoryV2(),
  ads: new AdsRepositoryV2(),
  newsTags: new NewsTagsRepository(),
  homepage: new HomepageRepository(),
  analytics: new AnalyticsRepository(),
  errorLogs: new ErrorLogRepository(),
  users: new UserManagementRepository(),
  media: new MediaRepository(),
  apiManagement: new ApiManagementRepository(),
};
