import { SitemapStream, streamToPromise } from 'sitemap';
import { createWriteStream } from 'fs';
import path from 'path';
import { collections } from '../firestore/collections';

export async function generateSitemap() {
    console.log('Generating sitemap...');
    try {
        const smStream = new SitemapStream({ hostname: 'https://www.korea90.xyz' });
        
        // Add static routes
        smStream.write({ url: '/', changefreq: 'daily', priority: 1.0 });
        
        // Fetch data
        const matchesSnapshot = await collections.matches().limit(500).get();
        const newsSnapshot = await collections.news().limit(500).get();

        for (const doc of matchesSnapshot.docs) {
            smStream.write({ url: `/match/${doc.id}`, changefreq: 'hourly', priority: 0.8, lastmod: doc.data().updatedAt });
        }
        
        for (const doc of newsSnapshot.docs) {
            const data = doc.data();
            smStream.write({ 
                url: `/news/${doc.id}`, 
                changefreq: 'daily', 
                priority: 0.7,
                lastmod: data.publishedAt || data.createdAt
            });
        }
        
        smStream.end();
        
        const data = await streamToPromise(smStream);
        const outputPath = path.join(process.cwd(), 'public', 'sitemap.xml');
        createWriteStream(outputPath).write(data);
        console.log('Sitemap generated successfully at:', outputPath);
    } catch (e) {
        console.error('Failed to generate sitemap:', e);
    }
}
