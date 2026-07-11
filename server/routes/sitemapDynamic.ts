import { Request, Response } from 'express';
import { SitemapStream, streamToPromise } from 'sitemap';
import { collections } from '../firestore/collections';

export async function handleSitemap(req: Request, res: Response) {
    try {
        const type = req.params.type; // main, matches, news
        const smStream = new SitemapStream({ hostname: 'https://www.korea90.xyz' });
        
        // Add static routes if main
        if (type === 'main') {
            smStream.write({ url: '/', changefreq: 'daily', priority: 1.0 });
        }
        
        // Fetch data based on type
        if (type === 'matches') {
            const matchesSnapshot = await collections.matches().limit(1000).get();
            for (const doc of matchesSnapshot.docs) {
                smStream.write({ url: `/match/${doc.id}`, changefreq: 'hourly', priority: 0.8, lastmod: doc.data().updatedAt });
            }
        } else if (type === 'news') {
            const newsSnapshot = await collections.news().limit(1000).get();
            for (const doc of newsSnapshot.docs) {
                const data = doc.data();
                smStream.write({ 
                    url: `/news/${doc.id}`, 
                    changefreq: 'daily', 
                    priority: 0.7,
                    lastmod: data.publishedAt || data.createdAt
                });
            }
        }
        
        smStream.end();
        const data = await streamToPromise(smStream);
        res.header('Content-Type', 'application/xml');
        res.send(data);
    } catch (e) {
        console.error('Failed to generate dynamic sitemap:', e);
        res.status(500).send('Error generating sitemap');
    }
}
