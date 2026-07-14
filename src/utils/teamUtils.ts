
import { FIFA_TO_ISO2 } from '../services/worldCupConstants';

const TEAM_LOGOS: Record<string, string> = {
  "Egypt": "https://upload.wikimedia.org/wikipedia/commons/f/fe/Flag_of_Egypt.svg",
  "Saudi Arabia": "https://upload.wikimedia.org/wikipedia/commons/0/0d/Flag_of_Saudi_Arabia.svg",
  "Brazil": "https://upload.wikimedia.org/wikipedia/commons/0/05/Flag_of_Brazil.svg",
  "Germany": "https://upload.wikimedia.org/wikipedia/commons/b/ba/Flag_of_Germany.svg",
  "Argentina": "https://upload.wikimedia.org/wikipedia/commons/1/1a/Flag_of_Argentina.svg",
  "France": "https://upload.wikimedia.org/wikipedia/en/c/c3/Flag_of_France.svg",
  "Spain": "https://upload.wikimedia.org/wikipedia/en/9/9a/Flag_of_Spain.svg",
  "England": "https://upload.wikimedia.org/wikipedia/en/b/be/Flag_of_England.svg",
  "Portugal": "https://upload.wikimedia.org/wikipedia/commons/5/5c/Flag_of_Portugal.svg",
  "Morocco": "https://upload.wikimedia.org/wikipedia/commons/2/2c/Flag_of_Morocco.svg",
  "Tunisia": "https://upload.wikimedia.org/wikipedia/commons/c/ce/Flag_of_Tunisia.svg",
  "Algeria": "https://upload.wikimedia.org/wikipedia/commons/7/77/Flag_of_Algeria.svg",
  "Qatar": "https://upload.wikimedia.org/wikipedia/commons/6/65/Flag_of_Qatar.svg",
  "Japan": "https://upload.wikimedia.org/wikipedia/en/9/9e/Flag_of_Japan.svg",
  "South Korea": "https://upload.wikimedia.org/wikipedia/commons/0/09/Flag_of_South_Korea.svg",
};

export function getTeamLogoUrl(logoUrl: string | undefined | null, teamName: string, tla?: string): string {
  if (logoUrl && logoUrl.trim() !== '' && !logoUrl.includes('placeholder')) return logoUrl;
  
  if (teamName && TEAM_LOGOS[teamName]) return TEAM_LOGOS[teamName];
  
  // Try to use FIFA code to get flag from CDN
  if (tla && FIFA_TO_ISO2[tla]) {
    return `https://flagcdn.com/w160/${FIFA_TO_ISO2[tla]}.png`;
  }
  
  // Try to find by name in the FIFA_TO_ISO2 keys if the name is a 3-letter code
  if (teamName && teamName.length === 3 && FIFA_TO_ISO2[teamName.toUpperCase()]) {
    return `https://flagcdn.com/w160/${FIFA_TO_ISO2[teamName.toUpperCase()]}.png`;
  }

  return getFallbackImageUrl(teamName || 'Team');
}

export function getFallbackImageUrl(name: string): string {
  const isAdmin = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
  if (isAdmin) {
    const seed = name || 'T';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(seed)}&background=random&color=fff&size=128`;
  }
  // Transparent pixel for production
  return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
}

export function handleImageError(e: React.SyntheticEvent<HTMLImageElement, Event>, fallbackUrl: string) {
  const target = e.currentTarget;
  if (target.src === fallbackUrl) return; // Already tried
  target.src = fallbackUrl;
}

