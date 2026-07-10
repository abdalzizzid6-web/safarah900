
export const escapeXml = (unsafe: string) => {
  if (typeof unsafe !== 'string') return '';
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
    return c;
  });
};

export const generateSitemapXml = (urls: { loc: string; lastmod?: string; changefreq?: string; priority?: string }[]) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${escapeXml(u.loc)}</loc>${u.lastmod ? `
    <lastmod>${u.lastmod}</lastmod>` : ''}${u.changefreq ? `
    <changefreq>${u.changefreq}</changefreq>` : ''}${u.priority ? `
    <priority>${u.priority}</priority>` : ''}
  </url>`).join('\n')}
</urlset>`;
};

export const generateNewsSitemapXml = (urls: { loc: string; title: string; publicationDate: string; name: string; language: string }[]) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls.map(u => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(u.name)}</news:name>
        <news:language>${u.language}</news:language>
      </news:publication>
      <news:publication_date>${u.publicationDate}</news:publication_date>
      <news:title>${escapeXml(u.title)}</news:title>
    </news:news>
  </url>`).join('\n')}
</urlset>`;
};

export const generateImageSitemapXml = (urls: { loc: string; images: { loc: string; title?: string; caption?: string }[] }[]) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.map(u => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
${u.images.map(img => `    <image:image>
      <image:loc>${escapeXml(img.loc)}</image:loc>${img.title ? `
      <image:title>${escapeXml(img.title)}</image:title>` : ''}${img.caption ? `
      <image:caption>${escapeXml(img.caption)}</image:caption>` : ''}
    </image:image>`).join('\n')}
  </url>`).join('\n')}
</urlset>`;
};

export const generateSitemapIndexXml = (sitemaps: string[]) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(s => `  <sitemap>
    <loc>${escapeXml(s)}</loc>
  </sitemap>`).join('\n')}
</sitemapindex>`;
};
