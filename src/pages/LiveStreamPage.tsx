import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useMatch } from '../features/match-details/hooks/useMatch';
import { Match } from '../types';
import VideoPlayer from '../components/VideoPlayer';
import SEO from '../components/SEO';
import { 
  PremiumCard, 
  PremiumButton, 
  PremiumBadge,
} from '../premium/components/shared';
import { 
  Loader2, 
  ArrowRight, 
  ShieldAlert, 
  Tv, 
  Maximize, 
  Info, 
  ExternalLink, 
  Share2,
  ChevronDown,
  Monitor,
  Phone,
  Layout,
  Trophy,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translationService } from '../services/translationService';
import { getIdFromSlug } from '../utils/slugify';
import ImageResolver from '../components/ui/ImageResolver';

export default function LiveStreamPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const realId = getIdFromSlug(id || '');
  const { data: match, isLoading, isError } = useMatch(realId);
  const [activeServer, setActiveServer] = useState<number>(0);
  const [showInfo, setShowInfo] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#060608] flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 rounded-full animate-pulse"></div>
          <Loader2 className="w-16 h-16 text-primary animate-spin absolute inset-0" />
        </div>
        <p className="text-gray-400 font-bold animate-pulse">جاري تجهيز البث المباشر المتميز...</p>
      </div>
    );
  }

  if (isError || !match) {
    return (
      <div className="min-h-screen bg-[#060608] flex items-center justify-center text-white px-4">
        <PremiumCard className="text-center max-w-md p-8">
          <ShieldAlert className="w-20 h-20 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-black mb-3">البث غير متوفر حالياً</h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            عذراً، يبدو أن روابط البث لهذه المباراة لم يتم تفعيلها بعد أو أن المباراة قد انتهت. يرجى المحاولة لاحقاً أو مراجعة جدول المباريات.
          </p>
          <div className="flex flex-col gap-3">
            <PremiumButton 
              variant="outline"
              onClick={() => navigate(-1)}
              className="w-full"
            >
              <ArrowRight size={18} /> العودة للخلف
            </PremiumButton>
            <PremiumButton 
              to="/schedule"
              className="w-full"
            >
              مشاهدة جدول المباريات
            </PremiumButton>
          </div>
        </PremiumCard>
      </div>
    );
  }

  const hasStreamingLinks = match.streamingLinks && match.streamingLinks.length > 0;
  const currentLink = hasStreamingLinks ? match.streamingLinks![activeServer] : null;

  const rawHomeName = typeof match.homeTeam === 'object' ? match.homeTeam.name : match.homeTeam;
  const rawAwayName = typeof match.awayTeam === 'object' ? match.awayTeam.name : match.awayTeam;
  const homeName = translationService.translateTeam(rawHomeName);
  const awayName = translationService.translateTeam(rawAwayName);
  
  const seoTitle = `بث مباشر: مباراة ${homeName} ضد ${awayName} | جودة عالية FHD`;
  const seoDesc = `مشاهدة البث المباشر لمباراة ${homeName} و ${awayName}. استمتع بمشاهدة المباراة بأعلى جودة وبدون تقطيع على صافرة 90.`;

  const handleToggleFullScreen = () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const shareMatch = () => {
    if (navigator.share) {
      navigator.share({
        title: seoTitle,
        text: seoDesc,
        url: window.location.href,
      });
    }
  };

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-[#020203] text-white overflow-x-hidden flex flex-col font-sans" 
      dir="rtl"
    >
      <SEO 
        title={seoTitle}
        description={seoDesc}
        ogImage={match.homeLogo}
        ogType="video.other"
      />

      {/* Top Navbar: Minimal but informative */}
      <nav className="z-50 px-4 py-3 bg-black/40 backdrop-blur-md border-b border-white/5 flex items-center justify-between sticky top-0">
        <div className="flex items-center gap-3">
          <Link to={`/match/${id}`} className="p-2 hover:bg-white/10 rounded-xl transition-all">
            <ArrowRight size={24} />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-sm md:text-base font-black truncate max-w-[150px] md:max-w-none">
              {homeName} vs {awayName}
            </h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">بث مباشر</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={shareMatch}
            className="p-2 hover:bg-white/10 rounded-xl transition-all md:flex hidden"
            title="مشاركة البث"
          >
            <Share2 size={20} />
          </button>
          <div className="h-8 w-px bg-white/10 mx-1 md:block hidden" />
          <div className="flex items-center gap-4 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
             <div className="flex flex-col items-center">
                <span className="text-[10px] text-gray-500 font-bold">النتيجة</span>
                <span className="text-xs font-black text-primary">{match.homeScore ?? 0} - {match.awayScore ?? 0}</span>
             </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col lg:flex-row relative">
        
        {/* Video Player Section: Maximum Space */}
        <div className="flex-1 bg-black flex flex-col relative overflow-hidden group">
          <div className="flex-1 flex items-center justify-center relative bg-black">
            {hasStreamingLinks && currentLink ? (
              <VideoPlayer 
                url={currentLink.url} 
                title={`${homeName} ضد ${awayName}`}
                poster={match.homeLogo}
                isTheaterMode={true}
                onToggleTheater={() => {}}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center space-y-6">
                 <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 animate-pulse">
                    <Tv className="text-primary w-12 h-12" />
                 </div>
                 <div>
                    <h3 className="text-2xl font-black mb-2">جاري تجهيز السيرفرات</h3>
                    <p className="text-gray-400 max-w-sm">عادة ما يتم تفعيل روابط البث قبل صافرة البداية بـ 15 دقيقة. ابقَ معنا.</p>
                 </div>
                 <div className="flex gap-4">
                    <PremiumButton onClick={() => window.location.reload()} size="sm">تحديث الصفحة</PremiumButton>
                    <PremiumButton to="/schedule" variant="outline" size="sm">الجدول الزمني</PremiumButton>
                 </div>
              </div>
            )}

            {/* Float Overlay Actions - Always visible for better accessibility */}
            <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 flex flex-col gap-3 z-30">
                <PremiumButton 
                  onClick={handleToggleFullScreen}
                  className="p-4 rounded-[1.5rem] shadow-[0_10px_30px_rgba(251,191,36,0.5)] active:scale-95"
                  title="مشاهدة بملء الشاشة"
                >
                  <Maximize size={24} className="font-black" />
                  <span className="text-xs font-black hidden md:inline uppercase tracking-widest">شاشة كاملة</span>
                </PremiumButton>
            </div>
          </div>

          {/* Player Footer Actions */}
          <div className="bg-black/60 backdrop-blur-md border-t border-white/5 p-4 flex flex-wrap items-center justify-between gap-4">
             <div className="flex items-center gap-3">
                <div className="bg-red-600/20 text-red-500 border border-red-500/30 px-3 py-1 rounded-lg text-xs font-black flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                   LIVE
                </div>
                <div className="text-xs text-gray-400 font-bold flex items-center gap-1">
                   <Monitor size={14} className="text-primary" />
                   سيرفر {activeServer + 1}
                </div>
             </div>

             <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowInfo(!showInfo)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all border ${showInfo ? 'bg-primary text-black border-primary' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}
                >
                   <Info size={16} />
                   معلومات المباراة
                </button>
             </div>
          </div>
        </div>

        {/* Sidebar: Servers & Chat */}
        <aside className="w-full lg:w-[380px] bg-[#09090b] border-r border-white/5 flex flex-col shrink-0">
          
          {/* Servers Selection */}
          <div className="p-4 border-b border-white/5">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black flex items-center gap-2">
                   <Layout size={16} className="text-primary" />
                   سيرفرات المشاهدة
                </h3>
                <span className="text-[10px] bg-white/5 px-2 py-1 rounded-md text-gray-500 font-bold">تلقائي</span>
             </div>
             
             <div className="grid grid-cols-2 gap-2">
                {hasStreamingLinks ? (
                  match.streamingLinks!.map((link, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveServer(index)}
                      className={`p-3 rounded-xl text-xs font-black transition-all flex flex-col items-start gap-1 border ${
                        activeServer === index
                          ? 'bg-primary text-black border-primary shadow-[0_5px_15px_rgba(251,191,36,0.2)]'
                          : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2 w-full">
                         <div className={`w-1.5 h-1.5 rounded-full ${activeServer === index ? 'bg-black' : 'bg-primary'}`} />
                         <span>{link.name || `سيرفر ${index + 1}`}</span>
                      </div>
                      <span className={`text-[9px] opacity-60 ${activeServer === index ? 'text-black/70' : 'text-gray-500'}`}>
                        {(link as any).quality || '1080p'} • {(link as any).language || 'عربي'}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="col-span-2 py-4 text-center text-xs text-gray-500 italic">
                    لا توجد سيرفرات بديلة حالياً
                  </div>
                )}
             </div>
          </div>

          {/* Match Details Panel (Static Fallback) */}
          <div className="flex-1 flex flex-col p-4 bg-black/10 overflow-y-auto">
             <div className="p-3 mb-4 rounded-xl bg-white/5 border border-white/5">
                <h4 className="text-xs font-black text-primary mb-2 flex items-center gap-2">
                   <Trophy size={14} />
                   معلومات البطولة
                </h4>
                <p className="text-xs text-gray-300 font-bold">
                   {match.league?.name || (match as any).leagueName || ''}
                </p>
             </div>

             <div className="p-3 mb-4 rounded-xl bg-white/5 border border-white/5">
                <h4 className="text-xs font-black text-primary mb-2 flex items-center gap-2">
                   <Info size={14} />
                   مكان اللقاء والملعب
                </h4>
                <p className="text-xs text-gray-300 font-bold">
                   {match.stadium || ''}
                </p>
             </div>

             <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <h4 className="text-xs font-black text-primary mb-2 flex items-center gap-2">
                   <History size={14} />
                   حالة البث المباشر
                </h4>
                <p className="text-xs text-gray-300 font-bold flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                   البث مستقر وبجودة عالية FHD
                </p>
             </div>
          </div>
        </aside>
      </main>

      {/* Info Drawer (Overlay on Mobile/Side on Large) */}
      <AnimatePresence>
        {showInfo && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-0 z-[60] flex items-end lg:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowInfo(false)}
          >
            <motion.div 
              className="w-full max-w-2xl overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <PremiumCard className="p-0 border-none rounded-[2.5rem]">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <h2 className="text-xl font-black flex items-center gap-3">
                      <Trophy className="text-primary" />
                      تفاصيل المباراة
                  </h2>
                  <button onClick={() => setShowInfo(false)} className="p-2 hover:bg-white/5 rounded-xl">
                      <ChevronDown size={24} />
                  </button>
                </div>
                
                <div className="p-6 space-y-8">
                  {/* Teams Summary */}
                  <div className="flex items-center justify-between gap-4">
                      <TeamSummary name={homeName} logo={match.homeLogo} side="right" />
                      <div className="flex flex-col items-center">
                        <span className="text-3xl font-black text-primary">{match.homeScore ?? 0} : {match.awayScore ?? 0}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">{match.status === 'LIVE' ? 'شوط 2' : 'مباشر'}</span>
                      </div>
                      <TeamSummary name={awayName} logo={match.awayLogo} side="left" />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <InfoBox label="البطولة" value={typeof match.league === 'object' ? match.league.name : match.league} icon={<Trophy size={14}/>} />
                      <InfoBox label="الملعب" value={match.stadium || ''} icon={<Layout size={14}/>} />
                      <InfoBox label="الوقت" value={match.startTime ? new Date(match.startTime).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'}) : '--:--'} icon={<History size={14}/>} />
                  </div>

                  <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                      <p className="text-xs text-gray-400 leading-relaxed italic text-center">
                        هذا البث مقدم حصرياً لمشجعي صافرة 90. في حال واجهت مشاكل في التشغيل يرجى التبديل بين السيرفرات المتاحة أو تحديث الصفحة.
                      </p>
                  </div>
                </div>
                
                <div className="p-4 bg-white/5 flex justify-center">
                  <Link 
                      to={`/match/${id}`}
                      className="flex items-center gap-2 text-primary font-bold text-sm hover:underline"
                  >
                      فتح صفحة المباراة الكاملة (إحصائيات وتشكيلات)
                      <ExternalLink size={14} />
                  </Link>
                </div>
              </PremiumCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] opacity-20" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-[100px] opacity-10" />
      </div>
    </div>
  );
}

function TeamSummary({ name, logo, side }: { name: string, logo?: string, side: 'right' | 'left' }) {
  return (
    <div className={`flex items-center gap-3 flex-1 ${side === 'left' ? 'flex-row-reverse text-left' : 'text-right'}`}>
      <PremiumCard className="w-12 h-12 md:w-16 md:h-16 p-2 shrink-0 shadow-lg border-white/10 flex items-center justify-center">
        <ImageResolver src={logo} fallbackType="team" fallbackText={name} alt={name} className="w-full h-full object-contain" />
      </PremiumCard>
      <span className="font-black text-sm md:text-lg text-white truncate">{name}</span>
    </div>
  );
}

function InfoBox({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
  return (
    <PremiumCard className="p-3 border-white/10">
      <div className="flex items-center gap-2 text-gray-500 text-[10px] font-bold mb-1">
        {icon}
        {label}
      </div>
      <div className="text-white text-xs font-black truncate">{value}</div>
    </PremiumCard>
  );
}
