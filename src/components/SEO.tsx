import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogType?: 'website' | 'article' | 'sports_event' | string;
  ogImage?: string;
  twitterHandle?: string;
  structuredData?: object;
  schema?: object | string;
  sportsEvent?: {
    name: string;
    startDate: string;
    location?: string;
    homeTeam: string;
    homeTeamLink?: string;
    awayTeam: string;
    awayTeamLink?: string;
    leagueName?: string;
    leagueLink?: string;
    status: 'Scheduled' | 'Live' | 'Finished';
  };
  article?: {
    headline: string;
    description: string;
    datePublished: string;
    dateModified?: string;
    author?: string;
    publisher?: string;
    image?: string;
  };
  noindex?: boolean;
  faq?: { question: string; answer: string; }[];
  breadcrumbs?: { name: string; item: string; }[];
}

const DEFAULT_TITLE = 'صافرة 90 | تغطية رياضية مباشرة وحصرية لمباريات اليوم والأخبار الكروية';
const DEFAULT_DESCRIPTION = 'بوابتك الرياضية الأولى لمتابعة نتائج مباريات اليوم المباشرة، أخبار كرة القدم، جدول الترتيب، وإحصائيات الدوري والبطولات العربية والعالمية وكأس العالم 2026.';
const DEFAULT_KEYWORDS = 'مباريات اليوم, نتائج المباريات المباشرة, أخبار كرة القدم, صافرة 90, ترتيب الدوري, كأس العالم 2026, بث مباشر, كورة 90';
const SITE_URL = 'https://korea90.xyz';
const DEFAULT_OG_IMAGE = `${SITE_URL}/logo-master.png`;

export default function SEO({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  canonical,
  ogType = 'website',
  ogImage = DEFAULT_OG_IMAGE,
  twitterHandle = '@Safara90',
  structuredData,
  sportsEvent,
  article,
  noindex = false,
  faq,
  breadcrumbs
}: SEOProps) {
  const fullTitle = title === DEFAULT_TITLE ? title : `${title} | صافرة 90`;
  
  // Safe window check for canonical
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const pageUrl = canonical || `${SITE_URL}${pathname}`;

  // Organization Schema
  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    'name': 'صافرة 90 - Safara 90',
    'alternateName': ['صافرة 90', 'Safara 90', 'كورة 90'],
    'url': SITE_URL,
    'logo': {
      '@type': 'ImageObject',
      'url': `${SITE_URL}/safera-logo-512.png`,
      'width': 512,
      'height': 512
    },
    'sameAs': [
      'https://twitter.com/Safara90',
      'https://facebook.com/Safara90'
    ]
  };

  // Website Schema
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    'url': SITE_URL,
    'name': 'صافرة 90',
    'publisher': {
      '@id': `${SITE_URL}/#organization`
    },
    'potentialAction': {
      '@type': 'SearchAction',
      'target': `${SITE_URL}/?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };

  // Breadcrumb Schema
  const breadcrumbElements = [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "الرئيسية",
      "item": SITE_URL
    }
  ];

  if (breadcrumbs && breadcrumbs.length > 0) {
    breadcrumbs.forEach((bc, idx) => {
      breadcrumbElements.push({
        "@type": "ListItem",
        "position": idx + 2,
        "name": bc.name,
        "item": bc.item.startsWith('http') ? bc.item : `${SITE_URL}${bc.item}`
      });
    });
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbElements
  };

  // FAQ Schema
  let faqSchema: any = null;
  if (faq && faq.length > 0) {
    faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faq.map((item) => ({
        "@type": "Question",
        "name": item.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": item.answer
        }
      }))
    };
  }

  let specificSchema: any = null;
  let articleSchema: any = null;

  if (sportsEvent) {
    const statusMap = {
      'Scheduled': 'https://schema.org/EventScheduled',
      'Live': 'https://schema.org/EventScheduled',
      'Finished': 'https://schema.org/EventConcluded'
    };
    specificSchema = {
      '@context': 'https://schema.org',
      '@type': 'SportsEvent',
      'name': sportsEvent.name,
      'startDate': sportsEvent.startDate,
      'eventStatus': statusMap[sportsEvent.status] || 'https://schema.org/EventScheduled',
      'location': {
        '@type': 'Place',
        'name': sportsEvent.location || 'الملعب الرئيسي'
      },
      'competitor': [
        {
          '@type': 'SportsTeam',
          'name': sportsEvent.homeTeam,
          'url': sportsEvent.homeTeamLink ? `${SITE_URL}${sportsEvent.homeTeamLink}` : undefined
        },
        {
          '@type': 'SportsTeam',
          'name': sportsEvent.awayTeam,
          'url': sportsEvent.awayTeamLink ? `${SITE_URL}${sportsEvent.awayTeamLink}` : undefined
        }
      ],
      'organizer': {
        '@type': 'Organization',
        'name': sportsEvent.leagueName || 'صافرة 90',
        'url': sportsEvent.leagueLink ? `${SITE_URL}${sportsEvent.leagueLink}` : SITE_URL
      }
    };
  }

  const shouldUseArticle = article || ogType === 'article';
  if (shouldUseArticle) {
    const pubDate = article?.datePublished || new Date().toISOString();
    articleSchema = {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      'mainEntityOfPage': {
        '@type': 'WebPage',
        '@id': pageUrl
      },
      'headline': article?.headline || fullTitle,
      'description': article?.description || description,
      'datePublished': pubDate,
      'dateModified': article?.dateModified || pubDate,
      'author': {
        '@type': 'Organization',
        'name': article?.author || 'قسم الأخبار | صافرة 90'
      },
      'publisher': {
        '@type': 'Organization',
        'name': article?.publisher || 'صافرة 90',
        'logo': {
          '@type': 'ImageObject',
          'url': `${SITE_URL}/safera-logo-512.png`
        }
      },
      'image': article?.image ? (article.image.startsWith('http') ? article.image : `${SITE_URL}${article.image}`) : (ogImage.startsWith('http') ? ogImage : `${SITE_URL}${ogImage}`)
    };
  }

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={pageUrl} />
      <meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"} />

      {/* hreflang tags */}
      <link rel="alternate" hrefLang="ar" href={pageUrl} />
      <link rel="alternate" hrefLang="x-default" href={pageUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage.startsWith('http') ? ogImage : `${SITE_URL}${ogImage}`} />
      <meta property="og:site_name" content="صافرة 90" />
      <meta property="og:locale" content="ar_SA" />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={pageUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage.startsWith('http') ? ogImage : `${SITE_URL}${ogImage}`} />
      {twitterHandle && <meta name="twitter:site" content={twitterHandle} />}

      {/* Structured Data / JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(orgSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(websiteSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
      </script>
      {specificSchema && (
        <script type="application/ld+json">
          {JSON.stringify(specificSchema)}
        </script>
      )}
      {articleSchema && (
        <script type="application/ld+json">
          {JSON.stringify(articleSchema)}
        </script>
      )}
      {faqSchema && (
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      )}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}

