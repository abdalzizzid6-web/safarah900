import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { motion } from 'motion/react';
import ImageResolver from '../../components/ui/ImageResolver';
import { 
  X, Calendar, MapPin, Shield, Clock, AlertTriangle, 
  HelpCircle, RefreshCw, Info, User, Play, Radio
} from 'lucide-react';
import * as worldCupRepository from '../../features/world-cup/repositories/worldCupRepository';
import { worldCupService, WCMatch } from '../../services/worldCupService';
import { downloadICS } from '../../lib/calendar';

interface WCMatchDetailProps {
  matchId: string | number;
  onClose: () => void;
  onOpenTeam: (id: string | number) => void;
  onOpenPlayer: (id: string | number) => void;
  isDark: boolean;
}

export default function WCMatchDetail({ matchId, onClose, onOpenTeam, onOpenPlayer, isDark }: WCMatchDetailProps) {
  const [match, setMatch] = useState<WCMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorString, setErrorString] = useState<string | null>(null);
  const [streams, setStreams] = useState<any[]>([]);
  const [activeStreamUrl, setActiveStreamUrl] = useState<string | null>(null);
  const [selectedStream, setSelectedStream] = useState<any | null>(null);

  const fetchDetails = async () => {
    setLoading(true);
    setErrorString(null);
    try {
      const data = await worldCupService.getMatchDetails(matchId);
      setMatch(data);

      // Async fetch streams matching the matchId from Firestore (new matchStreams table)
      try {
        const tempStreams = await worldCupRepository.getMatchStreams(matchId);
        setStreams(tempStreams);
        if (tempStreams.length > 0) {
          const firstStr = tempStreams[0];
          setSelectedStream(firstStr);
          setActiveStreamUrl((firstStr as any).primaryStream);
        }
      } catch (streamErr) {
        console.warn("No matchStreams found:", streamErr);
      }
    } catch (err: any) {
      console.error("Error fetching match details:", err);
      setErrorString("فشل في مزامنة تفاصيل المباراة الحية من Football-Data API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [matchId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className={`w-full max-w-lg rounded-3xl p-6 ${isDark ? 'bg-[#0f1524]' : 'bg-white'} animate-pulse h-[350px] flex flex-col justify-between`}>
          <div className="h-6 w-1/4 bg-gray-700/50 rounded" />
          <div className="flex justify-around items-center my-8">
            <div className="h-14 w-14 bg-gray-700/50 rounded-full" />
            <div className="h-8 w-1/3 bg-gray-700/50 rounded" />
            <div className="h-14 w-14 bg-gray-700/50 rounded-full" />
          </div>
          <div className="space-y-4 flex-1">
            <div className="h-12 bg-gray-700/50 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (errorString || !match) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className={`w-full max-w-md rounded-2xl p-6 text-center ${isDark ? 'bg-[#0f1524] text-white' : 'bg-white text-slate-950'}`}>
          <AlertTriangle className="mx-auto text-amber-500 mb-3" size={44} />
          <h3 className="text-sm font-black mb-2">تعذر تحميل تفاصيل المباراة الحالية</h3>
          <p className="text-xs text-gray-400 mb-4 font-bold leading-relaxed">
            {errorString || "لا تتوفر تفاصيل إضافية لهذه المباراة في الـ API حالياً."}
          </p>
          <div className="flex gap-2 justify-center">
            <button onClick={fetchDetails} className="px-4 py-2 bg-[#10b981] text-black text-xs font-black rounded-xl">إعادة المحاولة</button>
            <button onClick={onClose} className="px-4 py-2 bg-white/10 text-white text-xs font-black rounded-xl">إغلاق</button>
          </div>
        </div>
      </div>
    );
  }

  // Format timezone to user browser Locale
  const localDateStr = new Date(match.utcDate).toLocaleDateString('ar-SA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const localTimeStr = new Date(match.utcDate).toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  // Calculate scores
  const hFull = match.score.fullTime.home;
  const aFull = match.score.fullTime.away;
  const hHalf = match.score.halfTime.home;
  const aHalf = match.score.halfTime.away;

  // Second half scores (full minus half)
  const hSec = (hFull !== null && hHalf !== null) ? (hFull - hHalf) : null;
  const aSec = (aFull !== null && aHalf !== null) ? (aFull - aHalf) : null;

  // Referee formatting
  const refereeName = match.referees && match.referees.length > 0 
    ? match.referees.map(r => r.name).join('، ') 
    : "";

  const isLive = ['LIVE', 'IN_PLAY', 'PAUSED'].includes(match.status);
  const isFinished = ['FINISHED', 'FT'].includes(match.status);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border ${
          isDark ? 'bg-[#0a0f1d] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-950'
        }`}
      >
        {/* Header Navigation */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black py-1 px-2.5 rounded bg-[#10b981]/25 text-[#10b981] uppercase tracking-wide">
              {worldCupService.translateStage(match.stage)} {match.group ? `• المجموعة ${match.group.replace('GROUP_', '')}` : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                downloadICS({
                  id: match.id,
                  startTime: match.utcDate,
                  homeTeam: worldCupService.translateTeam(match.homeTeam.name),
                  awayTeam: worldCupService.translateTeam(match.awayTeam.name),
                  league: "كأس العالم 2026"
                } as any);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#d4af37] text-black text-[10px] font-black rounded-lg hover:bg-amber-300 transition-colors shadow-lg"
            >
              <Calendar size={12} />
              إضافة للتقويم
            </button>
            <button 
              onClick={onClose}
              className={`p-1.5 rounded-full hover:bg-white/10 transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Custom Match Name Override */}
        {(match as any).matchName && (
          <div className="bg-[#10b981]/15 text-[#10b981] text-xs font-black py-2.5 px-4 text-center border-b border-[#10b981]/25">
            🏆 { (match as any).matchName }
          </div>
        )}

        {/* Home & Away Flags + Scores banner */}
        <div className="p-6 bg-gradient-to-br from-black/40 via-transparent to-transparent">
          <div className="flex items-center justify-between gap-4">
            
            {/* Home Team */}
            <div 
              className="flex flex-col items-center gap-2 cursor-pointer group flex-1 text-center"
              onClick={() => onOpenTeam(match.homeTeam.id)}
            >
              {match.homeTeam.crest && (
                <ImageResolver 
                  src={match.homeTeam.crest} 
                  fallbackType="team"
                  fallbackText={match.homeTeam.name}
                  tla={match.homeTeam.tla}
                  className="w-16 h-16 object-contain rounded-xl bg-white/5 p-1 transition-transform group-hover:scale-108"
                  alt="" 
                />
              )}
              <span className="font-extrabold text-xs group-hover:text-[#10b981] transition-colors leading-tight">
                {worldCupService.translateTeam(match.homeTeam.name)}
              </span>
            </div>

            {/* LIVE / Scheduled Score display */}
            <div className="flex flex-col items-center justify-center flex-1">
              {isLive || isFinished ? (
                <div className="space-y-1 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-3xl font-black font-mono text-[#10b981]">{hFull}</span>
                    <span className="text-gray-400 font-bold text-lg">:</span>
                    <span className="text-3xl font-black font-mono text-[#10b981]">{aFull}</span>
                  </div>
                  <span className={`text-[9px] flex items-center justify-center gap-1.5 px-2.5 py-0.5 rounded-full font-black mx-auto ${
                    isLive ? 'bg-red-500/10 text-red-500 animate-pulse' : 'bg-gray-500/10 text-gray-400'
                  }`}>
                    <Clock size={9} />
                    <span>{worldCupService.translateStatus(match.status)}</span>
                  </span>
                </div>
              ) : (
                <div className="space-y-1 text-center">
                  <div className="text-lg font-black text-[#10b981] bg-[#10b981]/10 px-3.5 py-1 rounded-xl">
                    {localTimeStr}
                  </div>
                  <span className="text-[9px] text-[#10b981] font-bold">
                    {worldCupService.translateStatus(match.status)}
                  </span>
                </div>
              )}
            </div>

            {/* Away Team */}
            <div 
              className="flex flex-col items-center gap-2 cursor-pointer group flex-1 text-center"
              onClick={() => onOpenTeam(match.awayTeam.id)}
            >
              {match.awayTeam.crest && (
                <ImageResolver 
                  src={match.awayTeam.crest} 
                  fallbackType="team"
                  fallbackText={match.awayTeam.name}
                  tla={match.awayTeam.tla}
                  className="w-16 h-16 object-contain rounded-xl bg-white/5 p-1 transition-transform group-hover:scale-108"
                  alt="" 
                />
              )}
              <span className="font-extrabold text-xs group-hover:text-[#10b981] transition-colors leading-tight">
                {worldCupService.translateTeam(match.awayTeam.name)}
              </span>
            </div>

          </div>
        </div>

        {/* Custom Match Image Override */}
        {(match as any).matchImage && (
          <div className="mx-6 mt-3 rounded-2xl overflow-hidden aspect-video border border-white/5 relative shadow-lg">
            <ImageResolver 
              src={(match as any).matchImage} 
              className="w-full h-full object-cover animate-fade-in" 
              alt="Match Cover" 
              fallbackType="default"
            />
          </div>
        )}

        {/* Custom Match Description Override */}
        {(match as any).matchDescription && (
          <div className={`mx-6 mt-3 mb-1 p-4 rounded-2xl border text-xs leading-relaxed text-right font-medium bg-black/30 border-white/5 text-gray-300`} dir="rtl">
            <strong className="block font-black text-xs mb-1 text-white">معلومات واستوديو ترويجي عن اللقاء:</strong>
            { (match as any).matchDescription }
          </div>
        )}

        {/* Real Detailed Scores Segment */}
        <div className="p-5 border-t border-b border-white/5 bg-black/20 space-y-3.5">
          <h4 className="text-[10px] font-black uppercase text-[#10b981] border-r-2 border-[#10b981] pr-1.5">توزيع الأهداف والنتائج المعتمدة</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            
            {/* Full Time Score Box */}
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-center space-y-1">
              <span className="text-[9px] text-gray-400 font-bold block">النتيجة الكاملة</span>
              <strong className="text-sm font-black font-mono text-[#10b981]">
                {hFull !== null ? `${hFull} - ${aFull}` : "--"}
              </strong>
            </div>

            {/* First Half Score Box */}
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-center space-y-1">
              <span className="text-[9px] text-gray-400 font-bold block">الشوط الأول</span>
              <strong className="text-sm font-black font-mono text-white">
                {hHalf !== null ? `${hHalf} - ${aHalf}` : "0 - 0"}
              </strong>
            </div>

            {/* Second Half Score Box */}
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-center space-y-1">
              <span className="text-[9px] text-gray-400 font-bold block">الشوط الثاني</span>
              <strong className="text-sm font-black font-mono text-white">
                {hSec !== null ? `${hSec} - ${aSec}` : "0 - 0"}
              </strong>
            </div>

          </div>
        </div>

        {/* Dynamic Livestream Server Section */}
        {streams.length > 0 && (
          <div className="p-5 border-b border-white/5 bg-[#18150f]/20 space-y-3.5" dir="rtl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <h4 className="text-[10px] font-black uppercase text-[#d4af37] border-r-2 border-[#d4af37] pr-1.5 flex items-center gap-1.5">
                <Radio size={12} className="text-[#f3c623] animate-pulse" />
                <span>قنوات البث المباشر المعتمدة لتغطية المباراة</span>
              </h4>
              {selectedStream && (
                <div className="flex items-center gap-1.5">
                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-black px-2 py-0.5 rounded-lg">
                    الجودة: {selectedStream.streamQuality || 'FHD'}
                  </span>
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black px-2 py-0.5 rounded-lg animate-pulse">
                    مستقر وآمن ✅
                  </span>
                </div>
              )}
            </div>

            {activeStreamUrl && (
              <div className="relative rounded-2xl overflow-hidden aspect-video border border-[#d4af37]/35 bg-black shadow-xl">
                {activeStreamUrl.trim().startsWith('<') || activeStreamUrl.includes('<iframe') || activeStreamUrl.includes('<script') ? (
                  <div 
                    className="w-full h-full relative [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:border-0 [&_iframe]:absolute [&_iframe]:inset-0"
                    dangerouslySetInnerHTML={{ 
                      __html: DOMPurify.sanitize(activeStreamUrl || '', {
                        ALLOWED_TAGS: ['iframe', 'video', 'source', 'embed', 'object', 'div', 'p', 'span'],
                        ALLOWED_ATTR: ['src', 'width', 'height', 'frameborder', 'allowfullscreen', 'allow', 'style', 'class', 'id', 'controls', 'autoplay', 'muted', 'playsinline', 'preload', 'type', 'referrerpolicy']
                      }) 
                    }}
                  />
                ) : (
                  <iframe
                    src={activeStreamUrl.replace("watch?v=", "embed/")}
                    title="Wcup 2026 Server Player"
                    className="w-full h-full"
                    allowFullScreen
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>
            )}

            {/* Quick backup / primary routing choices if backup exists */}
            {selectedStream && selectedStream.backupStream && (
              <div className="flex items-center gap-2 justify-center bg-black/40 p-1.5 rounded-xl border border-white/5">
                <span className="text-[9px] text-gray-400 font-bold ml-auto pr-1">سيرفرات التوجيه الذكية:</span>
                <button
                  onClick={() => setActiveStreamUrl(selectedStream.primaryStream)}
                  className={`px-3 py-1 rounded-lg text-[9px] font-black transition-all ${
                    activeStreamUrl === selectedStream.primaryStream
                      ? 'bg-amber-500 text-black font-extrabold'
                      : 'bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  📡 البث الرئيسي
                </button>
                <button
                  onClick={() => setActiveStreamUrl(selectedStream.backupStream)}
                  className={`px-3 py-1 rounded-lg text-[9px] font-black transition-all ${
                    activeStreamUrl === selectedStream.backupStream
                      ? 'bg-amber-500 text-black font-extrabold'
                      : 'bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  🚀 البث الاحتياطي
                </button>
              </div>
            )}

            {/* Channel list switcher */}
            <div className="flex flex-wrap gap-1.5">
              {streams.map((stream, sIdx) => {
                const isCurrentObj = selectedStream?.id === stream.id;
                return (
                  <button
                    key={stream.id || sIdx}
                    onClick={() => {
                      setSelectedStream(stream);
                      setActiveStreamUrl(stream.primaryStream);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black transition-all ${
                      isCurrentObj
                        ? 'bg-[#d4af37] text-black border border-amber-300 font-extrabold shadow-md shadow-amber-500/10'
                        : 'bg-black text-gray-400 hover:text-white border border-white/5'
                    }`}
                  >
                    <Play size={8} />
                    <span>{stream.channelName}</span>
                    <span className="text-[8px] opacity-75 font-mono">({stream.streamQuality || 'FHD'})</span>
                  </button>
                );
              })}
            </div>

            {/* Stream Notes display */}
            {selectedStream && selectedStream.streamNotes && (
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-[10px] text-gray-300 leading-relaxed text-right font-bold flex items-start gap-2">
                <span className="text-[#f3c623]">📝</span>
                <div>
                  <span className="text-white font-extrabold block mb-0.5">ملاحظة القناة الناقلة:</span>
                  {selectedStream.streamNotes}
                </div>
              </div>
            )}
          </div>
        )}

        {/* API Limitation Notice Warning Body */}
        <div className="p-5">
          <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs flex items-start gap-2.5">
            <Info className="shrink-0 mt-0.5" size={15} />
            <div className="space-y-1">
              <strong className="block font-black text-orange-300">حدود ترخيص Football-Data المتاح:</strong>
              <p className="text-[10px] text-gray-300 leading-relaxed font-bold">
                حسب القيود المفروضة على ترخيص Football-Data المجاني، قد لا تتوفر معلومات التشكيلات الحية أو تفاصيل أحداث المباراة مثل الهدافين الدقيقين، البدلاء والبطاقات المحدثة دقيقة بدقيقة. لقد قمنا بتعطيل البيانات الوهمية لعرض النتائج الرسمية الموثقة والحقيقية فقط.
              </p>
            </div>
          </div>
        </div>

        {/* Venue, Referee and Details Footer */}
        <div className="p-4 bg-black/40 border-t border-white/5 text-[10px] text-gray-400 space-y-1.5 font-bold" dir="rtl">
          <div className="flex items-center justify-between flex-wrap gap-2 text-right">
            <span className="flex items-center gap-1.5">
              <Calendar size={12} className="text-[#10b981]" />
              التاريخ: <strong className="text-white">{localDateStr} ({localTimeStr})</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <Shield size={12} className="text-[#10b981]" />
              الحكم: <strong className="text-white">{refereeName}</strong>
            </span>
          </div>

          {((match as any).commentator || (match as any).broadcastingChannels) && (
            <div className="flex items-center justify-between flex-wrap gap-2 text-right border-t border-white/5 pt-1.5">
              {(match as any).commentator && (
                <span className="flex items-center gap-1.5">
                  <User size={12} className="text-[#10b981]" />
                  المعلق الرياضي: <strong className="text-[#d4af37]">{(match as any).commentator}</strong>
                </span>
              )}
              {(match as any).broadcastingChannels && (
                <span className="flex items-center gap-1.5">
                  <Radio size={12} className="text-[#10b981]" />
                  القنوات الناقلة: <strong className="text-[#10b981]">{(match as any).broadcastingChannels}</strong>
                </span>
              )}
            </div>
          )}

          {match.venue && (
            <div className="flex items-center gap-1.5 border-t border-white/5 pt-1.5">
              <MapPin size={12} className="text-[#10b981]" />
              الملعب: <strong className="text-white">{match.venue}</strong>
            </div>
          )}
        </div>

      </motion.div>
    </div>
  );
}
