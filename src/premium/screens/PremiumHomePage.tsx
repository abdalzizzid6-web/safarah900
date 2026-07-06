import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import PremiumStories from '../components/PremiumStories';
import PremiumNewsSection from '../components/PremiumNewsSection';
import PremiumHeroSection from '../matches/PremiumHeroSection';
import PremiumLiveMatchesList from '../matches/PremiumLiveMatchesList';
import PremiumMatchesScheduleSection from '../components/PremiumMatchesScheduleSection';
import PremiumCompetitionsSection from '../components/PremiumCompetitionsSection';
import PremiumTopPlayersSection from '../components/PremiumTopPlayersSection';
import PremiumStandingsPreview from '../components/PremiumStandingsPreview';
import { useHomepageLayout } from '../../hooks/useHomepageLayout';
import { BlockType } from '../../types';
import { featureFlags } from '../../core/config/featureFlags';
import { useMatches as useMatchesV2 } from '../../hooks/useMatchesV2';
import { HomePageRenderer } from '../../core/cms/HomePageRenderer';

// Centralized Component Map
const ComponentMap: Record<string, React.FC<any>> = {
  [BlockType.HERO]: ({ block, match }) => match ? <PremiumHeroSection key={block.id} match={match} /> : null,
  [BlockType.LIVE_MATCHES]: ({ block }) => <PremiumLiveMatchesList key={block.id} title={block.title} maxItems={block.dataConfig?.maxItems} />,
  [BlockType.TODAY_MATCHES]: ({ block }) => <PremiumMatchesScheduleSection key={block.id} title={block.title} type={block.type} maxItems={block.dataConfig?.maxItems} />,
  [BlockType.TOMORROW_MATCHES]: ({ block }) => <PremiumMatchesScheduleSection key={block.id} title={block.title} type={block.type} maxItems={block.dataConfig?.maxItems} />,
  [BlockType.FINISHED_MATCHES]: ({ block }) => <PremiumMatchesScheduleSection key={block.id} title={block.title} type={block.type} maxItems={block.dataConfig?.maxItems} />,
  [BlockType.BENTO_ACTIONS]: ({ block }) => <PremiumStories key={block.id} />,
  [BlockType.LATEST_NEWS]: ({ block }) => <PremiumNewsSection key={block.id} title={block.title} category={block.dataConfig?.filterNewsCategory} />,
  [BlockType.FEATURED_NEWS]: ({ block }) => <PremiumNewsSection key={block.id} title={block.title} category={block.dataConfig?.filterNewsCategory} />,
  [BlockType.TRENDING_NEWS]: ({ block }) => <PremiumNewsSection key={block.id} title={block.title} category={block.dataConfig?.filterNewsCategory} />,
  [BlockType.BREAKING_NEWS]: ({ block }) => <PremiumNewsSection key={block.id} title={block.title} category={block.dataConfig?.filterNewsCategory} />,
  [BlockType.LEAGUE_STANDINGS]: ({ block }) => <PremiumStandingsPreview key={block.id} title={block.title} leagueId={Number(block.dataConfig?.leagueId || 39)} leagueName={block.dataConfig?.leagueName} />,
  [BlockType.LEAGUES]: ({ block }) => <PremiumCompetitionsSection key={block.id} title={block.title} />,
  [BlockType.TOP_PLAYERS]: ({ block }) => <PremiumTopPlayersSection key={block.id} title={block.title} />,
  [BlockType.TOP_GOALSCORERS]: ({ block }) => <div key={block.id} className="p-4 border border-white/10 rounded-xl">كتلة أفضل هدافي الدوري (قريباً)</div>,
  [BlockType.POLLS]: ({ block }) => <div key={block.id} className="p-4 border border-white/10 rounded-xl">كتلة الاستفتاء (قريباً)</div>,
  [BlockType.ADS]: () => null, // Placeholder for Ads
  [BlockType.VIDEOS]: () => null, // Placeholder for Videos
  [BlockType.CUSTOM_WIDGETS]: ({ block }) => block.dataConfig?.customHtmlCode ? <div key={block.id} dangerouslySetInnerHTML={{ __html: block.dataConfig.customHtmlCode }} /> : null,
};

const BlockRenderer = ({ block, featuredMatch }: { block: any, featuredMatch: any }) => {
  const Component = ComponentMap[block.type];
  
  if (!Component) {
    return (
      <div key={block.id} className="p-4 bg-red-900/20 border border-red-500 rounded-lg text-red-500 text-xs">
        Unknown Block Type: {block.type}
      </div>
    );
  }
  
  const style = block.styleConfig || {};
  const wrapperStyle: React.CSSProperties = {
    backgroundColor: style.backgroundColor,
    color: style.textColor,
    fontFamily: style.fontFamily,
    borderRadius: style.borderRadius,
    padding: style.backgroundColor ? '1rem' : undefined
  };

  return (
    <div style={wrapperStyle}>
       <Component block={block} match={featuredMatch} />
    </div>
  );
};

export default function PremiumHomePage() {
  // React Query V2 states
  const { data: v2Matches, isLoading: matchesLoading } = useMatchesV2();
  const { blocks, loading: layoutLoading } = useHomepageLayout();

  const matches = v2Matches || [];

  const featuredMatch = useMemo(() => matches.find(m => m.isFeatured), [matches]);

  if (layoutLoading || matchesLoading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-[#080808] text-white"
    >
      
      {featureFlags.useHomepageCMS ? (
        <HomePageRenderer blocks={blocks} featuredMatch={featuredMatch} />
      ) : (
        <main className="px-4 space-y-8 max-w-7xl mx-auto">
            {blocks.length > 0 ? (
              blocks.map(block => <BlockRenderer key={block.id} block={block} featuredMatch={featuredMatch} />)
            ) : (
              <div className="text-center py-20 text-gray-500">
                لا توجد أقسام معروضة حالياً. يرجى تهيئة الصفحة من لوحة الإدارة.
              </div>
            )}
        </main>
      )}

    </motion.div>
  );
}
