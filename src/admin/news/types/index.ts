export enum NewsArticleStatus {
  DRAFT = 'DRAFT',
  REVIEW = 'REVIEW',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  SCHEDULED = 'SCHEDULED'
}

export interface NewsCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
}

export interface NewsTag {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface NewsImage {
  url: string;
  caption?: string;
  altText?: string;
  credit?: string;
  isWebP?: boolean;
}

export interface NewsSeo {
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl?: string;
  openGraph?: {
    title?: string;
    description?: string;
    image?: string;
  };
  twitterCard?: {
    title?: string;
    description?: string;
    image?: string;
    cardType?: 'summary' | 'summary_large_image';
  };
  structuredData?: any; // To store schema.org NewsArticle representation
  readingTime?: number; // In minutes
  keywords: string[];
  includeInSitemap: boolean;
}

export interface RelatedContent {
  matches: string[]; // Match IDs
  teams: string[];   // Team IDs
  players: string[]; // Player IDs
  competitions: string[]; // Competition IDs
  worldCupMatches?: string[]; // World Cup Match IDs
}

export interface NewsVersion {
  id: string;
  version: number;
  updatedAt: string;
  updatedBy: string;
  title: string;
  content: string;
  status: NewsArticleStatus;
}

export interface NewsArticle {
  id: string;
  title: string;
  content: string; // Dynamic JSON structure or HTML string
  excerpt?: string;
  author: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  status: NewsArticleStatus;
  categories: string[]; // Category IDs or slugs
  tags: string[];       // Tag IDs or names
  featuredImage: NewsImage;
  gallery?: NewsImage[];
  seo: NewsSeo;
  relatedContent: RelatedContent;
  publishDate?: string; // ISO String (used for scheduled or published)
  createdAt: string;
  updatedAt: string;
  version: number;
  history?: NewsVersion[];
  views: number;
  clicks: number;
  readingTimeSum?: number; // for calculating average reading time
}

export interface NewsAnalyticsItem {
  articleId: string;
  title: string;
  views: number;
  clicks: number;
  ctr: number;
  avgReadingTime: number; // in minutes
}

export interface NewsCategoryAnalytics {
  categoryId: string;
  categoryName: string;
  views: number;
  articlesCount: number;
}

export interface NewsTagAnalytics {
  tagId: string;
  tagName: string;
  views: number;
  articlesCount: number;
}

export interface NewsStatisticsData {
  totalArticles: number;
  publishedCount: number;
  scheduledCount: number;
  draftCount: number;
  totalViews: number;
  totalClicks: number;
  avgCtr: number;
  avgReadingTime: number;
  topArticles: NewsAnalyticsItem[];
  topCategories: NewsCategoryAnalytics[];
  topTags: NewsTagAnalytics[];
}
