import { google } from 'googleapis';

/**
 * Notify Google Indexing API about a URL update or deletion.
 * @param url The URL to be indexed or removed.
 * @param type The type of update: 'URL_UPDATED' or 'URL_DELETED'. Default is 'URL_UPDATED'.
 */
export async function notifyGoogleIndexing(url: string, type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED') {
  try {
    const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!rawKey) {
      console.warn('[Indexing API] Missing FIREBASE_SERVICE_ACCOUNT_KEY. Skipping indexing notification.');
      return;
    }

    let serviceAccount;
    try {
      // Try to clean/parse the key similar to server.ts logic
      const jsonMatch = rawKey.match(/\{[\s\S]*\}/);
      serviceAccount = JSON.parse(jsonMatch ? jsonMatch[0] : rawKey);
    } catch (e) {
      console.error('[Indexing API] Failed to parse service account key:', e);
      return;
    }

    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    const auth = new google.auth.JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: ['https://www.googleapis.com/auth/indexing'],
    });

    const indexing = google.indexing('v3');
    
    console.log(`[Indexing API] Sending notification for: ${url} (${type})`);
    
    const res = await indexing.urlNotifications.publish({
      auth,
      requestBody: {
        url,
        type,
      },
    });

    console.log('[Indexing API] Success:', res.data);
    return res.data;
  } catch (error: any) {
    const errorDetail = error.response?.data ? JSON.stringify(error.response.data, null, 2) : (error.message || error);
    const errorStr = typeof errorDetail === 'string' ? errorDetail : String(errorDetail);
    
    // Broaden the check to include throttling, timeouts, and quota issues
    const isThrottledOrLimited = 
      errorStr.toLowerCase().includes('quota') || 
      errorStr.toLowerCase().includes('limit') || 
      errorStr.toLowerCase().includes('exhausted') || 
      errorStr.toLowerCase().includes('429') || 
      errorStr.toLowerCase().includes('timeout') ||
      errorStr.toLowerCase().includes('deadline');
    
    if (isThrottledOrLimited) {
      // Silently ignore throttling/quota issues to avoid console noise
      return;
    } else {
      console.error('[Indexing API] Error notifying Google:', errorDetail);
    }
    // We don't throw here to avoid breaking the main flow
  }
}
