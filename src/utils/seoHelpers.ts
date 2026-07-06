/**
 * SEO & Open Graph Media Helpers
 * Dynamic responsive SVG builder representing matches beautifully.
 */

export function generateDynamicOgImage(
  homeTeam: string,
  awayTeam: string,
  homeLogo?: string,
  awayLogo?: string,
  competition?: string,
  dateStr?: string,
  scoreStr?: string
): string {
  const compText = (competition || "البطولة").toUpperCase();
  const dateFormatted = dateStr || "اليوم";
  const scoreText = scoreStr || "VS";

  // Clean layout paths or realistic fallback visuals in case of remote link constraints
  const homeBadge = homeLogo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(homeTeam)}&backgroundColor=0f172a&fontFamily=Arial&color=ffffff`;
  const awayBadge = awayLogo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(awayTeam)}&backgroundColor=0f172a&fontFamily=Arial&color=ffffff`;

  // Constructing a visually stunning SVG showing the match information.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#05050c" />
        <stop offset="50%" stop-color="#0f111a" />
        <stop offset="100%" stop-color="#151b30" />
      </linearGradient>
      <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#10b981" />
        <stop offset="100%" stop-color="#059669" />
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="12" stdDeviation="12" flood-opacity="0.6" flood-color="#000000" />
      </filter>
    </defs>
    
    <!-- Outer background border gradient & rect -->
    <rect width="1200" height="630" fill="url(#bg)" />
    <rect width="1200" height="630" fill="none" stroke="url(#primaryGrad)" stroke-width="8" opacity="0.45" />

    <!-- Decorative football field textures -->
    <path d="M 600,0 L 600,630 M 600,315 A 120,120 0 1,1 599,315 Z" stroke="#334155" stroke-width="3" fill="none" opacity="0.3" />
    <rect x="0" y="100" width="160" height="430" stroke="#334155" stroke-width="3" fill="none" opacity="0.2" />
    <rect x="1040" y="100" width="160" height="430" stroke="#334155" stroke-width="3" fill="none" opacity="0.2" />
    
    <!-- Top Bar Title -->
    <rect x="400" y="0" width="400" height="60" rx="10" fill="#111827" stroke="#1f2937" stroke-width="2" />
    <text x="600" y="40" font-family="'Segoe UI', Roboto, sans-serif, Arial" font-size="22" font-weight="900" fill="#10b981" text-anchor="middle" letter-spacing="3">
      ${compText}
    </text>
    
    <!-- Background VS Label -->
    <text x="600" y="370" font-family="'Segoe UI', Roboto, sans-serif, Arial" font-size="220" font-weight="900" fill="#334155" text-anchor="middle" opacity="0.12">
      VS
    </text>
    
    <!-- Home Team representation -->
    <g transform="translate(180, 0)">
      <!-- Circle frame -->
      <circle cx="150" cy="270" r="115" fill="#1e293b" stroke="#10b981" stroke-width="4" filter="url(#shadow)" />
      <clipPath id="homeClip">
        <circle cx="150" cy="270" r="110" />
      </clipPath>
      <!-- Logo image -->
      <image href="${homeBadge}" x="40" y="160" width="220" height="220" clip-path="url(#homeClip)" />
      <!-- Label -->
      <text x="150" y="450" font-family="'Segoe UI', Roboto, sans-serif, 'PingFang SC', Arial" font-size="38" font-weight="900" fill="#ffffff" text-anchor="middle" filter="url(#shadow)">
        ${homeTeam}
      </text>
    </g>
    
    <!-- Center Score container badge -->
    <g transform="translate(600, 270)">
      <rect x="-100" y="-60" width="200" height="120" rx="20" fill="url(#primaryGrad)" filter="url(#shadow)" />
      <text x="0" y="20" font-family="'Segoe UI', Roboto, sans-serif, Arial" font-size="64" font-weight="900" fill="#000000" text-anchor="middle">
        ${scoreText}
      </text>
      <!-- Sub-label live status -->
      <rect x="-60" y="80" width="120" height="35" rx="8" fill="#ef4444" />
      <text x="0" y="103" font-family="'Segoe UI', Roboto, sans-serif, Arial" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="1">
        LIVE بـث مـبا شـر
      </text>
    </g>
    
    <!-- Away Team representation -->
    <g transform="translate(720, 0)">
      <!-- Circle frame -->
      <circle cx="150" cy="270" r="115" fill="#1e293b" stroke="#10b981" stroke-width="4" filter="url(#shadow)" />
      <clipPath id="awayClip">
        <circle cx="150" cy="270" r="110" />
      </clipPath>
      <!-- Logo image -->
      <image href="${awayBadge}" x="40" y="160" width="220" height="220" clip-path="url(#awayClip)" />
      <!-- Label -->
      <text x="150" y="450" font-family="'Segoe UI', Roboto, sans-serif, 'PingFang SC', Arial" font-size="38" font-weight="900" fill="#ffffff" text-anchor="middle" filter="url(#shadow)">
        ${awayTeam}
      </text>
    </g>
    
    <!-- Bottom Site Tagline -->
    <text x="600" y="555" font-family="'Segoe UI', Roboto, sans-serif, Arial" font-size="24" font-weight="750" fill="#94a3b8" text-anchor="middle">
      ${dateFormatted} • Safara 90 البث المباشر
    </text>
    <text x="600" y="590" font-family="'Segoe UI', Roboto, sans-serif, Arial" font-size="14" font-weight="bold" fill="#64748b" text-anchor="middle" letter-spacing="1">
      WWW.KOREA90.XYZ
    </text>
  </svg>`;

  // Safely encode to btoa for data-uri
  try {
    const base64Svg = btoa(unescape(encodeURIComponent(svg)));
    return `data:image/svg+xml;base64,${base64Svg}`;
  } catch (err) {
    // Elegant text fallback or static standard link if base64 conversion hits string boundaries
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(homeTeam + " vs " + awayTeam)}&backgroundColor=0f172a&fontFamily=Arial`;
  }
}
