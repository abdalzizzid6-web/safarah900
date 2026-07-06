import { useState } from 'react';
import { SitemapsStatus, RobotStatus } from '../types';

export function useSitemapStatus() {
  const [sitemaps, setSitemaps] = useState<Record<string, SitemapsStatus>>({
    news: { url: 'https://korea90.xyz/sitemap-news.xml', status: 'LOADING', statusCode: null, sizeBytes: null, urlsCount: 0 },
    matches: { url: 'https://korea90.xyz/sitemap-matches.xml', status: 'LOADING', statusCode: null, sizeBytes: null, urlsCount: 0 },
    leagues: { url: 'https://korea90.xyz/sitemap-leagues.xml', status: 'LOADING', statusCode: null, sizeBytes: null, urlsCount: 0 },
    teams: { url: 'https://korea90.xyz/sitemap-teams.xml', status: 'LOADING', statusCode: null, sizeBytes: null, urlsCount: 0 },
    players: { url: 'https://korea90.xyz/sitemap-players.xml', status: 'LOADING', statusCode: null, sizeBytes: null, urlsCount: 0 },
    main: { url: 'https://korea90.xyz/sitemap.xml', status: 'LOADING', statusCode: null, sizeBytes: null, urlsCount: 0 },
  });

  const [robotsTxt, setRobotsTxt] = useState<RobotStatus>({
    status: 'LOADING',
    hasSitemapUrl: false,
    allowsAll: false,
    content: ''
  });

  return {
    sitemaps,
    setSitemaps,
    robotsTxt,
    setRobotsTxt
  };
}
