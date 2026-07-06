
import axios from 'axios';
import * as cheerio from 'cheerio';

async function runDiagnostic() {
  const host = 'http://localhost:3000';
  const sitemaps = [
    '/sitemap.xml',
    '/sitemap-news.xml',
    '/sitemap-matches.xml',
    '/sitemap-leagues.xml',
    '/sitemap-teams.xml',
    '/sitemap-players.xml'
  ];

  console.log(`--- SEO Diagnostic Report - Simplified — ${new Date().toISOString()} ---\n`);

  for (const sitemap of sitemaps) {
    console.log(`Checking ${sitemap}...`);
    try {
      const response = await axios.get(host + sitemap);
      const xml = response.data;
      
      console.log(`- Status: ${response.status}`);
      console.log(`- Size: ${xml.length} bytes`);

      const $ = cheerio.load(xml, { xmlMode: true });
      const urls = $('loc').map((i, el) => $(el).text()).get();

      console.log(`- Total URLs: ${urls.length}`);
      
      // Sample 3 URLs
      const sampleUrls = urls.slice(0, 3);
      console.log(`- Sample URLs: ${sampleUrls.join(', ')}`);
      
      console.log(`- Result: ${response.status === 200 ? 'PASS' : 'FAIL'}`);
      console.log('-----------------------------------');
    } catch (e: any) {
      console.error(`- FAILED ${sitemap}: ${e.message}`);
    }
  }
}

runDiagnostic();
