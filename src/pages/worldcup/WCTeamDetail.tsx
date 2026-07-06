import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import ImageResolver from '../../components/ui/ImageResolver';
import { 
  X, Shield, Award, Users, MapPin, Globe, ExternalLink, Calendar, Info
} from 'lucide-react';
import { worldCupService, WCTeam, WCMatch } from '../../services/worldCupService';

interface WCTeamDetailProps {
  teamId: string | number;
  onClose: () => void;
  onOpenPlayer: (id: string | number) => void;
  onOpenMatch: (id: string | number) => void;
  isDark: boolean;
}

export default function WCTeamDetail({ teamId, onClose, onOpenPlayer, onOpenMatch, isDark }: WCTeamDetailProps) {
  const [team, setTeam] = useState<any | null>(null);
  const [matches, setMatches] = useState<WCMatch[]>([]);
  const [activeTab, setActiveTab] = useState<'fixtures' | 'profile'>('fixtures');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchTeamData = async () => {
      setLoading(true);
      try {
        const teamsList = await worldCupService.getWorldCupTeams();
        const found = teamsList.find(t => String(t.id) === String(teamId));
        if (found) {
          setTeam(found);
        }

        const matchesList = await worldCupService.getWorldCupMatches();
        const teamMatches = matchesList.filter(
          m => String(m.homeTeam.id) === String(teamId) || String(m.awayTeam.id) === String(teamId)
        );
        setMatches(teamMatches);
      } catch (err) {
        console.error("Error loading team detail:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeamData();
  }, [teamId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className={`w-full max-w-xl rounded-3xl p-6 ${isDark ? 'bg-[#0a0a0c]' : 'bg-white'} animate-pulse h-[350px] flex flex-col justify-between`}>
          <div className="h-6 w-1/3 bg-gray-700/50 rounded" />
          <div className="h-28 bg-gray-700/50 rounded-xl" />
          <div className="h-10 bg-gray-700/50 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className={`w-full max-w-md rounded-2xl p-6 text-center ${isDark ? 'bg-[#0a0a0c] text-white' : 'bg-white text-slate-950'}`}>
          <h3 className="text-sm font-black mb-2">عذراً، لم يتم العثور على المنتخب المطلوب</h3>
          <button onClick={onClose} className="px-5 py-2 bg-[#d4af37] text-black font-black text-xs rounded-xl">إغلاق</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border ${
          isDark ? 'bg-[#0a0a0c] border-[#d4af37]/20 text-white' : 'bg-slate-50 border-slate-200 text-slate-950'
        }`}
      >
        {/* Banner with National Crest */}
        <div className="relative p-6 text-right bg-gradient-to-l from-[#d4af37]/10 via-transparent to-transparent border-b border-white/5">
          <div className="absolute top-4 left-4">
            <button 
              onClick={onClose}
              className={`p-2 rounded-full hover:bg-white/10 transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex items-center gap-4 mt-3">
            <ImageResolver 
              src={team.crest} 
              alt={team.name} 
              fallbackType="team"
              fallbackText={team.name}
              tla={team.tla}
              className="w-14 h-14 object-contain rounded-xl bg-white/5 p-1 shadow-inner"
            />
            <div className="space-y-1">
              <h2 className="text-xl font-black">{worldCupService.translateTeam(team.name)}</h2>
              <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold">
                <span className="font-mono tracking-wider text-[#f3c623]">{team.tla}</span>
                <span>•</span>
                <span>المنتخب الرسمي للبلاد</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic sub navigation tabs */}
        <div className={`flex border-b ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
          <button 
            onClick={() => setActiveTab('fixtures')}
            className={`flex-1 py-3 text-xs font-black text-center border-b-2 transition-all ${
              activeTab === 'fixtures' ? 'border-[#d4af37] text-[#f3c623]' : 'border-transparent text-gray-400 hover:text-[#f3c623]'
            }`}
          >
            مباريات المنتخب الحالية ({matches.length})
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 text-xs font-black text-center border-b-2 transition-all ${
              activeTab === 'profile' ? 'border-[#d4af37] text-[#f3c623]' : 'border-transparent text-gray-400 hover:text-[#f3c623]'
            }`}
          >
            معلومات وتعريف بالمنتخب
          </button>
        </div>

        {/* Content Panel */}
        <div className="p-5 max-h-[350px] overflow-y-auto space-y-4">
          
          {/* TAB 1: Match fixtures */}
          {activeTab === 'fixtures' && (
            <div className="space-y-2.5">
              {matches.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-500 font-bold">لا توجد مباريات مسجلة للمنتخب في كأس العالم حالياً.</div>
              ) : (
                matches.map(m => {
                  const isLive = ['LIVE', 'IN_PLAY', 'PAUSED'].includes(m.status);
                  const isFinished = ['FINISHED', 'FT'].includes(m.status);

                  return (
                    <div 
                      key={m.id}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] transition-all border border-white/5 cursor-pointer"
                      onClick={() => onOpenMatch(m.id)}
                    >
                      <div className="flex items-center gap-2.5 w-5/12">
                        <ImageResolver 
                          src={m.homeTeam.crest} 
                          fallbackType="team"
                          fallbackText={m.homeTeam.name}
                          tla={m.homeTeam.tla}
                          className="w-6 h-5 object-contain" 
                          alt="" 
                        />
                        <span className="text-[11px] font-extrabold truncate">{worldCupService.translateTeam(m.homeTeam.name)}</span>
                      </div>
                      
                      <div className="flex flex-col items-center justify-center w-2/12">
                        {isLive || isFinished ? (
                          <span className="text-xs font-black font-mono text-[#f3c623] bg-[#d4af37]/5 px-2.5 py-0.5 rounded-lg border border-[#d4af37]/15">
                            {m.score.fullTime.home} - {m.score.fullTime.away}
                          </span>
                        ) : (
                          <span className="text-[9px] font-black text-gray-400">
                            {new Date(m.utcDate).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                        <span className="text-[8px] text-gray-500 font-bold mt-0.5">
                          {worldCupService.translateStatus(m.status)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 justify-end w-5/12 text-left">
                        <span className="text-[11px] font-extrabold truncate order-1">{worldCupService.translateTeam(m.awayTeam.name)}</span>
                        <ImageResolver 
                          src={m.awayTeam.crest} 
                          fallbackType="team"
                          fallbackText={m.awayTeam.name}
                          tla={m.awayTeam.tla}
                          className="w-6 h-5 object-contain order-2" 
                          alt="" 
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: Profile definitions */}
          {activeTab === 'profile' && (
            <div className="space-y-4 text-xs leading-relaxed text-gray-300 font-sans">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                <h4 className="font-black text-[#f3c623] text-xs flex items-center gap-1.5 pb-1 border-b border-white/5">
                  <Award size={13} />
                  بيانات الاتحاد والمنتخب الوطني
                </h4>
                <div className="space-y-1.5 font-bold text-[11px]">
                  {team.ranking && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">الترتيب العالمي للفيفا:</span>
                      <strong className="text-[#f3c623]">الموقع #{team.ranking}</strong>
                    </div>
                  )}
                  {team.coach && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">المدير الفني (المدرب):</span>
                      <strong className="text-white">{team.coach}</strong>
                    </div>
                  )}
                  {team.history && (
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-bold">أفضل إنجازات المونديال:</span>
                      <strong className="text-[#f3c623]">{team.history}</strong>
                    </div>
                  )}
                  {team.founded && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">سنة التأسيس:</span>
                      <strong className="text-white">{team.founded}</strong>
                    </div>
                  )}
                  {team.venue && (
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-bold">الملعب الوطني:</span>
                      <strong className="text-white">{team.venue}</strong>
                    </div>
                  )}
                  {team.clubColors && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">ألوان طقم المنتخب:</span>
                      <strong className="text-white">{team.clubColors}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Roster is unavailable because API limitations */}
              <div className="p-4 rounded-2xl bg-[#18150f] border border-[#d4af37]/20 text-[#f3c623]">
                <h4 className="font-black text-[#f3c623] text-xs flex items-center gap-1.5 mb-1">
                  <Info size={13} />
                  كتيبة اللاعبين غير متوفرة:
                </h4>
                <p className="text-[10px] text-gray-300 font-bold leading-relaxed">
                  نظراً لقيود الـ Football-Data API المجاني، لا يتم توفير تشكيلة اللاعبين الكاملة (Squad / Roster) لهذا الاتحاد عبر الاستعلامات العامة. لضمان الموثوقية التامة وعرض بيانات حقيقية 100% فقط، قمنا بإلغاء التشكيلات الوهمية.
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
