import { SeoArticle } from '../types';

export const generateNewsArticleSchema = (article: SeoArticle) => {
  const headline = article.title || 'أخبار صافرة 90';
  
  // Grab short description
  let description = article.seo?.description || article.summary || '';
  if (!description) {
    const plainContent = article.content 
      ? (typeof article.content === 'object' 
          ? (article.content.fullText || article.content.htmlContent) 
          : article.content)
      : '';
    const textOnly = typeof plainContent === 'string' ? plainContent.replace(/<[^>]*>/g, '') : '';
    description = textOnly.substring(0, 150) || headline;
  }
  
  const mainImage = article.mainImage || article.image || 'https://korea90.xyz/og-image.png';
  const canonicalUrl = article.seo?.canonicalUrl || `https://korea90.xyz/news/${article.slug || article.id}`;
  
  // For datePublished
  let publishedDate = new Date().toISOString();
  if (article.createdAt) {
    if (typeof article.createdAt === 'string') {
      publishedDate = article.createdAt;
    } else if (typeof article.createdAt === 'object' && 'seconds' in article.createdAt) { // Firestore Timestamp
      publishedDate = new Date(article.createdAt.seconds * 1000).toISOString();
    } else if (typeof (article.createdAt as any).toDate === 'function') {
      publishedDate = (article.createdAt as any).toDate().toISOString();
    }
  }

  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": headline,
    "description": description.trim().substring(0, 160),
    "image": [mainImage],
    "datePublished": publishedDate,
    "dateModified": publishedDate,
    "author": {
      "@type": "Organization",
      "name": "صافرة 90",
      "url": "https://korea90.xyz"
    },
    "publisher": {
      "@type": "Organization",
      "name": "صافرة 90",
      "logo": {
        "@type": "ImageObject",
        "url": "https://korea90.xyz/favicon-32.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonicalUrl
    }
  };
};
