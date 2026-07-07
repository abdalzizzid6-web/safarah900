import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { createSlugPath } from '../utils/slugify';
import { useMatch } from '../features/match-details/hooks/useMatch';
import { Loader2, ArrowRight, PlayCircle, Activity, Users, BarChart3, History, Sparkles, Tv, ShieldAlert, Wifi, Info } from 'lucide-react';
import MatchHeader from './MatchHeader';
import MatchStatsView from './MatchStatsView';
import LineupsView from './LineupsView';
import TimelineView from './TimelineView';
import { MatchAnalysis, MatchFAQ, MatchPreview } from './MatchAiAnalysis';
import { aiContentEngine } from '../services/aiContentEngine';
import SEO from './SEO';
import VideoPlayer from './VideoPlayer';
import { translationService } from '../services/translationService';
import MatchKnowledgeGraph from './match/MatchKnowledgeGraph';
import MatchHighlights from './MatchHighlights';
import H2HTab from './match/H2HTab';

export default function MatchDetailView() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: match, isLoading, isError } = useMatch(id!);
    
    const [activeTab, setActiveTab] = useState<'timeline' | 'lineups' | 'stats' | 'h2h' | 'predictions' | 'knowledge' | 'highlights'>('timeline');
    const [aiContent, setAiContent] = useState<any>(null);
    const [loadingAi, setLoadingAi] = useState(true);
    const [selectedLinkIndex, setSelectedLinkIndex] = useState(0);

    useEffect(() => {
        if (match && (match.status === 'LIVE' || match.isLive || match.status === 'FINISHED')) {
           setActiveTab('timeline');
        } else if (match) {
           setActiveTab('timeline'); // Default to timeline if upcoming
        }
        
        if (match) {
            aiContentEngine.getMatchContent(match.id, match).then(content => {
                setAiContent(content);
                setLoadingAi(false);
            });
        }
    }, [match]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400" style={{ direction: 'rtl' }}>
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="font-extrabold text-white text-lg tracking-wide">جاري تحميل منصة المباراة الفاخرة...</p>
                <p className="text-xs text-gray-500 mt-1">تجهيز التشكيلات الرسمية والتحليل الرياضي والروابط</p>
            </div>
        );
    }

    if (isError || !match) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400 space-y-4" style={{ direction: 'rtl' }}>
                <div className="text-6xl mb-2 animate-bounce">⚽</div>
                <h2 className="text-2xl font-black text-white">عذراً، لم يتم العثور على بيانات المباراة</h2>
                <p className="text-sm text-gray-400 max-w-md text-center leading-relaxed">قد تكون المباراة غير متوفرة حالياً في الخادم الرياضي أو تم تغيير الرابط الأساسي للحدث.</p>
                <button 
                    onClick={() => navigate('/schedule')}
                    className="bg-gradient-to-r from-primary to-amber-500 text-black px-8 py-3 rounded-2xl font-black mt-6 flex items-center gap-2 transition-all hover:scale-[1.02] shadow-[0_10px_20px_rgba(251,191,36,0.25)] min-h-[44px]"
                >
                    <ArrowRight size={18} />
                    العودة لجدول المباريات
                </button>
            </div>
        );
    }

    const rawHomeName = typeof match.homeTeam === 'object' ? match.homeTeam.name : match.homeTeam;
    const rawAwayName = typeof match.awayTeam === 'object' ? match.awayTeam.name : match.awayTeam;
    const homeName = translationService.translateTeam(rawHomeName);
    const awayName = translationService.translateTeam(rawAwayName);
    const seoTitle = `مباراة ${homeName} ضد ${awayName} | تحليل، تشكيلات، وبث مباشر`;
    const seoDesc = aiContent?.summary || `تغطية شاملة لمباراة ${homeName} و${awayName} تتضمن التحليل الفني، التشكيلات الرسمية، مجريات اللقاء والإحصائيات المباشرة.`;
    const matchUrl = `https://korea90.xyz/match/${id}`;

    const hasStreamingLinks = match.streamingLinks && match.streamingLinks.length > 0;
    const currentLink = hasStreamingLinks ? match.streamingLinks![selectedLinkIndex] : null;

    const statusStr = typeof match?.status === 'object' && match?.status !== null ? (match.status as any).short : match?.status;
    const isLive = !!(match?.isLive || statusStr === 'LIVE' || statusStr === '1H' || statusStr === '2H' || statusStr === 'HT' || statusStr === 'ET' || statusStr === 'P' || statusStr === 'BT' || statusStr === 'LIVE_COMMENTARY' || statusStr === 'IN_PLAY' || statusStr === 'DURING_MATCH');
    const isFinished = statusStr === 'FINISHED' || statusStr === 'FT' || statusStr === 'AET' || statusStr === 'PEN';
    const matchStatus = isLive ? 'Live' : (isFinished ? 'Finished' : 'Scheduled');

    const homeTeamId = (typeof match?.homeTeam === 'object' ? (match.homeTeam as any).id : "") || "";
    const awayTeamId = (typeof match?.awayTeam === 'object' ? (match.awayTeam as any).id : "") || "";
    const leagueId = (match?.league as any)?.id || "";
    const leagueName = (match?.league as any)?.name || "";

    const homeTeamLink = `/team/${createSlugPath(homeName, homeTeamId)}`;
    const awayTeamLink = `/team/${createSlugPath(awayName, awayTeamId)}`;
    const leagueLink = `/league/${createSlugPath(leagueName, leagueId)}`;

    const sportsEventData = {
        name: `${homeName} ضد ${awayName}`,
        startDate: match.startTime || '',
        location: translationService.translateStadium(match.stadium) || "",
        homeTeam: homeName,
        homeTeamLink: homeTeamLink,
        awayTeam: awayName,
        awayTeamLink: awayTeamLink,
        leagueName: leagueName,
        leagueLink: leagueLink,
        status: matchStatus as "Scheduled" | "Live" | "Finished"
    };

    const breadcrumbData = [
        { name: "المباريات", item: "/schedule" },
        { name: `${homeName} ضد ${awayName}`, item: `/match/${id}` }
    ];

    return (
        <div className="max-w-5xl mx-auto px-4 pt-20 md:pt-28 pb-16 space-y-8 font-sans" style={{ direction: 'rtl' }}>
            <SEO 
                title={seoTitle}
                description={seoDesc}
                canonical={matchUrl}
                ogType="sports_event"
                ogImage={match.homeLogo}
                keywords={`مباراة, ${homeName}, ${awayName}, بث مباشر, ملخص, أهداف, تحليل`}
                sportsEvent={sportsEventData}
                breadcrumbs={breadcrumbData}
                faq={aiContent?.faq || []}
            />

            {/* Header / Main Info */}
            <MatchHeader match={match} />
            
            {/* AI Analysis Teaser Section */}
            <section className="space-y-6 pt-2">
                <h2 className="sr-only">التحليل التكتيكي وتوقع الذكاء الاصطناعي للمباراة</h2>
                {loadingAi ? (
                    <div className="bg-gradient-to-b from-[#0f172a]/60 to-[#05070f]/80 rounded-[2rem] p-12 border border-white/10 flex flex-col items-center justify-center space-y-3 animate-pulse">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <span className="text-gray-400 font-extrabold text-sm">جاري قراءة المعطيات الفنية بالذكاء الاصطناعي...</span>
                    </div>
                ) : aiContent ? (
                    <div className="bg-gradient-to-b from-[#0f172a]/95 to-[#05070f]/98 rounded-[2rem] p-6 sm:p-8 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-amber-400 flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.2)]">
                                    <Sparkles className="text-black" size={20} />
                                </div>
                                <div>
                                    <span className="text-[9px] uppercase font-black text-primary tracking-widest block mb-0.5">مساعد التكتيك الذكي</span>
                                    <h3 className="text-base sm:text-lg font-black text-white">
                                        توقع وتحليل مباراة {homeName} ضد {awayName} بالذكاء الاصطناعي
                                    </h3>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 space-y-4">
                            {aiContent.summary && (
                                <p className="text-gray-300 text-sm leading-relaxed line-clamp-2 font-medium">
                                    {aiContent.summary}
                                </p>
                            )}

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                                <span className="text-xs text-gray-400 font-bold">
                                    ⚡ يتضمن التحليل: احتمالات الفوز الدقيقة، نقاط القوة والضعف التكتيكية، والتشكيلات المتوقعة.
                                </span>
                                
                                <Link 
                                    id="view-full-analysis-btn"
                                    to={`/match/${createSlugPath(`${rawHomeName} vs ${rawAwayName}`, match.id)}/analysis`}
                                    className="bg-gradient-to-r from-primary to-amber-500 hover:from-amber-500 hover:to-primary text-black px-6 py-3 rounded-xl font-black text-xs sm:text-sm transition-all duration-300 hover:scale-[1.02] shadow-[0_5px_15px_rgba(251,191,36,0.2)] flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
                                >
                                    <span>عرض التحليل الكامل</span>
                                    <ArrowRight size={16} className="rotate-180" />
                                </Link>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-gray-400 text-center py-12 bg-gradient-to-b from-[#0f172a]/60 to-[#05070f]/80 rounded-[2rem] border border-white/10 font-bold">
                        التحليل التكتيكي التفصيلي بالذكاء الاصطناعي قيد المعالجة حالياً.
                    </div>
                )}
            </section>

            {/* Live Streaming Redirection Banner */}
            <section className={`rounded-[2.5rem] p-6 sm:p-8 border overflow-hidden relative group cursor-pointer ${isLive ? 'bg-gradient-to-br from-red-600/90 to-orange-500/90 border-red-400/30 shadow-[0_20px_50px_rgba(239,68,68,0.3)]' : 'bg-gradient-to-br from-primary/80 to-amber-600/80 border-amber-400/30 shadow-[0_20px_50px_rgba(251,191,36,0.15)]'}`}
                onClick={() => navigate(`/watch/${id}`)}
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-black/20 rounded-full blur-[50px] pointer-events-none" />
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner border border-white/30 group-hover:scale-110 transition-transform duration-500">
                            <Tv className={`text-white ${isLive ? 'animate-pulse' : ''}`} size={32} />
                        </div>
                        <div className="flex flex-col">
                            {isLive ? (
                                <>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                                        <span className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em]">Live Experience</span>
                                    </div>
                                    <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                                        شاهد البث المباشر الآن بأقصى جودة
                                    </h2>
                                    <p className="text-sm text-white/70 font-bold mt-1">تغطية حصرية، تعليق عربي، وبدون تقطيع.</p>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em]">Match Broadcast</span>
                                    </div>
                                    <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                                        صفحة البث المباشر
                                    </h2>
                                    <p className="text-sm text-white/70 font-bold mt-1">تتوفر روابط السيرفرات قبل البداية بقليل.</p>
                                </>
                            )}
                        </div>
                    </div>

                    <button 
                        className={`bg-white px-8 py-4 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-3 transition-all hover:shadow-2xl hover:-translate-y-1 active:scale-95 ${isLive ? 'text-red-600' : 'text-amber-600'}`}
                    >
                        <span>انتقل لصفحة البث</span>
                        <PlayCircle size={20} />
                    </button>
                </div>
            </section>

            {/* Tactical Capsule Switching Tabs */}
            <div className="bg-[#0f172a]/40 border border-white/10 rounded-[1.5rem] p-2 flex overflow-x-auto gap-2 whitespace-nowrap scrollbar-none mt-8 select-none">
                {[
                    { id: 'timeline', label: 'الخط الزمني المباشر', icon: <Activity size={16} /> },
                    { id: 'lineups', label: 'التشكيلات والخطط', icon: <Users size={16} /> },
                    { id: 'stats', label: 'إحصائيات اللقاء', icon: <BarChart3 size={16} /> },
                    { id: 'highlights', label: 'أهداف وملخصات', icon: <PlayCircle size={16} /> },
                    { id: 'h2h', label: 'المواجهات المباشرة', icon: <History size={16} /> },
                    { id: 'knowledge', label: 'الشبكة المعرفية (AI)', icon: <Sparkles size={16} /> }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 py-3 px-5 sm:px-6 rounded-xl font-black text-xs sm:text-sm transition-all min-h-[44px] cursor-pointer shrink-0 ${
                            activeTab === tab.id 
                            ? 'bg-gradient-to-r from-primary to-amber-500 text-black shadow-[0_10px_25px_rgba(251,191,36,0.3)] scale-[1.02]' 
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Content Area wrapped in a Premium Sports Card */}
            <div className="bg-gradient-to-b from-[#0f172a]/90 to-[#05070f]/95 rounded-[2.5rem] border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.8)] backdrop-blur-3xl overflow-hidden p-6 sm:p-8">
                <div className="min-h-[300px]">
                    {activeTab === 'timeline' && <TimelineView match={match} />}
                    {activeTab === 'lineups' && <LineupsView match={match} />}
                    {activeTab === 'stats' && <MatchStatsView match={match} />}
                    {activeTab === 'highlights' && <MatchHighlights matchId={match.id} />}
                    {activeTab === 'knowledge' && <MatchKnowledgeGraph matchId={match.id} />}
                    {activeTab === 'h2h' && <H2HTab match={match} />}
                </div>
            </div>

        </div>
    );
}
