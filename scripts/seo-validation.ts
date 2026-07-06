
import axios from 'axios';
import * as cheerio from 'cheerio';

async function validateUrl(url: string): Promise<any> {
  try {
    const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(response.data);
    
    const results = {
      url,
      status: response.status,
      title: $('title').text(),
      hasNoIndex: $('meta[name="robots"][content*="noindex"]').length > 0,
      canonical: $('link[rel="canonical"]').attr('href'),
      metaDescription: $('meta[name="description"]').attr('content'),
      ogImage: $('meta[property="og:image"]').attr('content'),
      hasSchema: $('script[type="application/ld+json"]').length > 0,
    };
    return results;
  } catch (e: any) {
    return { url, status: e.response ? e.response.status : 'ERR', error: e.message };
  }
}

async function runValidation() {
  const host = 'http://localhost:3000';
  const sitemaps = [
    '/sitemap-news.xml',
    '/sitemap-matches.xml',
    '/sitemap-leagues.xml'
  ];

  console.log(`--- SEO Indexing Readiness Audit — ${new Date().toISOString()} ---\n`);

  for (const sitemap of sitemaps) {
    console.log(`\nValidating ${sitemap}...`);
    try {
      const response = await axios.get(host + sitemap);
      const $ = cheerio.load(response.data, { xmlMode: true });
      const urls = $('loc').map((i, el) => $(el).text()).get().slice(0, 3); // Sample 3 per sitemap
      
      for (const url of urls) {
        const result = await validateUrl(url);
        console.log(`URL: ${result.url}`);
        console.log(`  - Status: ${result.status}`);
        if(result.status === 200) {
            console.log(`  - Title: ${result.title?.substring(0, 50)}...`);
            console.log(`  - Canonical: ${result.canonical ? 'Found' : 'MISSING'}`);
            console.log(`  - NoIndex: ${result.hasNoIndex ? 'YES (ISSUE)' : 'No'}`);
            console.log(`  - MetaDesc: ${result.metaDescription ? 'Found' : 'MISSING'}`);
            console.log(`  - OGImage: ${result.ogImage ? 'Found' : 'MISSING'}`);
            console.log(`  - Schema: ${result.hasSchema ? 'Found' : 'MISSING'}`);
        } else {
            console.log(`  - Error: ${result.error}`);
        }
      }
    } catch (e: any) {
      console.error(`FAILED ${sitemap}: ${e.message}`);
    }
  }
}

runValidation();
