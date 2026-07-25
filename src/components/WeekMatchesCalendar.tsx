import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  Bell, 
  BellOff, 
  Loader2, 
  Tv, 
  Radio, 
  Clock, 
  AlertTriangle, 
  Calendar,
  RotateCw,
  Trophy,
  Info,
  Sparkles
} from 'lucide-react';
import { useMatches } from '../hooks/useMatchesV2';
import { useNotifications } from '../context/NotificationContext';
import { useError } from '../context/ErrorContext';
import { auth } from '../firebase';
import { getLocalDateString } from '../utils/dateUtils';
import { createSlugPath } from '../utils/slugify';
import { cn } from '../lib/utils';
import ImageResolver from './ui/ImageResolver';
import LiveMatchIndicator from './ui/LiveMatchIndicator';

export default function WeekMatchesCalendar() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const { 
    notifiedMatches, 
    toggleMatchNotification 
  } = useNotifications();
  const { showToast } = useError();

  // Selected date string in YYYY-MM-DD format
  const [selectedDate, setSelectedDate] = useState<string>(() => getLocalDateString());
  
  // Base date of the current visible 7-day strip
  const [baseDate, setBaseDate] = useState<Date>(() => new Date());

  // Generate 7 days starting from baseDate
  const weekDays = useMemo(() => {
    const days = [];
    const tempDate = new Date(baseDate);
    
    // We can center the week or start from baseDate. Let's start from baseDate (with 1 day back for context and 6 days forward)
    const start = new Date(tempDate);
    start.setDate(tempDate.getDate() - 1); // 1 day back for better backward context

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dateStr = getLocalDateString(d);
      
      // Determine day name in Arabic
      const dayName = d.toLocaleDateString('ar-EG', { weekday: 'short' });
      const dayNum = d.getDate();
      const monthName = d.toLocaleDateString('ar-EG', { month: 'short' });
      const isToday = dateStr === getLocalDateString(new Date());

      days.push({
        dateStr,
        dayName,
        dayNum,
        monthName,
        isToday,
        rawDate: d
      });
    }
    return days;
  }, [baseDate]);

  // Handle navigating week by week
  const handlePrevWeek = () => {
    const newBase = new Date(baseDate);
    newBase.setDate(baseDate.getDate() - 7);
    setBaseDate(newBase);
    
    // Auto select the first day of that new range for smooth UX
    const firstDay = new Date(newBase);
    firstDay.setDate(newBase.getDate() - 1);
    setSelectedDate(getLocalDateString(firstDay));
  };

  const handleNextWeek = () => {
    const newBase = new Date(baseDate);
    newBase.setDate(baseDate.getDate() + 7);
    setBaseDate(newBase);

    const firstDay = new Date(newBase);
    firstDay.setDate(newBase.getDate() - 1);
    setSelectedDate(getLocalDateString(firstDay));
  };

  // Reset to current real date
  const handleResetToToday = () => {
    const today = new Date();
    setBaseDate(today);
    setSelectedDate(getLocalDateString(today));
    showToast('تم العودة لليوم الحالي', 'info');
  };

  // Quick jump helper for July 17th, 2026 (the real available matches dates)
  const handleJumpToDemoWeek = () => {
    const demoDate = new Date('2026-07-17T12:00:00');
    setBaseDate(demoDate);
    setSelectedDate('2026-07-19');
    showToast('تم الانتقال لأسبوع مباريات الدوري المتاحة (يوليو 2026)', 'success');
  };

  // React Query fetch for selectedDate matches
  const { data: rawMatches = [], isLoading, isError, refetch, isFetching } = useMatches({ date: selectedDate });

  // Filter out hidden or corrupted records
  const matches = useMemo(() => {
    return Array.isArray(rawMatches) ? rawMatches.filter(m => !m.isHidden) : [];
  }, [rawMatches]);

  // Group matches by league for a gorgeous bento/card structure
  const groupedLeagues = useMemo(() => {
    const groups: Record<string, { matches: any[]; logo: string }> = {};
    matches.forEach(match => {
      const leagueName = typeof match.league === 'object' ? match.league?.name : match.league || 'بطولات أخرى';
      const leagueLogo = match.leagueLogo || '';
      if (!groups[leagueName]) {
        groups[leagueName] = {
          matches: [],
          logo: leagueLogo
        };
      }
      groups[leagueName].matches.push(match);
    });
    return groups;
  }, [matches]);

  const leagueNames = useMemo(() => Object.keys(groupedLeagues), [groupedLeagues]);

  // Toggle match alert notification
  const handleToggleNotification = async (e: React.MouseEvent, matchId: string, matchTitle: string) => {
    e.stopPropagation();
    if (!user) {
      showToast('يرجى تسجيل الدخول من صفحة الملف الشخصي لتفعيل جرس التنبيهات للمباريات', 'info');
      return;
    }
    
    try {
      await toggleMatchNotification(matchId);
      const isAlreadyNotified = notifiedMatches.includes(matchId);
      if (isAlreadyNotified) {
        showToast(`تم إلغاء تنبيه مباراة: ${matchTitle}`, 'info');
      } else {
        showToast(`تم تفعيل تنبيه مباراة: ${matchTitle}! ستتلقى إشعاراً عند البث المباشر.`, 'success');
      }
    } catch (err) {
      console.error('Error toggling match alert:', err);
      showToast('عذراً، فشل تحديث حالة التنبيه للمباراة.', 'error');
    }
  };

  return (
    <div className="space-y-6" id="week-calendar-component">
      {/* 1. TOP CALENDAR NAVIGATOR AND CONTROLLER */}
      <div className="bg-surface p-4 rounded-2xl border border-white/5 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="text-primary w-5 h-5" />
            <h2 className="text-md sm:text-lg font-black text-white">تصفح جدول الأسبوع القادم</h2>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Quick jump to demo week banner helper if we are not in July 2026 */}
            {!selectedDate.includes('2026-07') && (
              <button 
                onClick={handleJumpToDemoWeek}
                className="text-[10px] sm:text-xs bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all cursor-pointer"
              >
                <Sparkles size={12} className="animate-pulse" />
                <span>عرض أسبوع المباريات المتاحة</span>
              </button>
            )}

            <button
              onClick={handleResetToToday}
              className="text-xs text-gray-400 hover:text-white px-2.5 py-1.5 rounded-xl hover:bg-white/5 transition-all font-bold cursor-pointer"
            >
              اليوم
            </button>
          </div>
        </div>

        {/* 7-DAY HORIZONTAL CALENDAR SLIDER */}
        <div className="flex items-center justify-between gap-2 pt-1 select-none">
          {/* Previous Week navigation */}
          <button
            onClick={handlePrevWeek}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 hover:text-primary border border-white/5 transition-all cursor-pointer shrink-0"
            title="الأسبوع السابق"
          >
            <ChevronRight size={18} />
          </button>

          {/* Days Slider Grid */}
          <div className="flex-1 grid grid-cols-7 gap-1.5 sm:gap-2">
            {weekDays.map((sd) => {
              const isActive = selectedDate === sd.dateStr;
              return (
                <button
                  key={sd.dateStr}
                  onClick={() => setSelectedDate(sd.dateStr)}
                  className={cn(
                    "py-2.5 px-1 sm:px-2 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden border",
                    isActive
                      ? "bg-primary border-primary text-black font-black shadow-lg shadow-primary/10 scale-102"
                      : "bg-black/20 border-white/5 text-gray-300 hover:bg-white/5 hover:border-white/10"
                  )}
                  id={`week-day-btn-${sd.dateStr}`}
                >
                  {/* Today dot indicator */}
                  {sd.isToday && (
                    <span className={cn(
                      "absolute top-1.5 w-1 h-1 rounded-full",
                      isActive ? "bg-black" : "bg-primary animate-ping"
                    )}></span>
                  )}

                  <span className="text-[9px] sm:text-[10px] uppercase font-bold opacity-75 truncate max-w-full">
                    {sd.dayName}
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold mt-0.5">
                    {sd.dayNum}
                  </span>
                  <span className="text-[8px] sm:text-[9px] opacity-70 truncate max-w-full">
                    {sd.monthName}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Next Week navigation */}
          <button
            onClick={handleNextWeek}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 hover:text-primary border border-white/5 transition-all cursor-pointer shrink-0"
            title="الأسبوع القادم"
          >
            <ChevronLeft size={18} />
          </button>
        </div>
      </div>

      {/* DEMO INSTRUCTION HELPER BLOCK */}
      {selectedDate.includes('2026-07-19') && (
        <motion.div 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex gap-3 text-emerald-400 items-start shadow-sm"
        >
          <Info size={18} className="shrink-0 mt-0.5 text-emerald-400" />
          <div className="space-y-1">
            <h4 className="text-xs font-black">أسبوع المباريات التجريبية نشط!</h4>
            <p className="text-[11px] leading-relaxed text-emerald-300 font-medium">
              لقد انتقلت إلى الفترة التي تحتوي على مباريات حقيقية مسجلة في قاعدة البيانات. تصفح الأيام (17 و 18 و 19 يوليو) لرؤية جدول المباريات، واضغط على أيقونة 🔔 <b>جرس التنبيه</b> لتفعيل التنبيهات المخصصة لكل مباراة وتجربتها بشكل كامل!
            </p>
          </div>
        </motion.div>
      )}

      {/* 2. MATCHES LIST FOR SELECTED DATE */}
      <div className="space-y-4">
        {isError ? (
          <div className="bg-surface border border-white/5 rounded-2xl p-8 text-center space-y-3">
            <AlertTriangle className="mx-auto text-red-500 w-10 h-10" />
            <h3 className="text-sm font-black text-white">فشل تحميل مباريات اليوم المحدد</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              حدث خطأ غير متوقع أثناء استرجاع البيانات من الخادم. يرجى إعادة المحاولة لاحقاً.
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary text-xs font-bold rounded-xl transition-all"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : isLoading ? (
          <div className="bg-surface border border-white/5 rounded-2xl p-16 text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-xs text-gray-400 font-bold">جاري تحميل جدول المباريات المحدث...</p>
          </div>
        ) : leagueNames.length > 0 ? (
          <div className="space-y-6">
            {leagueNames.map(leagueName => {
              const league = groupedLeagues[leagueName];
              
              return (
                <div key={leagueName} className="space-y-3">
                  {/* League Header banner */}
                  <div className="flex items-center gap-2 px-1">
                    {league.logo ? (
                      <ImageResolver 
                        src={league.logo} 
                        alt={leagueName} 
                        fallbackType="league"
                        className="w-5 h-5 object-contain rounded-full bg-white/10 p-0.5 shrink-0" 
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[10px] text-primary font-black shrink-0">🏆</div>
                    )}
                    <span className="text-xs font-black text-gray-300">{leagueName}</span>
                    <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-0.5 rounded-full font-bold">
                      {league.matches.length} {league.matches.length === 1 ? 'مباراة' : 'مباريات'}
                    </span>
                  </div>

                  {/* Matches List */}
                  <div className="bg-surface border border-white/5 rounded-2xl divide-y divide-white/5 overflow-hidden shadow-md">
                    {league.matches.map(match => {
                      const isNotified = notifiedMatches.includes(match.id);
                      const isLive = match.status === 'LIVE' || match.isLive;
                      const homeName = typeof match.homeTeam === 'object' ? match.homeTeam.name : match.homeTeam;
                      const awayName = typeof match.awayTeam === 'object' ? match.awayTeam.name : match.awayTeam;
                      const matchTitle = `${homeName} × ${awayName}`;

                      return (
                        <div
                          key={match.id}
                          onClick={() => navigate(`/match/${createSlugPath(`${homeName} vs ${awayName}`, match.id)}`)}
                          className="p-3 sm:p-4 hover:bg-white/[0.01] transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative group"
                        >
                          {/* Timing / Live badge */}
                          <div className="flex items-center gap-2 shrink-0">
                            <LiveMatchIndicator 
                              status={match.status} 
                              isLiveProp={isLive}
                              minute={match.minute}
                              startTime={match.startTime || match.utcDate}
                              size="xs"
                              showIcon={true}
                            />
                            
                            {/* Channels & commentator tags */}
                            {match.channel && (
                              <span className="flex items-center gap-1 text-[9px] bg-white/5 text-gray-400 px-1.5 py-0.5 rounded border border-white/5">
                                <Tv size={10} className="text-secondary" />
                                <span className="max-w-[70px] truncate">{match.channel}</span>
                              </span>
                            )}
                          </div>

                          {/* Teams Panel */}
                          <div className="flex-1 flex items-center justify-between sm:justify-center gap-3 sm:gap-6 py-1">
                            {/* Home Team */}
                            <div className="flex items-center justify-end gap-2 flex-1 min-w-0">
                              <span className="text-xs font-black text-gray-200 group-hover:text-primary transition-colors text-right truncate">
                                {homeName}
                              </span>
                              <ImageResolver 
                                src={match.homeLogo || undefined} 
                                alt="" 
                                fallbackType="team"
                                fallbackText={homeName}
                                className="w-6 h-6 object-contain shrink-0 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" 
                              />
                            </div>

                            {/* VS/Score block */}
                            <div className="shrink-0 min-w-[60px] text-center flex justify-center">
                              {match.status === 'UPCOMING' ? (
                                <span className="text-[10px] font-black bg-white/5 border border-white/5 text-gray-400 px-2.5 py-1 rounded-lg">
                                  VS
                                </span>
                              ) : (
                                <div className={cn(
                                  "flex items-center gap-1 px-2.5 py-1 rounded-xl border font-mono text-xs font-black",
                                  isLive 
                                    ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400 animate-pulse" 
                                    : "bg-black/30 border-white/5 text-white"
                                )}>
                                  <span>{match.homeScore ?? 0}</span>
                                  <span className="text-gray-500">:</span>
                                  <span>{match.awayScore ?? 0}</span>
                                </div>
                              )}
                            </div>

                            {/* Away Team */}
                            <div className="flex items-center justify-start gap-2 flex-1 min-w-0">
                              <ImageResolver 
                                src={match.awayLogo || undefined} 
                                alt="" 
                                fallbackType="team"
                                fallbackText={awayName}
                                className="w-6 h-6 object-contain shrink-0 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" 
                              />
                              <span className="text-xs font-black text-gray-200 group-hover:text-primary transition-colors text-left truncate">
                                {awayName}
                              </span>
                            </div>
                          </div>

                          {/* Quick Actions (Set Reminder Bell button) */}
                          <div className="flex items-center justify-end gap-2 shrink-0 select-none">
                            <button
                              onClick={(e) => handleToggleNotification(e, match.id, matchTitle)}
                              className={cn(
                                "p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 text-[10px] sm:text-xs font-bold",
                                isNotified
                                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                  : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                              )}
                              title={isNotified ? "إلغاء التنبيه" : "تنشيط التنبيه للمباراة"}
                            >
                              {isNotified ? (
                                <>
                                  <BellOff size={12} className="animate-pulse" />
                                  <span>إيقاف التنبيه</span>
                                </>
                              ) : (
                                <>
                                  <Bell size={12} />
                                  <span>نبهني</span>
                                </>
                              )}
                            </button>

                            <div className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-1.5 transition-all flex items-center text-primary text-[10px] font-black mr-1 hidden sm:flex">
                              <span>التفاصيل</span>
                              <ChevronLeft size={14} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-surface border border-white/5 rounded-2xl p-12 text-center space-y-4">
            <CalendarDays className="mx-auto text-gray-600 w-12 h-12" />
            <div className="space-y-1">
              <h3 className="text-sm font-black text-white">لا توجد مباريات مجدولة لليوم المحدد</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                لم نجد أي مباريات مدرجة في قاعدة البيانات لهذا التاريخ. جرب اختيار تاريخ آخر أو استخدام زر المساعدة أعلاه للتجربة.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
