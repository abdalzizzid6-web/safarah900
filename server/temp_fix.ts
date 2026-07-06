
import { firestore } from '../src/lib/firebase-admin.ts';

async function fixRssSource() {
    try {
        await firestore.collection('rss_sources').doc('kooora_news').update({
            enabled: false,
            status: 'FAILED',
            lastError: 'HTTP 403 Forbidden - Manual Disable'
        });
        console.log('Successfully disabled kooora_news');
    } catch (e) {
        console.error('Failed to disable kooora_news', e);
    }
}
fixRssSource();
