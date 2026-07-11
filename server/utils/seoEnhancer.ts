
import * as cheerio from 'cheerio';

export const enhanceSeo = (html: string, options: {
    title?: string,
    description?: string,
    url?: string,
    image?: string,
    type?: string,
    structuredData?: any
}) => {
    const $ = cheerio.load(html);
    const { title, description, url, image = 'https://www.korea90.xyz/logo-master.png', type = 'article', structuredData } = options;
    const fullTitle = title ? `${title} | صافرة 90` : 'صافرة 90';
    
    // Cleanup
    $('title').remove();
    $('meta[name="description"]').remove();
    $('meta[property^="og:"]').remove();
    $('link[rel="canonical"]').remove();
    $('meta[name^="twitter:"]').remove();
    
    // Inject
    $('head').prepend(`<title>${fullTitle}</title>`);
    $('head').append(`<meta name="description" content="${description || 'صافرة 90 - بوابتك لعالم كرة القدم'}" />`);
    $('head').append(`<meta property="og:title" content="${fullTitle}" />`);
    $('head').append(`<meta property="og:description" content="${description || ''}" />`);
    $('head').append(`<meta property="og:url" content="${url || 'https://www.korea90.xyz'}" />`);
    $('head').append(`<meta property="og:image" content="${image}" />`);
    $('head').append(`<meta property="og:type" content="${type}" />`);
    $('head').append(`<link rel="canonical" href="${url || 'https://www.korea90.xyz'}" />`);
    $('head').append(`<meta property="og:locale" content="ar_AR" />`);
    $('head').append(`<meta name="twitter:card" content="summary_large_image" />`);
    $('head').append(`<meta name="twitter:title" content="${fullTitle}" />`);
    $('head').append(`<meta name="twitter:description" content="${description || ''}" />`);
    $('head').append(`<meta name="twitter:image" content="${image}" />`);

    // Structured Data
    if (structuredData) {
        $('head').append(`<script type="application/ld+json">${JSON.stringify(structuredData, null, 2)}</script>`);
    }

    return $.html();
};

