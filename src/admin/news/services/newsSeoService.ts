import { NewsSeo, NewsArticle } from '../types';

export const newsSeoService = {
  // Generate reading time
  calculateReadingTime(content: string): number {
    if (!content) return 1;
    // Strip HTML tags if any
    const cleanContent = content.replace(/<\/?[^>]+(>|$)/g, '');
    const wordCount = cleanContent.trim().split(/\s+/).length;
    // Average reading speed is roughly 200 words per minute
    const readingTime = Math.ceil(wordCount / 200);
    return Math.max(1, readingTime);
  },

  // Generate URL slug from title
  generateSlug(title: string): string {
    return title
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, '-') // Replace spaces with dashes
      .replace(/[^\w\u0600-\u06FF-]/g, '') // Keep words and Arabic characters and dashes
      .replace(/-+/g, '-'); // Remove duplicate dashes
  },

  // Populate dynamic SEO settings
  generateDefaultSeo(title: string, content: string, categories: string[], tags: string[]): NewsSeo {
    const slug = this.generateSlug(title);
    const excerpt = content ? content.replace(/<\/?[^>]+(>|$)/g, '').substring(0, 160) + '...' : '';
    const readingTime = this.calculateReadingTime(content);

    return {
      title,
      slug,
      metaTitle: `${title} - سفارة ٩٠`,
      metaDescription: excerpt,
      canonicalUrl: `https://korea90.xyz/news/${slug}`,
      keywords: [...categories, ...tags],
      includeInSitemap: true,
      readingTime,
      openGraph: {
        title,
        description: excerpt,
      },
      twitterCard: {
        title,
        description: excerpt,
        cardType: 'summary_large_image'
      },
      structuredData: null // Generated dynamically below
    };
  },

  // Generate JSON-LD NewsArticle Structured Data
  generateStructuredData(article: NewsArticle): any {
    const slug = article.seo?.slug || this.generateSlug(article.title);
    const url = `https://korea90.xyz/news/${slug}`;
    const datePublished = article.publishDate || article.createdAt;

    return {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      'mainEntityOfPage': {
        '@type': 'WebPage',
        '@id': url
      },
      'headline': article.title,
      'description': article.excerpt || article.seo?.metaDescription,
      'image': [
        article.featuredImage?.url || 'https://korea90.xyz/images/default-news.png'
      ],
      'datePublished': datePublished,
      'dateModified': article.updatedAt || datePublished,
      'author': {
        '@type': 'Person',
        'name': article.author?.name || 'محرر سفارة ٩٠',
        'jobTitle': article.author?.role || 'محرر رياضي'
      },
      'publisher': {
        '@type': 'Organization',
        'name': 'سفارة ٩٠',
        'logo': {
          '@type': 'ImageObject',
          'url': 'https://korea90.xyz/logo.png'
        }
      }
    };
  }
};
