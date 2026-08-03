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
import LiveMatchesCarousel from '../../components/match/LiveMatchesCarousel';
import MatchCarousel from '../../components/match/MatchCarousel';

// Centralized Component Map
const ComponentMap: Record<string, React.FC<any>> = {
  HERO: ({ block, match }) => match ? <PremiumHeroSection key={block.id} match={match} /> : null,
  LIVE_MATCHES: ({ block }) => <PremiumLiveMatchesList key={block.id} title={block.title} maxItems={(block.dataConfig as any)?.maxItems} />,
  TODAY_MATCHES: ({ block }) => <PremiumMatchesScheduleSection key={block.id} title={block.title} type={block.type} maxItems={(block.dataConfig as any)?.maxItems} />,
  TOMORROW_MATCHES: ({ block }) => <PremiumMatchesScheduleSection key={block.id} title={block.title} type={block.type} maxItems={(block.dataConfig as any)?.maxItems} />,
  FINISHED_MATCHES: ({ block }) => <PremiumMatchesScheduleSection key={block.id} title={block.title} type={block.type} maxItems={(block.dataConfig as any)?.maxItems} />,
  BENTO_ACTIONS: ({ block }) => <PremiumStories key={block.id} />,
  LATEST_NEWS: ({ block }) => <PremiumNewsSection key={block.id} title={block.title} category={(block.dataConfig as any)?.filterNewsCategory} block={block} />,
  FEATURED_NEWS: ({ block }) => <PremiumNewsSection key={block.id} title={block.title} category={(block.dataConfig as any)?.filterNewsCategory} block={block} />,
  TRENDING_NEWS: ({ block }) => <PremiumNewsSection key={block.id} title={block.title} category={(block.dataConfig as any)?.filterNewsCategory} block={block} />,
  BREAKING_NEWS: ({ block }) => <PremiumNewsSection key={block.id} title={block.title} category={(block.dataConfig as any)?.filterNewsCategory} block={block} />,
  LEAGUE_STANDINGS: ({ block }) => <PremiumStandingsPreview key={block.id} title={block.title} leagueId={Number((block.dataConfig as any)?.leagueId || 39)} leagueName={(block.dataConfig as any)?.leagueName} />,
  LEAGUES: ({ block }) => <PremiumCompetitionsSection key={block.id} title={block.title} />,
  TOP_PLAYERS: ({ block }) => <PremiumTopPlayersSection key={block.id} title={block.title} />,
  TOP_GOALSCORERS: ({ block }) => <div key={block.id} className="p-4 border border-white/10 rounded-xl">كتلة أفضل هدافي الدوري (قريباً)</div>,
  POLLS: ({ block }) => <div key={block.id} className="p-4 border border-white/10 rounded-xl">كتلة الاستفتاء (قريباً)</div>,
  ADS: () => null, // Placeholder for Ads
  VIDEOS: () => null, // Placeholder for Videos
  CUSTOM_WIDGETS: ({ block }) => (block.dataConfig as any)?.customHtmlCode ? <div key={block.id} dangerouslySetInnerHTML={{ __html: (block.dataConfig as any).customHtmlCode }} /> : null,
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

  // Show skeleton ONLY while initial CMS layout structure is loading
  if (layoutLoading) {
    return (
      <div className="min-h-screen bg-[#080808] text-white p-4 max-w-7xl mx-auto space-y-6 animate-pulse">
        {/* Skeleton Hero */}
        <div className="w-full h-64 bg-white/5 rounded-2xl border border-white/5" />
        {/* Skeleton Live Matches */}
        <div className="space-y-3">
          <div className="h-6 w-36 bg-white/10 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-32 bg-white/5 rounded-xl" />
            <div className="h-32 bg-white/5 rounded-xl" />
            <div className="h-32 bg-white/5 rounded-xl" />
          </div>
        </div>
        {/* Skeleton Schedule */}
        <div className="space-y-3">
          <div className="h-6 w-48 bg-white/10 rounded" />
          <div className="space-y-2">
            <div className="h-20 bg-white/5 rounded-xl" />
            <div className="h-20 bg-white/5 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#080808] text-white pt-4 pb-12"
    >
      <HomePageRenderer blocks={blocks} featuredMatch={featuredMatch} />
    </motion.div>
  );
}
