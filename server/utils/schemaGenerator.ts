
export const generateBaseSchema = (url: string) => [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "صافرة 90",
    "url": "https://www.korea90.xyz",
    "logo": "https://www.korea90.xyz/logo-master.png",
    "sameAs": [
        "https://twitter.com/safara90",
        "https://facebook.com/safara90"
    ]
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": "https://www.korea90.xyz/",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://www.korea90.xyz/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  }
];

export const generateNewsSchema = (data: any, url: string) => ({
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": url
  },
  "headline": data.title,
  "alternativeHeadline": data.title,
  "description": data.excerpt || data.content?.substring(0, 160),
  "image": data.image || 'https://www.korea90.xyz/logo-master.png',
  "author": {
    "@type": "Organization",
    "name": "صافرة 90"
  },
  "publisher": {
    "@type": "Organization",
    "name": "صافرة 90",
    "logo": {
      "@type": "ImageObject",
      "url": "https://www.korea90.xyz/logo-master.png"
    }
  },
  "datePublished": data.publishDate?.toDate?.()?.toISOString() || data.publishDate,
  "dateModified": data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
  "articleSection": data.category || "أخبار",
  "inLanguage": "ar",
  "isAccessibleForFree": "True",
  "url": url
});
