import passport from 'passport';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import crypto from 'crypto';
import { firestore } from '../firestore/collections';
import { encrypt, decrypt } from '../utils/crypto';
import { Request, Response, NextFunction } from 'express';

/**
 * Controller to handle Facebook OAuth Initialization
 */
export async function facebookConnect(req: Request, res: Response, next: NextFunction) {
  try {
    const origin = process.env.APP_URL || 'https://korea90.xyz';
    const redirectUri = `${origin}/api/social/callback/facebook`;
    
    // Fetch Facebook credentials from Environment Variables
    const clientID = process.env.FACEBOOK_CLIENT_ID;
    const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;
    
    if (!clientID || !clientSecret) {
      return res.status(400).json({
        error: "لم يتم تهيئة إعدادات الفيسبوك (Facebook) بشكل كامل في متغيرات البيئة. يرجى التأكد من ضبط FACEBOOK_CLIENT_ID و FACEBOOK_CLIENT_SECRET."
      });
    }
    
    const state = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes TTL
    
    // Save state store
    await firestore.collection('social_oauth_states').doc(state).set({
      platform: 'facebook',
      expiresAt,
      createdAt: new Date().toISOString()
    });

    // Debug logging
    console.log('[OAuth Debug] Facebook Connect:', {
      APP_URL: process.env.APP_URL,
      redirect_uri: redirectUri,
      client_id: clientID.substring(0, 5) + '***',
      platform: 'facebook'
    });
    
    const oauthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=pages_manage_posts,pages_read_engagement,publish_to_groups&state=${state}`;
    
    res.json({ url: oauthUrl });
    
  } catch (error: any) {
    res.status(500).json({ error: 'فشل في تهيئة عملية الربط مع فيسبوك: ' + error.message });
  }
}

/**
 * Controller to handle Facebook OAuth Callback
 */
export async function facebookCallback(req: Request, res: Response, next: NextFunction) {
  try {
    const origin = process.env.APP_URL || 'https://korea90.xyz';
    const redirectUri = `${origin}/api/social/callback/facebook`;
    
    // Fetch Facebook credentials from Environment Variables
    const clientID = process.env.FACEBOOK_CLIENT_ID;
    const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;
    
    if (!clientID || !clientSecret) {
      throw new Error("لم يتم العثور على إعدادات فيسبوك في متغيرات البيئة.");
    }
    
    // Re-register Facebook strategy for callback handling
    passport.use('facebook-callback', new FacebookStrategy({
      clientID,
      clientSecret,
      callbackURL: redirectUri,
      profileFields: ['id', 'displayName', 'photos', 'emails']
    }, (accessToken, refreshToken, profile, done) => {
      done(null, { accessToken, refreshToken, profile });
    }));
    
    // Execute passport authenticate callback
    passport.authenticate('facebook-callback', { session: false }, async (err: any, user: any) => {
      if (err || !user) {
        const errMsg = err?.message || 'فشلت عملية المصادقة';
        return res.status(400).send(`
          <html>
            <body>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: 'OAUTH_AUTH_FAILURE', error: "${errMsg}" }, "*");
                }
                window.close();
              </script>
            </body>
          </html>
        `);
      }
      
      const { accessToken, profile } = user;
      let pages: any[] = [];
      
      // Fetch Pages managed by the user
      try {
        const pagesRes = await fetch(`https://graph.facebook.com/me/accounts?fields=name,id,access_token,category,picture&access_token=${accessToken}`);
        if (pagesRes.ok) {
          const pagesData = await pagesRes.json();
          if (pagesData && pagesData.data) {
            pages = pagesData.data.map((page: any) => ({
              id: page.id,
              name: page.name,
              category: page.category || '',
              avatarUrl: page.picture?.data?.url || ''
            }));
          }
        }
      } catch (errPages) {
        console.warn('Failed to fetch Facebook pages profile details:', errPages);
      }
      
      const accountId = `facebook_${profile.id}`;
      const profileAvatar = profile.photos && profile.photos[0] ? profile.photos[0].value : '';
      
      const accountData = {
        platform: 'facebook',
        name: profile.displayName || 'Facebook Account',
        handle: profile.id,
        avatarUrl: profileAvatar,
        accessToken: encrypt(accessToken),
        tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 Days expiration fallback
        status: 'active',
        permissions: ['publish'],
        pages,
        metadata: {
          id: profile.id,
          displayName: profile.displayName,
          emails: profile.emails || []
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Save/Merge the connected account into Firestore
      await firestore.collection('social_accounts').doc(accountId).set(accountData, { merge: true });
      
      // Notify opener window of success and close popup
      res.send(`
        <html>
          <head>
            <title>تم الربط بنجاح</title>
          </head>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', platform: 'facebook' }, "*");
              }
              window.close();
            </script>
          </body>
        </html>
      `);
      
    })(req, res, next);
    
  } catch (error: any) {
    const errMsg = error.message || 'خطأ غير معروف';
    res.status(500).send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_FAILURE', error: "${errMsg}" }, "*");
            }
            window.close();
          </script>
        </body>
      </html>
    `);
  }
}
