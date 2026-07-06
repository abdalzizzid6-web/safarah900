import React from 'react';
import PremiumStories from '../../premium/components/PremiumStories';
import PremiumNewsSection from '../../premium/components/PremiumNewsSection';
import PremiumHeroSection from '../../premium/matches/PremiumHeroSection';
import PremiumLiveMatchesList from '../../premium/matches/PremiumLiveMatchesList';
import PremiumMatchesScheduleSection from '../../premium/components/PremiumMatchesScheduleSection';
import PremiumCompetitionsSection from '../../premium/components/PremiumCompetitionsSection';
import PremiumTopPlayersSection from '../../premium/components/PremiumTopPlayersSection';
import PremiumStandingsPreview from '../../premium/components/PremiumStandingsPreview';
import { BlockType, HomepageBlock, Match } from '../../types';

export interface SectionProps {
  block: HomepageBlock;
  featuredMatch?: Match;
  excludeLive?: boolean;
}

export const SectionRegistry: Record<BlockType, React.FC<SectionProps>> = {
  [BlockType.HERO]: ({ featuredMatch }) => 
    featuredMatch ? <PremiumHeroSection match={featuredMatch} /> : null,
    
  [BlockType.LIVE_MATCHES]: ({ block }) => 
    <PremiumLiveMatchesList title={block.title} maxItems={(block.dataConfig as any)?.maxItems} />,
    
  [BlockType.TODAY_MATCHES]: ({ block, excludeLive }) => 
    <PremiumMatchesScheduleSection title={block.title} type={block.type} maxItems={(block.dataConfig as any)?.maxItems} excludeLive={excludeLive} />,
    
  [BlockType.TOMORROW_MATCHES]: ({ block }) => 
    <PremiumMatchesScheduleSection title={block.title} type={block.type} maxItems={(block.dataConfig as any)?.maxItems} />,
    
  [BlockType.FINISHED_MATCHES]: ({ block }) => 
    <PremiumMatchesScheduleSection title={block.title} type={block.type} maxItems={(block.dataConfig as any)?.maxItems} />,
    
  [BlockType.BENTO_ACTIONS]: () => 
    <PremiumStories />,
    
  [BlockType.LATEST_NEWS]: ({ block }) => 
    <PremiumNewsSection title={block.title} category={(block.dataConfig as any)?.filterNewsCategory} block={block} />,
    
  [BlockType.FEATURED_NEWS]: ({ block }) => 
    <PremiumNewsSection title={block.title} category={(block.dataConfig as any)?.filterNewsCategory} block={block} />,
    
  [BlockType.TRENDING_NEWS]: ({ block }) => 
    <PremiumNewsSection title={block.title} category={(block.dataConfig as any)?.filterNewsCategory} block={block} />,
    
  [BlockType.BREAKING_NEWS]: ({ block }) => 
    <PremiumNewsSection title={block.title} category={(block.dataConfig as any)?.filterNewsCategory} block={block} />,
    
  [BlockType.LEAGUE_STANDINGS]: ({ block }) => 
    <PremiumStandingsPreview 
      title={block.title} 
      leagueId={Number((block.dataConfig as any)?.leagueId || 39)} 
      leagueName={(block.dataConfig as any)?.leagueName} 
    />,
    
  [BlockType.LEAGUES]: ({ block }) => 
    <PremiumCompetitionsSection title={block.title} />,
    
  [BlockType.TOP_PLAYERS]: ({ block }) => 
    <PremiumTopPlayersSection title={block.title} />,
    
  [BlockType.TOP_GOALSCORERS]: ({ block }) => 
    <div className="p-4 border border-white/10 rounded-xl text-center text-gray-400">كتلة أفضل هدافي الدوري (قريباً)</div>,
    
  [BlockType.POLLS]: ({ block }) => 
    <div className="p-4 border border-white/10 rounded-xl text-center text-gray-400">كتلة الاستفتاء (قريباً)</div>,
    
  [BlockType.ADS]: ({ block }) => {
    const config = (block.dataConfig as any) || {};
    if (config.customHtmlCode) {
      return <div dangerouslySetInnerHTML={{ __html: config.customHtmlCode }} />;
    }
    const imageUrl = config.imageUrl || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&auto=format&fit=crop&q=70';
    const linkUrl = config.linkUrl || '#';
    const title = block.title || 'إعلان ممول';
    return (
      <div className="w-full flex flex-col items-center justify-center p-1">
        <a 
          href={linkUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="block w-full overflow-hidden rounded-2xl border border-white/5 relative group transition-all duration-300 hover:scale-[1.005]"
        >
          <img 
            src={imageUrl} 
            alt={title} 
            referrerPolicy="no-referrer" 
            className="w-full h-auto max-h-48 object-cover object-center transition duration-500 group-hover:scale-105" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
            <span className="text-white text-xs font-black bg-primary text-black px-2.5 py-1 rounded-lg">شاهد العرض المتاح الآن ↗</span>
          </div>
          <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-[9px] font-bold text-gray-300 px-2 py-0.5 rounded-md border border-white/10">إعلان</span>
        </a>
      </div>
    );
  },
  
  [BlockType.VIDEOS]: ({ block }) => {
    const config = (block.dataConfig as any) || {};
    const videos = [
      { id: '1', title: 'ملخص قمة الدوري الإنجليزي ومهرجان الأهداف', duration: '08:45', thumbnail: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop&q=60', url: 'https://www.youtube.com' },
      { id: '2', title: 'أجمل 10 أهداف سجّلها النجوم هذا الأسبوع في الملاعب العربية', duration: '05:20', thumbnail: 'https://images.unsplash.com/photo-1517747614396-d21a78b850e8?w=600&auto=format&fit=crop&q=60', url: 'https://www.youtube.com' }
    ];
    return (
      <div className="space-y-4">
        {block.title && <h3 className="font-black text-sm text-white border-r-4 border-primary pr-2">{block.title}</h3>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {videos.map(vid => (
            <div key={vid.id} className="bg-[#0e1622] border border-white/5 rounded-2xl overflow-hidden group hover:border-white/10 transition duration-300">
              <div className="relative aspect-video bg-black flex items-center justify-center">
                <img src={vid.thumbnail} alt={vid.title} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-102 transition duration-500 opacity-80" />
                <div className="absolute inset-0 bg-black/35 flex items-center justify-center group-hover:bg-black/20 transition duration-300">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-black shadow-lg shadow-primary/20 transform group-hover:scale-110 transition duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5 ml-0.5"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                </div>
                <span className="absolute bottom-2.5 right-2.5 bg-black/70 text-[9px] font-mono text-white px-2 py-0.5 rounded border border-white/5">{vid.duration}</span>
              </div>
              <div className="p-3.5">
                <h4 className="text-xs font-black text-white group-hover:text-primary transition line-clamp-2 leading-relaxed">{vid.title}</h4>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },
  
  [BlockType.CUSTOM_WIDGETS]: ({ block }) => 
    (block.dataConfig as any)?.customHtmlCode ? <div dangerouslySetInnerHTML={{ __html: (block.dataConfig as any).customHtmlCode }} /> : null,
};

export function getSectionComponent(type: BlockType): React.FC<SectionProps> | null {
  return SectionRegistry[type] || null;
}
