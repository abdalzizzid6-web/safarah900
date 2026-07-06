import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import SEO from '../components/SEO';
import { Helmet } from 'react-helmet-async';

export interface BrandingSettings {
  siteName: string;
  siteDescription: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
  };
  logos: {
    mainLogo: string;
    whiteLogo: string;
    darkLogo: string;
    favicon: string;
    appleTouchIcon: string;
    ogImage: string;
    favicon16: string;
    favicon32: string;
    icon192: string;
    icon512: string;
  };
}

const defaultBranding: BrandingSettings = {
  siteName: "صافرة 90",
  siteDescription: "تطبيق البث المباشر والأخبار الرياضية الأول - تغطية حصرية لكافة البطولات.",
  colors: {
    primary: "#FFD700",
    secondary: "#FFB800",
    background: "#0F0F10",
    surface: "#1A1A1E",
    text: "#F5F5F7",
    textSecondary: "#94a3b8"
  },
  logos: {
    mainLogo: "/safera-logo-512.png",
    whiteLogo: "/safera-logo-512.png",
    darkLogo: "/safera-logo-512.png",
    favicon: "/favicon.ico",
    appleTouchIcon: "/apple-touch-icon.png",
    ogImage: "/safera-logo-512.png",
    favicon16: "/favicon-16.png",
    favicon32: "/favicon-32.png",
    icon192: "/safera-logo-512.png",
    icon512: "/safera-logo-512.png"
  }
};

const BrandingContext = createContext<BrandingSettings>(defaultBranding);

export const useBranding = () => useContext(BrandingContext);

export const BrandingProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [branding, setBranding] = useState<BrandingSettings>(defaultBranding);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const docRef = doc(db, "settings", "branding");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const fetchedData = { ...defaultBranding, ...docSnap.data() } as BrandingSettings;
          setBranding(fetchedData);
          try {
            localStorage.setItem('safara90_cached_branding', JSON.stringify(fetchedData));
          } catch (e) {
            console.warn('[BrandingContext] Failed to write fallback cache:', e);
          }
        }
      } catch (err: any) {
        // Safe, non-verbose check for quota/resource exhausted
        const isQuota = err?.message?.toLowerCase().includes('quota') || 
                        err?.message?.toLowerCase().includes('exhausted') || 
                        err?.code === 'resource-exhausted';
        if (isQuota) {
          console.warn("[BrandingContext] Quota limit exceeded. Loading branding from fallback storage...");
        } else {
          console.error("Failed to fetch branding settings:", err);
        }

        try {
          const cached = localStorage.getItem('safara90_cached_branding');
          if (cached) {
            setBranding(JSON.parse(cached));
          }
        } catch (cacheErr) {
          console.warn('[BrandingContext] Failed to load branding from local storage fallback:', cacheErr);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchBranding();
  }, []);

  return (
    <BrandingContext.Provider value={branding}>
      <Helmet>
        <title>{branding.siteName}</title>
        <meta name="description" content={branding.siteDescription} />
        <meta name="theme-color" content={branding.colors.primary} />
        <meta property="og:site_name" content={branding.siteName} />
        <meta property="og:title" content={branding.siteName} />
        <meta property="og:description" content={branding.siteDescription} />
        <meta property="og:image" content={branding.logos.ogImage || branding.logos.mainLogo} />
        <meta name="twitter:title" content={branding.siteName} />
        <meta name="twitter:description" content={branding.siteDescription} />
        <meta name="twitter:image" content={branding.logos.ogImage || branding.logos.mainLogo} />
        <link rel="icon" type="image/png" sizes="32x32" href={branding.logos.favicon32 || branding.logos.favicon} />
        <link rel="icon" type="image/png" sizes="16x16" href={branding.logos.favicon16 || branding.logos.favicon} />
        <link rel="icon" type="image/x-icon" href={branding.logos.favicon} />
        <link rel="apple-touch-icon" href={branding.logos.appleTouchIcon || branding.logos.mainLogo} />
        <meta name="apple-mobile-web-app-title" content={branding.siteName} />
        <style>{`
          :root {
            --color-primary: ${branding.colors.primary};
            --color-secondary: ${branding.colors.secondary};
            --color-background: ${branding.colors.background};
            --color-surface: ${branding.colors.surface};
            --color-text: ${branding.colors.text};
            --color-text-secondary: ${branding.colors.textSecondary};
          }
        `}</style>
      </Helmet>
      {/* Dynamic manifest implementation via JS injected base64 manifest to bypass need for static file */}
      <Helmet>
        {branding.siteName !== defaultBranding.siteName && (
          <link rel="manifest" href={`data:application/manifest+json;utf8,${encodeURIComponent(JSON.stringify({
            name: branding.siteName,
            short_name: branding.siteName,
            description: branding.siteDescription,
            start_url: "/",
            display: "standalone",
            background_color: branding.colors.background,
            theme_color: branding.colors.primary,
            icons: [
              {
                src: branding.logos.icon192 || branding.logos.mainLogo,
                sizes: "192x192",
                type: "image/png"
              },
              {
                src: branding.logos.icon512 || branding.logos.mainLogo,
                sizes: "512x512",
                type: "image/png"
              },
              {
                src: branding.logos.icon512 || branding.logos.mainLogo,
                sizes: "512x512",
                type: "image/png",
                purpose: "maskable"
              }
            ]
          }))}`} />
        )}
      </Helmet>
      {children}
    </BrandingContext.Provider>
  );
};
