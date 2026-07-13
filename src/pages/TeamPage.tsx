import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTeamById, getTeamMatches, getTeamStandings, getTeamPlayers } from '../api/teamApi';
import { getIdFromSlug, createSlugPath } from '../utils/slugify';
import { mapTeamHeader, mapTeamMatches, mapTeamPlayers, mapTeamStats } from '../services/teamMapper';
import { motion } from 'motion/react';
import { AlertCircle, RefreshCw, ChevronRight } from 'lucide-react';

import TeamKnowledgeSection from '../components/team/TeamKnowledgeSection';
import TeamHeader from '../components/team/TeamHeader';
import TeamMatchesSection from '../components/team/TeamMatchesSection';
import SquadSection from '../components/team/SquadSection';
import TeamStatsCard from '../components/team/TeamStatsCard';
import LeaguePositionCard from '../components/team/LeaguePositionCard';
import SEO from '../components/SEO';
import Breadcrumbs from '../components/ui/Breadcrumbs';

export default function TeamPage() {
  const { id: rawId } = useParams<{ id: string }>();
  const id = getIdFromSlug(rawId || '');
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [teamHeader, setTeamHeader] = useState<any>(null);
  const [teamMatches, setTeamMatches] = useState<any>({ upcoming: [], recent: [] });
  const [teamPlayers, setTeamPlayers] = useState<any[]>([]);
  const [teamStats, setTeamStats] = useState<any>(null);
  const [leaguePosition, setLeaguePosition] = useState<any>(null);

  const decodedTeamName = (rawIdVal: string) => {
    try {
      return decodeURIComponent(rawIdVal);
    } catch {
      return rawIdVal;
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch
      const rawTeamDetails = await getTeamById(id);
      if (!rawTeamDetails) {
        throw new Error('لم يتم العثور على النادي المطلوب.');
      }

      const rawMatches = await getTeamMatches(id);
      const rawPlayers = await getTeamPlayers(id);
      const rawPosition = await getTeamStandings(id);

      // Map
      const mappedHeader = mapTeamHeader(rawTeamDetails);
      const mappedMatches = mapTeamMatches(rawMatches);
      const mappedSquad = mapTeamPlayers(rawPlayers);
      const mappedStats = mapTeamStats(rawMatches);

      setTeamHeader(mappedHeader);
      setTeamMatches(mappedMatches);
      setTeamPlayers(mappedSquad);
      setTeamStats(mappedStats);
      setLeaguePosition(rawPosition);
    } catch (err: any) {
      console.error('Error loading team page:', err);
      setError(err.message || 'فشل تحميل محتوى صفحة النادي.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Loading state skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-background text-gray-100 pb-20">
        <div className="max-w-7xl mx-auto px-4 pt-6 space-y-6 animate-pulse" style={{ direction: 'rtl' }}>
          {/* Header Skeleton */}
          <div className="h-44 bg-white/5 rounded-[32px] border border-white/5" />
          
          {/* Grid skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Matches & squad col */}
            <div className="lg:col-span-2 space-y-6">
              <div className="h-12 bg-white/5 rounded-2xl w-full" />
              <div className="h-[250px] bg-white/5 rounded-[32px]" />
              <div className="h-[300px] bg-white/5 rounded-[32px]" />
            </div>

            {/* Stats col */}
            <div className="space-y-6">
              <div className="h-48 bg-white/5 rounded-[32px]" />
              <div className="h-56 bg-white/5 rounded-[32px]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error State Layout
  if (error || !teamHeader) {
    return (
      <div className="min-h-screen bg-background text-gray-100 pb-20 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900/50 border border-white/5 p-8 rounded-[32px] text-center space-y-5" style={{ direction: 'rtl' }}>
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto animate-bounce" />
            <h2 className="text-lg font-black text-white font-sans">حدث خطأ أثناء تحميل النادي</h2>
            <p className="text-xs text-gray-400 font-bold leading-normal">{error || 'لم نتمكن من تنشيط هذا النادي.'}</p>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={loadData}
                className="flex-1 py-3 bg-primary/20 border border-primary/30 hover:bg-primary/30 text-primary rounded-2xl text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={14} />
                <span>إعادة المحاولة والمزامنة</span>
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 rounded-2xl text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <ChevronRight size={14} />
                <span>العودة للرئيسية</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-[color:var(--color-text)] pb-20 transition-colors duration-300 selection:bg-primary/20">
      <SEO 
        title={`${teamHeader.name} - أخبار، نتائج، وترتيب الفريق | صافرة 90`}
        description={`تعرف على آخر أخبار نادي ${teamHeader.name}، تاريخ الفريق، البطولات، وأبرز الإحصائيات. متابعة شاملة لكل مباريات ${teamHeader.name}.`}
        ogImage={teamHeader.logo}
        schema={{
          "@context": "https://schema.org",
          "@type": "SportsTeam",
          "name": teamHeader.name,
          "url": `https://korea90.xyz/team/${id}`,
          "logo": teamHeader.logo,
          "description": `معلومات شاملة وتاريخ نادي ${teamHeader.name} في عالم كرة القدم.`,
          "memberOf": {
            "@type": "SportsOrganization",
            "name": teamHeader.leagueName || "الدوري"
          }
        }}
        breadcrumbs={[
          { name: 'الفرق', item: '/teams' },
          { name: teamHeader.name, item: `/team/${createSlugPath(teamHeader.name, id)}` }
        ]}
      />
      
      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 pt-6 space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { label: 'البطولات', path: '/leagues' },
            { label: teamHeader.name }
          ]}
        />
        
        {/* Team Banner Header */}
        <TeamHeader team={teamHeader} />

        {/* Content Triple grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Match Schedule / squad list (Left/Center Column) */}
          <div className="lg:col-span-2 space-y-6">
            <TeamKnowledgeSection teamId={String(id)} />

            <div className="space-y-4">
              <div className="flex items-center justify-between px-1" style={{ direction: 'rtl' }}>
                <h2 className="text-base font-black text-white">جدول المواعيد والمباريات</h2>
                <span className="text-[10px] text-gray-400 font-bold">إجمالي {((teamMatches?.upcoming?.length || 0) + (teamMatches?.recent?.length || 0))} مواجهات</span>
              </div>
              <TeamMatchesSection matchesObj={teamMatches} />
            </div>

            {/* List level Squad Section */}
            <SquadSection players={teamPlayers} />
          </div>

          {/* Stats & standins (Right Column) */}
          <div className="space-y-6">
            {/* Position rank details in league */}
            <LeaguePositionCard positionInfo={leaguePosition} />

            {/* Wins losses statistics */}
            <TeamStatsCard stats={teamStats} />
          </div>
        </div>
      </main>
    </div>
  );
}
