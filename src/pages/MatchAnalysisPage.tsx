import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMatch } from '../features/match-details/hooks/useMatch';
import { Loader2, ArrowRight, Sparkles, Trophy, Users, Shield, Compass, BookOpen } from 'lucide-react';
import MatchHeader from '../components/MatchHeader';
import { MatchPreview, MatchAnalysis, MatchFAQ } from '../components/MatchAiAnalysis';
import { aiContentEngine } from '../services/aiContentEngine';
import SEO from '../components/SEO';
import { translationService } from '../services/translationService';
import { getIdFromSlug, createSlugPath } from '../utils/slugify';

export default function MatchAnalysisPage() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    
    // Extract match ID from slug
    const matchId = getIdFromSlug(slug || '');
    const { data: match, isLoading, isError } = useMatch(matchId);
    
    const [aiContent, setAiContent] = useState<any>(null);
    const [loadingAi, setLoadingAi] = useState(true);

    useEffect(() => {
        if (match) {
            aiContentEngine.getMatchContent(match.id, match).then(content => {
                setAiContent(content);
                setLoadingAi(false);
            }).catch(err => {
                console.error("Error loading AI content on analysis page:", err);
                setLoadingAi(false);
            });
        }
    }, [match]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400" style={{ direction: 'rtl' }}>
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="font-extrabold text-white text-lg tracking-wide">جاري تحميل منصة التحليل التكتيكي...</p>
                <p className="text-xs text-gray-500 mt-1">تجهيز قراءة الذكاء الاصطناعي ونقاط قوة وضعف الفريقين</p>
            </div>
        );
    }

    if (isError || !match || match.isHidden) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400 space-y-4" style={{ direction: 'rtl' }}>
                <div className="text-6xl mb-2 animate-bounce">📊</div>
                <h2 className="text-2xl font-black text-white">عذراً، لم يتم العثور على بيانات المباراة</h2>
                <p className="text-sm text-gray-400 max-w-md text-center leading-relaxed">المباراة التي تبحث عنها غير متوفرة حالياً أو تم إخفاؤها لعدم اكتمال البيانات.</p>
                <button 
                    onClick={() => navigate('/schedule')}
                    className="bg-gradient-to-r from-primary to-amber-500 text-black px-8 py-3 rounded-2xl font-black mt-6 flex items-center gap-2 transition-all hover:scale-[1.02] shadow-[0_10px_20px_rgba(251,191,36,0.25)] min-h-[44px] cursor-pointer"
                >
                    <ArrowRight size={18} />
                    العودة لجدول المباريات
                </button>
            </div>
        );
    }

    const matchAny = match as any;
    const rawHomeName = typeof matchAny.homeTeam === 'object' ? matchAny.homeTeam.name : matchAny.homeTeam;
    const rawAwayName = typeof matchAny.awayTeam === 'object' ? matchAny.awayTeam.name : matchAny.awayTeam;
    const homeName = translationService.translateTeam(rawHomeName);
    const awayName = translationService.translateTeam(rawAwayName);

    // Calculate URLs for internal links
    const matchSlug = slug || createSlugPath(`${rawHomeName} vs ${rawAwayName}`, matchAny.id);
    const matchUrl = `https://safara90.com/match/${matchSlug}/analysis`;

    // Slugs for teams and league
    const homeTeamId = matchAny.homeTeamDetails?.id || (typeof matchAny.homeTeam === 'object' ? matchAny.homeTeam.id : matchAny.homeTeam);
    const homeTeamSlug = createSlugPath(rawHomeName, homeTeamId);
    
    const awayTeamId = matchAny.awayTeamDetails?.id || (typeof matchAny.awayTeam === 'object' ? matchAny.awayTeam.id : matchAny.awayTeam);
    const awayTeamSlug = createSlugPath(rawAwayName, awayTeamId);

    const leagueName = matchAny.league ? (typeof matchAny.league === 'object' ? (matchAny.league as any).name : matchAny.league) : '';
    const translatedLeagueName = translationService.translateCompetition(leagueName);
    const leagueId = typeof matchAny.league === 'object' ? (matchAny.league as any).id || (matchAny.league as any).apiId : '';
    const leagueSlug = leagueId ? createSlugPath(leagueName, leagueId) : '';

    const seoTitle = `التحليل التكتيكي لمباراة ${homeName} ضد ${awayName} بالذكاء الاصطناعي`;
    const seoDesc = aiContent?.summary || `قراءة فنية شاملة لموقعة ${homeName} ضد ${awayName}. تتضمن نقاط القوة والضعف لكل نادٍ، والسيناريوهات المرجحة تكتيكياً والأسئلة الشائعة عن المواجهة.`;

    const statusStr = typeof matchAny?.status === 'object' && matchAny?.status !== null ? (matchAny.status as any).short : matchAny?.status;
    const isLive = !!(matchAny?.isLive || statusStr === 'LIVE' || statusStr === '1H' || statusStr === '2H' || statusStr === 'HT' || statusStr === 'ET' || statusStr === 'P' || statusStr === 'BT' || statusStr === 'LIVE_COMMENTARY' || statusStr === 'IN_PLAY' || statusStr === 'DURING_MATCH');
    const isFinished = statusStr === 'FINISHED' || statusStr === 'FT' || statusStr === 'AET' || statusStr === 'PEN';
    const matchStatus = isLive ? 'Live' : (isFinished ? 'Finished' : 'Scheduled');

    const sportsEventData = {
        name: `${homeName} ضد ${awayName}`,
        startDate: typeof matchAny.startTime === 'string' ? matchAny.startTime : (matchAny.startTime instanceof Date ? (matchAny.startTime as Date).toISOString() : String(matchAny.startTime || '')),
        location: translationService.translateStadium(matchAny.stadium) || "",
        homeTeam: homeName,
        homeTeamLink: `/team/${homeTeamSlug}`,
        awayTeam: awayName,
        awayTeamLink: `/team/${awayTeamSlug}`,
        leagueName: translatedLeagueName,
        leagueLink: leagueSlug ? `/league/${leagueSlug}` : undefined,
        status: matchStatus as "Scheduled" | "Live" | "Finished"
    };

    // SEO Breadcrumbs
    const breadcrumbData = [
        { name: "المباريات", item: "/schedule" },
        { name: `${homeName} ضد ${awayName}`, item: `/match/${matchSlug}` },
        { name: "التحليل التكتيكي للذكاء الاصطناعي", item: `/match/${matchSlug}/analysis` }
    ];

    // Structured Article Data for Google Rich Snippets
    const articleData = {
        headline: seoTitle,
        description: seoDesc,
        datePublished: typeof match.startTime === 'string' ? match.startTime : new Date().toISOString(),
        image: match.homeLogo || `https://safara90.com/android-512.png`
    };

    return (
        <div className="max-w-5xl mx-auto px-4 pt-20 md:pt-28 pb-16 space-y-8 font-sans" style={{ direction: 'rtl' }}>
            <SEO 
                title={seoTitle}
                description={seoDesc}
                canonical={matchUrl}
                ogType="article"
                ogImage={match.homeLogo}
                keywords={`تحليل مباراة, تكتيك, ${homeName}, ${awayName}, توقعات المباراة, الذكاء الاصطناعي`}
                sportsEvent={sportsEventData}
                article={articleData}
                breadcrumbs={breadcrumbData}
                faq={aiContent?.faq || []}
            />

            {/* Back to Match link */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <Link 
                    id="back-to-match-link"
                    to={`/match/${matchSlug}`} 
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-black text-sm border border-white/5 bg-white/[0.02] hover:bg-white/5 px-4 py-2 rounded-xl transition-all duration-300 shadow-sm min-h-[44px] cursor-pointer"
                >
                    <ArrowRight size={16} />
                    العودة لصفحة المباراة والبث المباشر
                </Link>

                <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary px-3.5 py-1.5 rounded-full text-xs font-black">
                    <Sparkles size={13} />
                    <span>تحليل السيو المتقدم جاهز للأرشفة</span>
                </div>
            </div>

            {/* Match Header Information */}
            <div className="space-y-2 border-b border-white/5 pb-4">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight">
                    التحليل التكتيكي الفني لمباراة <span className="text-primary">{homeName}</span> ضد <span className="text-amber-500">{awayName}</span> بالذكاء الاصطناعي
                </h1>
                <p className="text-xs text-gray-400 font-bold">
                    قراءة تكتيكية تفصيلية شاملة، تشمل التوقعات والاحتمالات والأسئلة الشائعة من مجتمع المحللين الرياضيين لـ {translatedLeagueName || "البطولة الكروية"}
                </p>
            </div>

            <MatchHeader match={match} />

            {/* AI Analysis Main Area */}
            {loadingAi ? (
                <div className="bg-gradient-to-b from-[#0f172a]/60 to-[#05070f]/80 rounded-[2rem] p-16 border border-white/10 flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <span className="text-gray-400 font-extrabold text-sm text-center">جاري استدعاء البيانات وتحديث الذكاء الاصطناعي...</span>
                </div>
            ) : aiContent ? (
                <div className="space-y-8 animate-fade-in">
                    {/* Visual Section 1: Win Predictions & Key Strengths/Weaknesses */}
                    <MatchPreview content={aiContent} match={match} />
                    
                    {/* Internal Links Navigation Card (Interlinking for SEO boost) */}
                    <section id="internal-seo-links-card" className="bg-gradient-to-b from-[#111827]/80 to-[#030712]/95 border border-white/5 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
                        
                        <h3 className="text-white font-black text-sm sm:text-base mb-4 flex items-center gap-2">
                            <BookOpen size={18} className="text-primary" />
                            الروابط الرياضية التكميلية (دليل الأرشفة التفاعلي)
                        </h3>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <Link 
                                to={`/match/${matchSlug}`} 
                                className="flex flex-col p-4 bg-white/[0.02] hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl transition-all duration-300 hover:scale-[1.01]"
                            >
                                <span className="text-[10px] text-gray-500 font-bold mb-1">تفاصيل المواجهة</span>
                                <span className="text-white font-black text-xs sm:text-sm truncate">البث والإحصائيات المباشرة</span>
                            </Link>

                            <Link 
                                to={`/team/${homeTeamSlug}`} 
                                className="flex flex-col p-4 bg-white/[0.02] hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl transition-all duration-300 hover:scale-[1.01]"
                            >
                                <span className="text-[10px] text-gray-500 font-bold mb-1">صاحب الأرض والجمهور</span>
                                <span className="text-primary font-black text-xs sm:text-sm truncate">{homeName}</span>
                            </Link>

                            <Link 
                                to={`/team/${awayTeamSlug}`} 
                                className="flex flex-col p-4 bg-white/[0.02] hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl transition-all duration-300 hover:scale-[1.01]"
                            >
                                <span className="text-[10px] text-gray-500 font-bold mb-1">الفريق الضيف</span>
                                <span className="text-amber-500 font-black text-xs sm:text-sm truncate">{awayName}</span>
                            </Link>

                            {leagueSlug ? (
                                <Link 
                                    to={`/league/${leagueSlug}`} 
                                    className="flex flex-col p-4 bg-white/[0.02] hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl transition-all duration-300 hover:scale-[1.01]"
                                >
                                    <span className="text-[10px] text-gray-500 font-bold mb-1">البطولة الحالية</span>
                                    <span className="text-indigo-400 font-black text-xs sm:text-sm truncate">{translatedLeagueName || leagueName}</span>
                                </Link>
                            ) : (
                                <div className="flex flex-col p-4 bg-white/[0.01] border border-white/[0.02] rounded-2xl">
                                    <span className="text-[10px] text-gray-500 font-bold mb-1">البطولة الحالية</span>
                                    <span className="text-gray-400 font-black text-xs sm:text-sm truncate">{translatedLeagueName || leagueName || "بطولة كروية قارية"}</span>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Visual Section 2: Deep tactical analysis */}
                    <MatchAnalysis content={aiContent} />
                    
                    {/* Visual Section 3: FAQ Schema Container */}
                    <MatchFAQ content={aiContent} />
                </div>
            ) : (
                <div className="text-gray-400 text-center py-16 bg-gradient-to-b from-[#0f172a]/60 to-[#05070f]/80 rounded-[2rem] border border-white/10 font-bold">
                    التحليل التكتيكي التفصيلي بالذكاء الاصطناعي قيد المعالجة حالياً.
                </div>
            )}
        </div>
    );
}
