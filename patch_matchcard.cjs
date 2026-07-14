const fs = require('fs');
const file = '/app/applet/src/components/MatchCard.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace both occurrences of the placeholder badge
const target = `{typeof match.homeTeam === 'object' && (match.homeTeam as any).isPlaceholder && (
                <span className="text-[8px] md:text-[9px] bg-amber-400/10 text-amber-500 px-1.5 py-0.5 rounded-full border border-amber-400/20 whitespace-nowrap flex items-center gap-1"> 
                  <span>🏆</span> بانتظار تحديد الفريق
                </span>
              )}`;

const replacement = `{typeof window !== 'undefined' && window.location.pathname.startsWith('/admin') && typeof match.homeTeam === 'object' && (match.homeTeam as any).isPlaceholder && (
                <span className="text-[8px] md:text-[9px] bg-amber-400/10 text-amber-500 px-1.5 py-0.5 rounded-full border border-amber-400/20 whitespace-nowrap flex items-center gap-1"> 
                  <span>🏆</span> بانتظار تحديد الفريق
                </span>
              )}`;

content = content.replace(target, replacement);

const target2 = `{typeof match.awayTeam === 'object' && (match.awayTeam as any).isPlaceholder && (
                <span className="text-[8px] md:text-[9px] bg-amber-400/10 text-amber-500 px-1.5 py-0.5 rounded-full border border-amber-400/20 whitespace-nowrap flex items-center gap-1"> 
                  <span>🏆</span> بانتظار تحديد الفريق
                </span>
              )}`;

const replacement2 = `{typeof window !== 'undefined' && window.location.pathname.startsWith('/admin') && typeof match.awayTeam === 'object' && (match.awayTeam as any).isPlaceholder && (
                <span className="text-[8px] md:text-[9px] bg-amber-400/10 text-amber-500 px-1.5 py-0.5 rounded-full border border-amber-400/20 whitespace-nowrap flex items-center gap-1"> 
                  <span>🏆</span> بانتظار تحديد الفريق
                </span>
              )}`;

content = content.replace(target2, replacement2);

fs.writeFileSync(file, content);
console.log('Patched MatchCard');
