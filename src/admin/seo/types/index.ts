export interface SeoIssue {
  articleId: string;
  articleTitle: string;
  slug: string;
  type: 'missing_title' | 'missing_desc' | 'missing_canonical' | 'missing_schema' | 'missing_image' | 'duplicate_content' | 'thin_content' | 'sitemap_issue' | 'internal_links_issue';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  fieldAffected: string;
}

export interface SitemapsStatus {
  url: string;
  status: 'LOADING' | 'OK' | 'ERROR';
  statusCode: number | null;
  sizeBytes: number | null;
  urlsCount: number;
  error?: string;
}

export interface RobotStatus {
  status: 'LOADING' | 'OK' | 'ERROR';
  hasSitemapUrl: boolean;
  allowsAll: boolean;
  content: string;
}

export interface SeoArticle {
  id: string;
  title?: string;
  slug?: string;
  summary?: string;
  content?: string | { fullText?: string; htmlContent?: string };
  mainImage?: string;
  image?: string;
  createdAt?: string | { seconds: number; nanoseconds?: number } | { toDate: () => Date };
  seo?: {
    title?: string;
    description?: string;
    canonicalUrl?: string;
    structuredData?: any;
    schema?: any;
  };
}
