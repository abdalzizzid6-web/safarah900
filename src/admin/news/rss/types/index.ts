export interface RssProvider {
  id: string;
  name: string;
  logo: string;
  url: string; // feed URL
  language: string;
  country: string;
  sport: string;
  category: string;
  enabled: boolean;
  updateInterval: number; // in minutes
  lastSync: string | null;
  lastError: string | null;
  status: "ACTIVE" | "FAILED" | "PENDING";
  createdAt?: string;
  updatedAt?: string;
}

export interface RssArticleClassification {
  league: string;
  competition: string;
  teams: string[];
  players: string[];
  country: string;
  articleType: string;
  suggestedTags: string[];
}

export interface RssArticleSeo {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  readingTime: number;
  canonicalUrl: string;
  keywords: string[];
  includeInSitemap: boolean;
  openGraph?: {
    title: string;
    description: string;
    image: string;
  };
  twitterCard?: {
    title: string;
    description: string;
    image: string;
    cardType: string;
  };
}

export interface RssArticleIntelligence {
  summaryEn: string;
  summaryAr: string;
  seoHeadline: string;
  shortHeadline: string;
  difficulty: "مبتدئ" | "متوسط" | "متقدم";
  importanceScore: number;
  trendingScore: number;
  breakingScore: number;
  qualityScore: number;
  qualityBreakdown: {
    originality: number;
    completeness: number;
    seo: number;
    readability: number;
    freshness: number;
    mediaQuality: number;
  };
}

export interface RssArticleSportsDetection {
  competition: string;
  league: string;
  season: string;
  round: string;
  teams: string[];
  players: string[];
  coach: string;
  country: string;
  stadium: string;
  referee: string;
  matchDate: string;
}

export interface RssArticleImageIntel {
  altText: string;
  caption: string;
  credit: string;
  suggestedImages: string[];
}

export interface RssArticleAiEditor {
  headlineSuggestions: string[];
  seoTitleSuggestion: string;
  metaDescriptionSuggestion: string;
  slugSuggestion: string;
  keywordsSuggestion: string[];
  structureSuggestion: string;
}

export interface RssArticleTranslations {
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
}

export interface RssArticleSmartLinks {
  matchId?: string;
  teamIds: string[];
  playerIds: string[];
  competitionId?: string;
  worldCupPageLinked?: boolean;
}

export interface RssImportedArticle {
  id: string;
  guid: string;
  originalUrl: string;
  title: string;
  description: string;
  rawHtml?: string;
  author: string;
  sourceName: string;
  sourceLogo: string;
  providerId: string;
  imageUrl: string;
  pubDate: string;
  status: "REVIEW" | "APPROVED" | "REJECTED" | "PUBLISHED" | "ARCHIVED";
  classification: RssArticleClassification;
  seo: RssArticleSeo;
  intelligence?: RssArticleIntelligence;
  sportsDetection?: RssArticleSportsDetection;
  imageIntel?: RssArticleImageIntel;
  aiEditor?: RssArticleAiEditor;
  translations?: RssArticleTranslations;
  smartLinks?: RssArticleSmartLinks;
  createdAt: string;
  updatedAt: string;
  publishDate?: string;
}

export interface RssAnalyticsStats {
  totalProviders: number;
  activeProviders: number;
  failedProviders: number;
  syncSuccessRate: number;
  totalImported: number;
  pendingReview: number;
  approved: number;
  published: number;
  rejected: number;
  duplicateRate: number;
}
