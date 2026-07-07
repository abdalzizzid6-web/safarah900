export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  MODERATOR = 'MODERATOR',
  AUTHOR = 'AUTHOR',
  VIP_USER = 'VIP_USER',
  USER = 'USER'
}

export interface UserAccount {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  isVip: boolean;
  vipExpiry?: string;
  favoriteTeams?: string[];
  favoriteLeagues?: string[];
  notificationsEnabled: boolean;
  fcmToken?: string;
  createdAt: string;
  lastLogin: string;
  bio?: string;
  phoneNumber?: string;
  isAdmin?: boolean;
}

export enum NotificationType {
  GOAL = 'GOAL',
  MATCH_START = 'MATCH_START',
  MATCH_END = 'MATCH_END',
  BREAKING_NEWS = 'BREAKING_NEWS',
  SYSTEM_BROADCAST = 'SYSTEM_BROADCAST',
  VIP_EXCLUSIVE = 'VIP_EXCLUSIVE',
  TRANSFER_ALERT = 'TRANSFER_ALERT'
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  imageUrl?: string;
  isRead: boolean;
  targetUids?: string[];
  targetTopic?: string;
  timestamp: string;
}

// Safara 90 V2 Strict Type Definitions with Backward Compatibility for transition

export interface Team {
  id: string | number;
  name: string;
  logo: string;
  tla?: string;
  isPlaceholder?: boolean;
  // Backward compatibility
  toLowerCase?: () => string;
}

export interface MatchScore {
  home: number | null;
  away: number | null;
  halfTimeHome?: number | null;
  halfTimeAway?: number | null;
}

export interface MatchPeriod {
  first: number | null;
  second: number | null;
  extratime: number | null;
  penalty: number | null;
}

export interface MatchStatusObj {
  long: string;
  short: string;
  elapsed: number | null;
  extra: number | null;
  toLowerCase?: () => string;
}

// Allows both Object descriptions from API-Football & legacy string statuses (e.g. 'FT', 'LIVE')
export type MatchStatus = any;

export interface MatchLeagueObj {
  id: number | string;
  name: string;
  country: string;
  logo: string;
  season?: number;
  round?: string;
  toLowerCase?: () => string;
  localeCompare?: (other: unknown) => number;
}

export type MatchLeague = any;

// Backward Compatibility Aliases for old components
export interface League {
  id: string | number;
  name: string;
  logo: string;
  country: string;
  apiLeagueId?: number | string;
  apiSeason?: number | string;
  standings?: unknown;
}

export enum AdType {
  IMAGE = 'IMAGE',
  SCRIPT = 'SCRIPT',
  ADMOB_BANNER = 'ADMOB_BANNER',
  ADMOB_INTERSTITIAL = 'ADMOB_INTERSTITIAL',
  ADMOB_REWARDED = 'ADMOB_REWARDED'
}

export enum AdSlot {
  HOME_TOP = 'Home_Top',
  HOME_MIDDLE = 'Home_Middle',
  HOME_BOTTOM = 'Home_Bottom',
  MATCH_UNDER_PLAYER = 'Match_Under_Player',
  NEWS_DETAIL_SIDEBAR = 'News_Detail_Sidebar',
  INTERSTITIAL = 'Interstitial',
  SCHEDULE_MIDDLE = 'Schedule_Middle',
  MATCH_SIDEBAR = 'Match_Sidebar'
}

export interface Ad {
  id: string;
  title: string;
  type: AdType;
  slot: AdSlot | string;
  active: boolean;
  imageUrl?: string;
  linkUrl?: string;
  code?: string; // For SCRIPT type
  admobAdUnitId?: string;
  priority?: number;
  startDate?: string;
  endDate?: string;
  views?: number;
  clicks?: number;
  createdAt: string;
  updatedAt: string;
}

export interface StreamingLink {
  name: string;
  url: string;
  icon?: string;
  enabled: boolean;
  priority: number;
  type: 'iframe' | 'youtube' | 'custom';
  quality?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role?: UserRole;
  isVip?: boolean;
  vipExpiry?: string;
  favoriteTeams?: string[];
  favoriteLeagues?: string[];
  notificationsEnabled?: boolean;
  fcmToken?: string;
  createdAt?: string;
  lastLogin?: string;
  bio?: string;
  phoneNumber?: string;
  isAdmin?: boolean;
}

export interface Announcement {
  id: string;
  title?: string;
  text: string;
  type?: 'breaking' | 'warning' | 'info' | string;
  link?: string;
  priority?: number;
  active?: boolean;
  createdAt?: string;
  expiresAt?: string;
}

export interface DataSource {
  matchProvider: 'TheSportsDB' | 'API-Football' | 'SportMonks' | 'Custom' | 'None';
  leagueProvider: 'TheSportsDB' | 'API-Football' | 'SportMonks' | 'Custom' | 'None';
  teamProvider: 'TheSportsDB' | 'API-Football' | 'SportMonks' | 'Custom' | 'None';
  playerProvider: 'TheSportsDB' | 'API-Football' | 'SportMonks' | 'Custom' | 'None';
  standingsProvider: 'TheSportsDB' | 'API-Football' | 'SportMonks' | 'Custom' | 'None';
  statisticsProvider: 'TheSportsDB' | 'API-Football' | 'SportMonks' | 'Custom' | 'None';
  streamProvider: 'TheSportsDB' | 'API-Football' | 'SportMonks' | 'Custom' | 'None';
  theSportsDBApiKey: string;
  apiFootballKey: string;
  sportMonksKey: string;
  customApis?: Array<{
    id: string;
    name: string;
    baseUrl: string;
    apiKey: string;
    headers: Record<string, string>;
  }>;
  cacheEnabled: boolean;
  cacheTtlMinutes: number;
  fallbackProvider: 'TheSportsDB' | 'API-Football' | 'SportMonks' | 'Custom' | 'None';
  worldCupModuleEnabled: boolean;
}

export interface MatchStats {
  possession?: { home: number; away: number; label: string; suffix?: string } | null;
  shots?: { home: number; away: number; label: string } | null;
  shotsOnTarget?: { home: number; away: number; label: string } | null;
  corners?: { home: number; away: number; label: string } | null;
  fouls?: { home: number; away: number; label: string } | null;
  yellowCards?: { home: number; away: number; label: string } | null;
  redCards?: { home: number; away: number; label: string } | null;
}

export interface Match {
  id: string; // Uniform ID mapped prefix as `apf-`
  homeTeam: Team | string;
  awayTeam: Team | string;
  homeTeamDetails?: Team;
  awayTeamDetails?: Team;
  score?: MatchScore;
  status: MatchStatus;
  league: MatchLeague;
  leagueDetails?: MatchLeagueObj;
  utcDate?: string;
  minute?: number;
  isLive?: boolean;
  events?: MatchEvent[];
  statistics?: MatchStat[];
  lineups?: TeamLineup[];
  showOnHome?: boolean;
  showInLive?: boolean;
  showInSlider?: boolean;

  // Backward compatibility fields for legacy components
  homeName?: string;
  awayName?: string;
  homeLogo?: string;
  awayLogo?: string;
  homeScore?: number;
  awayScore?: number;
  leagueLogo?: string;
  startTime?: string;
  commentator?: string;
  channel?: string;
  streamingLinks?: Array<{
    name: string;
    url: string;
    icon?: string;
    enabled: boolean;
    priority: number;
    type: 'iframe' | 'youtube' | 'custom';
  }>;
  stats?: MatchStats;
  stadium?: string;
  referee?: string;
  youtubeLink?: string;
  h2h?: any;
  predictions?: any;
  timeline?: any;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string;
    ogImage?: string;
  };
  highlightsLinks?: unknown;
  replayLinks?: unknown;
  isFeatured?: boolean;
  featuredPriority?: number;
  featuredPinned?: boolean;
  featuredStartDate?: string;
  featuredEndDate?: string;
  featuredEnabled?: boolean;
  isHidden?: boolean;
  viewersCount?: number;
  interestRate?: number;
  approved?: boolean;
  order?: number;
  visibilityStartTime?: string;
  visibilityEndTime?: string;
  archived?: boolean;
  posterUrl?: string;
  isManual?: boolean;
  competition?: {
    name: string;
    emblem: string;
  };
  
  isDeleted?: boolean;
  deletedAt?: any;
  editorialStatus?: string;
  version?: number;
  lastEditedBy?: {
    id: string;
    name: string;
  };

  // Unified Sync Metadata
  provider?: string;
  source?: string;
  syncStatus?: 'pending' | 'synced' | 'failed';
  lastSyncAt?: string;
  lastProviderUpdate?: string;
  competitionType?: string;
  metadata?: any;
}

export interface MatchEvent {
  time: {
    elapsed: number;
    extra: number | null;
  };
  team: {
    id: number;
    name: string;
    logo?: string;
  };
  player: {
    id: number | null;
    name: string;
  };
  assist: {
    id: number | null;
    name: string | null;
  };
  type: 'Goal' | 'Card' | 'subst' | 'Var' | string;
  detail: string;
  comments: string | null;
}

export interface MatchStat {
  type: string;
  home: string | number;
  away: string | number;
}

export interface PlayerNode {
  id: number;
  name: string;
  number: number;
  pos: 'G' | 'D' | 'M' | 'F' | string;
  grid: string | null; // e.g. "1:1"
}

export interface TeamLineup {
  team: Team;
  formation: string;
  startXI: { player: PlayerNode }[];
  substitutes: { player: PlayerNode }[];
  coach: {
    name: string;
    photo?: string;
  };
}

export interface StandingsRow {
  rank: number;
  team: Team;
  played: number;
  win: number;
  draw: number;
  lose: number;
  goalsFor: number;
  goalsAgainst: number;
  goalsDiff: number;
  points: number;
  form: string;
}

export interface LeagueStandings {
  leagueId: number;
  leagueName: string;
  season: number;
  standings: StandingsRow[];
}

export interface AppSettings {
  theme: 'dark' | 'light';
  language: 'ar';
  notificationsEnabled: boolean;
}

export interface Bookmarks {
  matches: string[];
  teams: string[];
}

// --- News System Types ---

export enum NewsStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  SCHEDULED = 'SCHEDULED',
  ARCHIVED = 'ARCHIVED',
  REVIEW = 'REVIEW'
}

export interface NewsSEO {
  title: string;
  description: string;
  keywords: string;
  ogImage?: string;
  slug?: string; // Unified
  canonicalUrl?: string;
  structuredData?: Record<string, unknown>;
}

export interface NewsContent {
  fullText: string;
  summary?: string;
  htmlContent?: string;
}

export interface News {
  id: string;
  title: string;
  shortTitle?: string;
  slug: string;
  content: NewsContent;
  mainImage: string;
  media_incomplete?: boolean;
  gallery?: string[];
  videoUrl?: string;
  category: string;
  categories?: string[]; // Backward compatibility
  tags: string[];
  keywords: string[];
  author: string | { name: string }; // Unified
  source?: {
    name: string;
    url: string;
    importDate: string;
    fetchTime: string;
  };
  publishDate: string;
  scheduledDate?: string;
  status: NewsStatus | string;
  seo: NewsSEO;
  aiMetadata?: {
    summary?: string;
    extractedPlayers?: string[];
    extractedTeams?: string[];
    extractedCompetitions?: string[];
  };
  viewCount: number;
  totalViews?: number; // Legacy
  isBreaking?: boolean;
  isFeatured?: boolean;
  isTrending?: boolean;
  isPopular?: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string; // Legacy
  image?: string; // Legacy
  featuredImage?: { url: string; altText?: string }; // Legacy
  excerpt?: string; // Legacy
  summary?: string; // Legacy (now in content)
  quality?: {
    seoScore: number;
    readabilityScore: number;
    contentScore: number;
    mediaScore: number;
    finalScore: number;
    warnings: string[];
  };
}

export interface NewsCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  order: number;
  icon?: string;
  isActive?: boolean;
}

export interface RssSource {
  id: string;
  name: string;
  url: string;
  category: string;
  isActive: boolean;
  lastFetch?: string;
  fetchInterval: number; // in minutes
  fetchLimit?: number; 
  priority?: number; 
  autoRewrite: boolean;
  autoApprove: boolean;
  logo?: string;
}

export interface RssLog {
  id: string;
  sourceId: string;
  timestamp: string;
  status: 'SUCCESS' | 'ERROR';
  importedCount: number;
  message?: string;
}

// --- Sports Store Types ---

export enum ProductStatus {
  IN_STOCK = 'IN_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  DISCONTINUED = 'DISCONTINUED'
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: 'Jerseys' | 'Suits' | 'Balls' | 'Medals' | 'Equipment' | 'Flooring' | 'Shoes' | 'Accessories';
  price: number;
  discountPrice?: number;
  images: string[];
  sizes?: string[];
  colors?: string[];
  status: ProductStatus;
  stock: number;
  rating: number;
  reviewsCount: number;
  isFeatured?: boolean;
  tags: string[];
  createdAt: string;
}

export interface Order {
  id: string;
  userId: string;
  items: {
    productId: string;
    quantity: number;
    price: number;
    size?: string;
    color?: string;
  }[];
  totalAmount: number;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  shippingAddress: string;
  paymentMethod: string;
  createdAt: string;
}

// --- Esports Hub Types ---

export interface EsportsMatch {
  id: string;
  game: 'PUBG' | 'FC26' | 'eFootball' | 'Valorant' | 'LoL' | 'Dota2' | 'CS2';
  homeTeam: string;
  awayTeam: string;
  homeLogo: string;
  awayLogo: string;
  homeScore?: number;
  awayScore?: number;
  status: 'UPCOMING' | 'LIVE' | 'FINISHED';
  startTime: string;
  streamUrl?: string;
}

// --- Voting & Contests Types ---

export interface PollOption {
  id: string;
  label: string;
  votes: number;
  imageUrl?: string;
}

export interface Poll {
  id: string;
  question: string;
  type: 'PLAYER_OF_MONTH' | 'GOAL_OF_WEEK' | 'GENERAL';
  options: PollOption[];
  startDate: string;
  endDate: string;
  isActive: boolean;
  totalVotes: number;
  allowVipOnly?: boolean;
}

// --- Radio & Media Types ---

export interface RadioProgram {
  id: string;
  title: string;
  host: string;
  description: string;
  startTime: string; 
  endTime: string;
  days: number[]; 
  coverImage: string;
}

// --- Stadium Booking System Types ---

export interface Stadium {
  id: string;
  ownerUid: string;
  name: string;
  description: string;
  location: string;
  city: string;
  pricePerHour: number;
  images: string[];
  features: string[];
  rating: number;
  reviewCount: number;
  status: 'ACTIVE' | 'INACTIVE';
  availability: {
    days: number[];
    hours: string[];
  };
}


// --- Social Media Automation Platform ---

export enum SocialPlatformType {
  X = 'X',
  FACEBOOK = 'FACEBOOK',
  INSTAGRAM = 'INSTAGRAM',
  TELEGRAM = 'TELEGRAM',
  WHATSAPP = 'WHATSAPP',
  YOUTUBE = 'YOUTUBE',
  TIKTOK = 'TIKTOK'
}

export interface SocialAccount {
  id: string;
  platform: SocialPlatformType;
  platformAccountId: string;
  platformAccountName: string;
  accessToken: string; // Should be encrypted in production
  refreshToken?: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'EXPIRED';
  updatedAt: string;
}

export enum SocialPostStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PUBLISHED = 'PUBLISHED',
  FAILED = 'FAILED'
}

export interface SocialPost {
  id: string;
  title: string;
  content: string; // The generated content
  platforms: SocialPlatformType[];
  status: SocialPostStatus;
  scheduledAt?: string;
  publishedAt?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SocialQueueItem {
  id: string;
  postId: string;
  platform: SocialPlatformType;
  status: SocialPostStatus;
  payload: Record<string, unknown>; // Platform-specific payload
  retryCount: number;
  lastError?: string;
  scheduledAt: string;
}

export interface SocialLog {
  id: string;
  postId: string;
  platform: SocialPlatformType;
  status: SocialPostStatus;
  message: string;
  timestamp: string;
}

export interface SocialSettings {
  id: string; // 'global'
  enabledPlatforms: SocialPlatformType[];
  autoPublish: boolean;
  rateLimitPerDay: number;
}

// --- Homepage Builder Types ---

export enum BlockType {
  HERO = 'HERO',
  BREAKING_NEWS = 'BREAKING_NEWS',
  LIVE_MATCHES = 'LIVE_MATCHES',
  TODAY_MATCHES = 'TODAY_MATCHES',
  TOMORROW_MATCHES = 'TOMORROW_MATCHES',
  FINISHED_MATCHES = 'FINISHED_MATCHES',
  LATEST_NEWS = 'LATEST_NEWS',
  FEATURED_NEWS = 'FEATURED_NEWS',
  TRENDING_NEWS = 'TRENDING_NEWS',
  BENTO_ACTIONS = 'BENTO_ACTIONS',
  LEAGUE_STANDINGS = 'LEAGUE_STANDINGS',
  LEAGUES = 'LEAGUES',
  TOP_PLAYERS = 'TOP_PLAYERS',
  TOP_GOALSCORERS = 'TOP_GOALSCORERS',
  POLLS = 'POLLS',
  ADS = 'ADS',
  VIDEOS = 'VIDEOS',
  CUSTOM_WIDGETS = 'CUSTOM_WIDGETS'
}

export interface HomepageBlock {
  id: string;
  type: BlockType;
  title: string;
  internalName: string;
  displayOrder: number;
  enabled: boolean;
  visibility: {
    desktop: boolean;
    tablet: boolean;
    mobile: boolean;
  };
  dataConfig: Record<string, unknown>;
  styleConfig: {
    backgroundColor?: string;
    textColor?: string;
    titleColor?: string;
    fontFamily?: string;
    borderRadius?: string;
  };
  layoutConfig: {
    columns: 1 | 2 | 3 | 4;
    style: 'card' | 'carousel' | 'slider' | 'bento' | 'magazine';
    spacing?: string;
    background?: string;
  };
  cacheConfig: {
    durationMinutes: number;
    manualRefresh?: boolean;
    autoRefresh?: boolean;
  };
  scheduling: {
    startDate?: string;
    endDate?: string;
    publishTime?: string;
    expireTime?: string;
  };
  seo: {
    schema?: string;
    canonical?: string;
    index: boolean;
    metaTitle?: string;
    metaDescription?: string;
  };
  analytics: {
    views: number;
    clicks: number;
  };
}

// --- CMS Enterprise Types ---

export interface LeagueSettings {
  id: string;
  enabled: boolean;
  featured: boolean;
  order: number;
  customName?: string;
  logoUrl?: string;
  color?: string;
}

export interface TeamSettings {
  id: string;
  name: string;
  logo: string;
  enabled: boolean;
  featured: boolean;
  order: number;
}

export interface ChannelServerSettings {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  assignedLeagueIds: string[];
  assignedMatchIds: string[];
  geoRestrictions?: string[];
  autoFailover?: boolean;
}

export interface HomepageConfig {
  featuredLeagues: string[];
  featuredMatches: string[];
  featuredTeams: string[];
}
