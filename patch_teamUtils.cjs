const fs = require('fs');
const file = '/app/applet/src/utils/teamUtils.ts';
let content = fs.readFileSync(file, 'utf8');

const target1 = `export function getFallbackImageUrl(name: string): string {
  // Use UI-Avatars for a clean, deterministic fallback instead of an empty string
  const seed = name || 'T';
  return \`https://ui-avatars.com/api/?name=\${encodeURIComponent(seed)}&background=random&color=fff&size=128\`;
}`;

const replacement1 = `export function getFallbackImageUrl(name: string): string {
  const isAdmin = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
  if (isAdmin) {
    const seed = name || 'T';
    return \`https://ui-avatars.com/api/?name=\${encodeURIComponent(seed)}&background=random&color=fff&size=128\`;
  }
  // Transparent pixel for production
  return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
}`;

content = content.replace(target1, replacement1);

fs.writeFileSync(file, content);
console.log('Patched teamUtils');
