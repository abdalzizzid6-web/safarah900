import fs from 'fs';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { firestore } from '../../src/lib/firebase-admin';
import { getIdFromSlug } from './slugify';

const BASE_URL = "https://korea90.xyz";
const THEME_COLOR = "#0f172a";

const generateMetaHtml = (
  title: string,
  description: string,
  url: string,
  imageUrl: string = `${BASE_URL}/logo.png`,
  jsonLd: any = null,
  type: string = 'website',
  author: string = 'Safara90',
) => {
  const jsonLdScript = jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : '';
  
  return `
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="theme-color" content="${THEME_COLOR}" />
    <meta name="author" content="${author}" />
    <link rel="canonical" href="${url}" />
    
    <!-- Open Graph -->
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:type" content="${type}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:site_name" content="Safara90" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${imageUrl}" />
    
    ${jsonLdScript}
  `;
};

export const seoMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // Only process GET requests for HTML (not API, assets, etc.)
  if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.startsWith('/assets') || req.path.match(/\.[a-zA-Z0-9]+$/)) {
    return next();
  }

  const distPath = path.join(process.cwd(), 'dist');
  let html = '';
  try {
    html = fs.readFileSync(path.join(distPath, 'index.html'), 'utf-8');
  } catch (err) {
    return next();
  }

  const injectAndSend = (metaTags: string, status = 200) => {
    // Replace default tags
    html = html.replace(/<title>[\s\S]*?<\/title>/i, '');
    html = html.replace(/<meta name="description"[\s\S]*?>/i, '');
    html = html.replace('</head>', `${metaTags}</head>`);
    html = html.replace('<html lang="en">', '<html lang="ar" dir="rtl">');
    res.status(status).send(html);
  };

  const currentUrl = `${BASE_URL}${req.path}`;
  let title = 'صافرة 90 | بث مباشر وأخبار المباريات';
  let description = 'موقع صافرة 90 يقدم لكم تغطية شاملة لجميع المباريات، بث مباشر، نتائج، إحصائيات، وأخبار كرة القدم لحظة بلحظة.';
  let imageUrl = `${BASE_URL}/logo.png`;
  let type = 'website';
  let jsonLd: any = null;
  let status = 200;

  try {
    if (req.path === '/') {
      jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "صافرة 90",
        "url": BASE_URL,
        "potentialAction": {
          "@type": "SearchAction",
          "target": `${BASE_URL}/search?q={search_term_string}`,
          "query-input": "required name=search_term_string"
        }
      };
      
    } else if (req.path.startsWith('/match/')) {
      const slug = req.path.split('/')[2];
      const matchId = getIdFromSlug(slug);
      
      if (matchId) {
        const doc = await firestore.collection('matches').doc(matchId).get();
        if (doc.exists) {
          const data = doc.data() || {};
          const homeTeam = data.homeTeamName || (typeof data.homeTeam === 'object' ? data.homeTeam.name : data.homeTeam) || 'فريق 1';
          const awayTeam = data.awayTeamName || (typeof data.awayTeam === 'object' ? data.awayTeam.name : data.awayTeam) || 'فريق 2';
          const league = data.leagueName || (typeof data.league === 'object' ? data.league.name : data.league) || 'بطولة';
          
          title = `مباراة ${homeTeam} ضد ${awayTeam} - ${league} | صافرة 90`;
          description = `تابع تفاصيل مباراة ${homeTeam} و ${awayTeam} في ${league}. البث المباشر، التشكيلات، والنتائج لحظة بلحظة على صافرة 90.`;
          type = 'SportsEvent';
          
          jsonLd = {
            "@context": "https://schema.org",
            "@type": "SportsEvent",
            "name": `${homeTeam} vs ${awayTeam}`,
            "description": description,
            "startDate": data.utcDate || new Date().toISOString(),
            "homeTeam": { "@type": "SportsTeam", "name": homeTeam },
            "awayTeam": { "@type": "SportsTeam", "name": awayTeam }
          };
        } else {
          // Check WC pattern
          const isWcPattern = matchId.includes('2026-m-') || matchId.includes('2022-m-') || matchId.startsWith('wc-');
          if (!isWcPattern) {
            status = 404;
            title = 'الصفحة غير موجودة | صافرة 90';
          }
        }
      }
      
    } else if (req.path.startsWith('/news/')) {
      const slug = req.path.split('/')[2];
      const newsId = getIdFromSlug(slug);
      
      if (newsId) {
        const doc = await firestore.collection('news').doc(newsId).get();
        if (doc.exists) {
          const data = doc.data() || {};
          title = `${data.title || 'أخبار الرياضة'} | صافرة 90`;
          description = data.summary || data.snippet || (data.content ? data.content.substring(0, 150) : '') || title;
          imageUrl = data.imageUrl || data.image || imageUrl;
          type = 'article';
          
          jsonLd = {
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            "headline": title,
            "image": [ imageUrl ],
            "datePublished": data.publishedAt || data.date || new Date().toISOString(),
            "author": [{
              "@type": "Organization",
              "name": data.source || "صافرة 90"
            }]
          };
        }
      }
      
    } else if (req.path.startsWith('/league/')) {
      const slug = req.path.split('/')[2];
      const leagueId = getIdFromSlug(slug);
      
      if (leagueId) {
        title = `تفاصيل ومباريات البطولة | صافرة 90`;
        description = `تابع أحدث مباريات وترتيب وأخبار البطولة على صافرة 90.`;
        jsonLd = {
            "@context": "https://schema.org",
            "@type": "SportsOrganization",
            "name": title
        };
      }
      
    } else if (req.path.startsWith('/team/')) {
      const slug = req.path.split('/')[2];
      const teamId = getIdFromSlug(slug);
      
      if (teamId) {
        title = `أخبار ومباريات الفريق | صافرة 90`;
        description = `تابع أحدث مباريات وأخبار فريقك المفضل على صافرة 90.`;
        jsonLd = {
            "@context": "https://schema.org",
            "@type": "SportsTeam",
            "name": title
        };
      }
    } else if (req.path === '/news') {
      title = 'أخبار الرياضة | صافرة 90';
      description = 'تابع أحدث أخبار كرة القدم المحلية والعالمية، انتقالات، تصريحات، وتقارير حصرية على صافرة 90.';
    } else if (req.path === '/world-cup-2026') {
      title = 'كأس العالم 2026 | صافرة 90';
      description = 'تغطية شاملة لبطولة كأس العالم 2026، المباريات، المجموعات، والإحصائيات.';
    }

    const metaHtml = generateMetaHtml(title, description, currentUrl, imageUrl, jsonLd, type);
    injectAndSend(metaHtml, status);
  } catch (error) {
    console.error(`[SEO] Error generating meta for ${req.path}:`, error);
    // Fallback to default index.html on error
    const defaultMeta = generateMetaHtml(title, description, currentUrl);
    injectAndSend(defaultMeta, 200);
  }
};
