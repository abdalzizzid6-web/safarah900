export enum MediaPermission {
  VIEWER = 'VIEWER',
  EDITOR = 'EDITOR',
  MEDIA_EDITOR = 'MEDIA_EDITOR',
  ADMINISTRATOR = 'ADMINISTRATOR',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

export type MediaType = 
  | 'Images'
  | 'Logos'
  | 'Player Photos'
  | 'Team Logos'
  | 'Competition Logos'
  | 'Stadium Images'
  | 'Coach Images'
  | 'Referee Images'
  | 'Flags'
  | 'Backgrounds'
  | 'Banners'
  | 'Match Posters'
  | 'News Images'
  | 'AI Images'
  | 'Videos'
  | 'SVG'
  | 'WebP'
  | 'PNG'
  | 'JPEG'
  | 'GIF'
  | 'PDF'
  | 'ZIP';

export interface MediaAsset {
  id: string;
  name: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  width: number;
  height: number;
  aspectRatio: string;
  sha256: string;
  pHash?: string; // Perceptual Hash
  dominantColor: string;
  averageColor: string;
  blurPlaceholder: string; // Small Base64 data-url
  hasTransparency: boolean;
  
  // CDN-ready URIs
  url: string; // Base / original URL
  urls: {
    thumbnail: string;
    small: string;
    medium: string;
    large: string;
    webp: string;
    avif?: string;
  };
  
  // Categorization
  mediaType: MediaType;
  tags: string[];
  smartLinks: {
    players: { id: string; name: string }[];
    teams: { id: string; name: string }[];
    competitions: { id: string; name: string }[];
    matches: { id: string; name: string }[];
    news: { id: string; title: string }[];
    video?: { id: string; title: string }[];
    worldCup?: boolean;
  };
  
  folderId: string | null;
  collectionIds: string[];
  isPinned: boolean;
  isFavorite: boolean;
  
  // Audit Metrics
  views: number;
  downloads: number;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MediaFolder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MediaCollection {
  id: string;
  name: string;
  description: string;
  isSmart: boolean;
  smartRules?: {
    tags?: string[];
    mediaType?: MediaType;
    color?: string;
  };
  isPinned: boolean;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DAMConfig {
  cdnProvider: 'Firebase' | 'CloudflareR2' | 'GoogleCloudStorage' | 'AWSS3';
  bucketName: string;
  defaultFormat: 'original' | 'webp' | 'avif';
  quality: number; // 1-100
  stripExif: boolean;
  autoAiTagging: boolean;
  autoDuplicateDetect: boolean;
  allowedRoles: string[];
  maxUploadSize: number; // MB
}

export interface DAMAnalytics {
  storageUsed: number; // Bytes
  totalAssets: number;
  uploadsCount: number;
  downloadsCount: number;
  totalViews: number;
  duplicateCount: number;
  compressionSavedBytes: number;
  topAssets: MediaAsset[];
  unusedAssets: MediaAsset[];
  brokenAssets: MediaAsset[];
}
