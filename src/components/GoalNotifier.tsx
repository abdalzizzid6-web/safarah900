import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLiveMatches } from '../hooks/useMatchesV2';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import * as userRepository from '../features/users/repositories/userRepository';
import { useError } from '../context/ErrorContext';
import { Match } from '../types';
import { generateMatchEvents, TimelineEvent } from './TimelineView';
import { motion, AnimatePresence } from 'motion/react';
import { useNotifications } from '../context/NotificationContext';
import { FAMOUS_TEAMS } from '../api/apiClient';
import { 
  Trophy, 
  AlertTriangle, 
  ArrowLeftRight, 
  Volume2, 
  VolumeX, 
  Megaphone,
  Bell,
  X,
  Play,
  CheckCircle,
  TrendingUp
} from 'lucide-react';

interface ActiveNotification {
  id: string;
  type: 'goal' | 'yellow_card' | 'red_card' | 'sub' | 'status_change';
  title: string;
  body: string;
  playerName: string;
  teamName: string;
  minute: number;
  matchInfo: string;
}

export default function GoalNotifier() {
  const { data: matches = [] } = useLiveMatches();
  const [user] = useAuthState(auth);
  const { addNotificationLog, subscriptions, favoriteTeamIds } = useNotifications();
  const [notifiedMatches, setNotifiedMatches] = useState<string[]>([]);
  const { showToast } = useError();
  const prevMatchesRef = useRef<Match[]>([]);
  
  // Real-time notifications settings
  const [activeNotifications, setActiveNotifications] = useState<ActiveNotification[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [enableVoice, setEnableVoice] = useState<boolean>(true);

  // Listen to user's notified matches list in real-time
  useEffect(() => {
    if (!user) {
      setNotifiedMatches([]);
      return;
    }
    const unsub = userRepository.subscribeToUserProfile(user.uid, (profile) => {
      if (profile) {
        setNotifiedMatches(profile.notifiedMatches || []);
      }
    });
    return () => unsub();
  }, [user]);

  // Audio syntheziser tone generator Custom-made for Football Events
  const playEventSound = useCallback((type: 'goal' | 'yellow_card' | 'red_card' | 'sub') => {
    if (isMuted) return;
    
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      if (type === 'goal') {
        // GOAL: Excited stadium referee whistle + climbing glorious fanfare pings
        // Whistle:
        for (let w = 0; w < 3; w++) {
          const start = now + w * 0.22;
          const duration = 0.16;
          
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(850, start);
          osc.frequency.exponentialRampToValueAtTime(1300, start + duration);
          
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(0.25, start + 0.02);
          gain.gain.setValueAtTime(0.25, start + duration - 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(start);
          osc.stop(start + duration);
        }

        // Fanfare chord: C5 -> E5 -> G5 -> C6
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const start = now + 0.5 + idx * 0.08;
          const duration = 1.2;
          
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);
          
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(0.2, start + 0.08);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(start);
          osc.stop(start + duration);
        });

      } else if (type === 'yellow_card') {
        // YELLOW_CARD: High alert buzzer sound (medium tension warning)
        const duration = 0.35;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(340, now + duration);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + duration);

      } else if (type === 'red_card') {
        // RED_CARD: Double warning low-buzzer (High dramatic alert feel)
        for (let i = 0; i < 2; i++) {
          const start = now + i * 0.22;
          const duration = 0.18;
          
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(190, start);
          osc.frequency.linearRampToValueAtTime(150, start + duration);
          
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(0.25, start + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(start);
          osc.stop(start + duration);
        }

      } else if (type === 'sub') {
        // SUB: Uplifting retro digital chime transitions (pleasant double-tone swap)
        const notes = [587.33, 783.99, 880.00, 1174.66]; // D5, G5, A5, D6
        notes.forEach((freq, idx) => {
          const start = now + idx * 0.07;
          const duration = 0.5;
          
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);
          
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(0.15, start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(start);
          osc.stop(start + duration);
        });
      }
    } catch (e) {
      console.warn("Audio Context playback stalled/blocked:", e);
    }
  }, [isMuted]);

  // Excited Arabic Text-to-Speech Speaker
  const announceViaSpeech = useCallback((text: string) => {
    if (!enableVoice || isMuted || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel(); // Clears queue
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar';
      utterance.rate = 1.05; // Slightly rapid exciting commentator speed
      utterance.pitch = 1.15; // Higher enthusiasm pitch
      
      const voices = window.speechSynthesis.getVoices();
      const arVoice = voices.find(v => v.lang.startsWith('ar') || v.lang.includes('ARA'));
      if (arVoice) {
        utterance.voice = arVoice;
      }
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("TTS playback stalled/blocked:", e);
    }
  }, [enableVoice, isMuted]);

  // Unified Notification Trigger
  const triggerNotification = useCallback((notif: ActiveNotification) => {
    // Only yield favorite teams if the filter toggle is enabled
    if (notif.type === 'goal' && subscriptions?.onlyFavoriteTeams) {
      const selectedTeamNames = FAMOUS_TEAMS.filter((t) => favoriteTeamIds?.includes(t.id)).map((t) => t.name.toLowerCase());
      const eventTeamLower = String(notif.teamName).toLowerCase();
      const isFavorite = selectedTeamNames.some((name) => eventTeamLower.includes(name) || name.includes(eventTeamLower));
      if (!isFavorite) {
        return; // Skip displaying banner
      }
    }

    // Add to active stack
    setActiveNotifications((prev) => {
      // Avoid exact duplicates
      if (prev.some((n) => n.id === notif.id)) return prev;
      return [...prev, notif];
    });

    // Pipe to central notification logs securely
    let mappedType: 'goal' | 'result' | 'card' | 'status_change' = 'status_change';
    if (notif.type === 'goal') {
      mappedType = 'goal';
    } else if (notif.type === 'yellow_card' || notif.type === 'red_card' || notif.type === 'sub') {
      mappedType = 'card';
    } else if (notif.type === 'status_change') {
      mappedType = notif.title.includes('🏁') ? 'result' : 'status_change';
    }

    addNotificationLog(
      mappedType,
      notif.title,
      notif.body,
      notif.id,
      {
        playerName: notif.playerName,
        teamName: notif.teamName,
        minute: notif.minute,
        matchInfo: notif.matchInfo
      }
    );

    // Play synthesized custom alert sound
    if (notif.type === 'goal') {
      playEventSound('goal');
      announceViaSpeech(`هدف! هدف للفريق! اللاعب ${notif.playerName} يسجل الهدف في الدقيقة ${notif.minute}`);
    } else if (notif.type === 'yellow_card') {
      playEventSound('yellow_card');
      announceViaSpeech(`بطاقة صفراء موجهة للاعب في الدورة ${notif.playerName}`);
    } else if (notif.type === 'red_card') {
      playEventSound('red_card');
      announceViaSpeech(`طرد بطاقة حمراء مباشرة للاعب ${notif.playerName}`);
    } else if (notif.type === 'sub') {
      playEventSound('sub');
      announceViaSpeech(`تبديل في المباراة. دخول اللاعب والمستأثر ${notif.playerName}`);
    }

    // Auto dismiss after 7.5 seconds
    setTimeout(() => {
      setActiveNotifications((prev) => prev.filter((n) => n.id !== notif.id));
    }, 7500);
  }, [playEventSound, announceViaSpeech, addNotificationLog, subscriptions, favoriteTeamIds]);


  // Watch for live updates on matches
  useEffect(() => {
    const safeMatches = Array.isArray(matches) ? matches : [];
    if (safeMatches.length === 0) return;

    const safePrevMatches = Array.isArray(prevMatchesRef.current) ? prevMatchesRef.current : [];

    if (safePrevMatches.length === 0) {
      prevMatchesRef.current = safeMatches;
      return;
    }

    safeMatches.forEach((currentMatch) => {
      const prevMatch = safePrevMatches.find((m) => m.id === currentMatch.id);
      
      if (prevMatch) {
        // Verify if user turned on notifications for this specific match
        const isUserInterested = notifiedMatches.includes(currentMatch.id);

        if (isUserInterested) {
          // Compute generated match events for dynamic state transitions
          const currentEvents = generateMatchEvents(currentMatch);
          const prevEvents = generateMatchEvents(prevMatch);

          const prevEventIds = new Set(prevEvents.map((e) => e.id));
          const newEvents = currentEvents.filter((e) => !prevEventIds.has(e.id));

          newEvents.forEach((event) => {
            const homeName = typeof currentMatch.homeTeam === 'string' ? currentMatch.homeTeam : (currentMatch.homeTeam?.name || '');
            const awayName = typeof currentMatch.awayTeam === 'string' ? currentMatch.awayTeam : (currentMatch.awayTeam?.name || '');
            const teamName = event.team === 'home' ? homeName : awayName;

            if (event.type === 'goal') {
              const scoreString = `[ ${currentMatch.homeScore ?? 0} - ${currentMatch.awayScore ?? 0} ]`;
              triggerNotification({
                id: event.id,
                type: 'goal',
                title: '⚽ هددددف رائع! جوووول!',
                body: `اللاعب ${event.player} يسجل هدفاً حاسماً لصالح ${teamName} بالدقيقة ${event.minute}! ${event.detail ? `(${event.detail})` : ''}`,
                playerName: event.player || 'اسم اللاعب',
                teamName: teamName,
                minute: event.minute,
                matchInfo: `${homeName} ${scoreString} ${awayName}`
              });

            } else if (event.type === 'yellow_card') {
              triggerNotification({
                id: event.id,
                type: 'yellow_card',
                title: '🟨 كارت أصفر!',
                body: `إنذار وتنبيه موجه للاعب ${event.player} (${teamName}) في الدقيقة ${event.minute}. السبب: ${event.detail || 'عرقلة هجمة'}`,
                playerName: event.player || 'اسم اللاعب',
                teamName: teamName,
                minute: event.minute,
                matchInfo: `${homeName} ضد ${awayName}`
              });

            } else if (event.type === 'red_card') {
              triggerNotification({
                id: event.id,
                type: 'red_card',
                title: '🟥 كارت أحمر مباشر وطرد!',
                body: `حالة طرد مباشرة للاعب ${event.player} (${teamName}) في الدقيقة ${event.minute}! التفاصيل: ${event.detail || 'تدخل خشن'}`,
                playerName: event.player || 'اسم اللاعب',
                teamName: teamName,
                minute: event.minute,
                matchInfo: `${homeName} ضد ${awayName}`
              });

            } else if (event.type === 'sub') {
              triggerNotification({
                id: event.id,
                type: 'sub',
                title: '🔄 تبديل تكتيكي جيراني!',
                body: `دخول اللاعب البديل ${event.player} وخروج اللاعب ${event.playerOut || 'الأساسي'} بالدقيقة ${event.minute}`,
                playerName: `${event.player} (بديل)`,
                teamName: teamName,
                minute: event.minute,
                matchInfo: `${homeName} ضد ${awayName}`
              });
            }
          });

          // Fallback alerts if timeline events fail to build but values differ
          if (newEvents.length === 0) {
            const homeNameFallback = typeof currentMatch.homeTeam === 'string' ? currentMatch.homeTeam : (currentMatch.homeTeam?.name || '');
            const awayNameFallback = typeof currentMatch.awayTeam === 'string' ? currentMatch.awayTeam : (currentMatch.awayTeam?.name || '');

            if ((currentMatch.homeScore ?? 0) > (prevMatch.homeScore ?? 0)) {
              triggerNotification({
                id: `fb-goal-h-${currentMatch.id}-${currentMatch.homeScore}`,
                type: 'goal',
                title: '⚽ هددددف لصالح المستضيف!',
                body: `جووووول يهز الشباك! فريق ${homeNameFallback} يسجل الآن! النتيجة: [ ${homeNameFallback} ${currentMatch.homeScore} - ${currentMatch.awayScore} ${awayNameFallback} ]`,
                playerName: 'مسجل الهدف',
                teamName: homeNameFallback,
                minute: currentMatch.minute || 0,
                matchInfo: `${homeNameFallback} ضد ${awayNameFallback}`
              });
            }
            if ((currentMatch.awayScore ?? 0) > (prevMatch.awayScore ?? 0)) {
              triggerNotification({
                id: `fb-goal-a-${currentMatch.id}-${currentMatch.awayScore}`,
                type: 'goal',
                title: '⚽ هددددف لصالح الضيوف!',
                body: `جووووول رائع! فريق ${awayNameFallback} يسجل هدفاً الآن! النتيجة: [ ${homeNameFallback} ${currentMatch.homeScore} - ${currentMatch.awayScore} ${awayNameFallback} ]`,
                playerName: 'مسجل الهدف',
                teamName: awayNameFallback,
                minute: currentMatch.minute || 0,
                matchInfo: `${homeNameFallback} ضد ${awayNameFallback}`
              });
            }
          }

          // Match ended popup status
          if (currentMatch.status === 'FINISHED' && prevMatch.status !== 'FINISHED') {
            const homeNameFallback = typeof currentMatch.homeTeam === 'string' ? currentMatch.homeTeam : (currentMatch.homeTeam?.name || '');
            const awayNameFallback = typeof currentMatch.awayTeam === 'string' ? currentMatch.awayTeam : (currentMatch.awayTeam?.name || '');
            triggerNotification({
              id: `fb-ended-${currentMatch.id}`,
              type: 'status_change',
              title: '🏁 نهاية ملحمة الليلة!',
              body: `انتهت المباراة رسمياً! بالتوفيق لكل الفرق والأنصار والمتابعين. النتيجة النهائية: \n[ ${homeNameFallback} ${currentMatch.homeScore} - ${currentMatch.awayScore} ${awayNameFallback} ]`,
              playerName: 'انتهت المباراة',
              teamName: '',
              minute: 90,
              matchInfo: `${homeNameFallback} ضد ${awayNameFallback}`
            });
          }
          if (currentMatch.status === 'LIVE' && prevMatch.status === 'UPCOMING') {
            triggerNotification({
              id: `fb-started-${currentMatch.id}`,
              type: 'status_change',
              title: '🔔 صافرة البداية ترتفع!',
              body: `انطلقت قمة الحماس والإثارة الكروية! تابع مجريات المباراة وكن أول العارفين.`,
              playerName: 'انطلاق اللقاء',
              teamName: '',
              minute: 0,
              matchInfo: `${currentMatch.homeTeam} ضد ${currentMatch.awayTeam}`
            });
          }
        }
      }
    });

    prevMatchesRef.current = safeMatches;
  }, [matches, notifiedMatches, triggerNotification]);

  return (
    <>
      {/* Floating System Overlay Alert HUD */}
      <div 
        className="fixed bottom-6 left-6 z-[9999] flex flex-col gap-3 max-w-sm w-[90%] md:w-full select-none" 
        style={{ direction: 'rtl' }}
      >
        <AnimatePresence mode="popLayout">
          {activeNotifications.map((notif) => (
            <motion.div
              key={notif.id}
              layout
              initial={{ opacity: 0, x: -30, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, x: -100 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className={`p-5 rounded-[2rem] border backdrop-blur-xl shadow-2xl relative overflow-hidden flex flex-col gap-2.5 transition-all
                ${notif.type === 'goal' ? 'bg-[#0f1d19]/96 border-emerald-500/30 shadow-emerald-950/20 text-emerald-300' : ''}
                ${notif.type === 'yellow_card' ? 'bg-[#1e1911]/96 border-yellow-500/30 shadow-yellow-950/20 text-yellow-300' : ''}
                ${notif.type === 'red_card' ? 'bg-[#1f1011]/96 border-red-500/30 shadow-red-950/20 text-red-300' : ''}
                ${notif.type === 'sub' ? 'bg-[#101b22]/96 border-sky-500/30 shadow-sky-950/20 text-sky-300' : ''}
                ${notif.type === 'status_change' ? 'bg-[#111827]/96 border-white/10 text-white' : ''}
              `}
            >
              {/* Pulse glowing backdrop */}
              <div className={`absolute -top-12 -left-12 w-28 h-28 rounded-full filter blur-2xl opacity-20 pointer-events-none
                ${notif.type === 'goal' ? 'bg-emerald-500' : ''}
                ${notif.type === 'yellow_card' ? 'bg-yellow-500' : ''}
                ${notif.type === 'red_card' ? 'bg-red-500' : ''}
                ${notif.type === 'sub' ? 'bg-sky-500' : ''}
              `} />

              {/* Banner Head Content */}
              <div className="flex items-start justify-between border-b border-white/5 pb-2 ml-1">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black relative
                    ${notif.type === 'goal' ? 'bg-emerald-500/15 border border-emerald-500/30' : ''}
                    ${notif.type === 'yellow_card' ? 'bg-yellow-500/15 border border-yellow-500/30' : ''}
                    ${notif.type === 'red_card' ? 'bg-red-500/15 border border-red-500/30' : ''}
                    ${notif.type === 'sub' ? 'bg-sky-500/15 border border-sky-500/30' : ''}
                    ${notif.type === 'status_change' ? 'bg-white/5 border border-white/10' : ''}
                  `}>
                    {notif.type === 'goal' && <Trophy size={16} className="text-emerald-400 animate-bounce" />}
                    {notif.type === 'yellow_card' && <div className="w-3.5 h-4.5 bg-yellow-400 rounded-[2px]" />}
                    {notif.type === 'red_card' && <div className="w-3.5 h-4.5 bg-red-500 rounded-[2px] animate-pulse" />}
                    {notif.type === 'sub' && <ArrowLeftRight size={16} className="text-sky-400" />}
                    {notif.type === 'status_change' && <Bell size={16} className="text-gray-300" />}
                  </div>

                  <div className="text-right">
                    <h4 className="text-xs font-black text-white">{notif.title}</h4>
                    <span className="text-[10px] text-gray-400 font-bold">{notif.matchInfo}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 leading-none">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md
                    ${notif.type === 'goal' ? 'bg-emerald-500/20 text-emerald-400' : ''}
                    ${notif.type === 'yellow_card' ? 'bg-yellow-500/20 text-yellow-400' : ''}
                    ${notif.type === 'red_card' ? 'bg-red-500/20 text-red-500' : ''}
                    ${notif.type === 'sub' ? 'bg-sky-500/20 text-sky-400' : ''}
                    ${notif.type === 'status_change' ? 'bg-white/10 text-gray-300' : ''}
                  `}>
                    +{notif.minute}' د
                  </span>

                  <button 
                    onClick={() => setActiveNotifications((prev) => prev.filter((n) => n.id !== notif.id))}
                    className="p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Main Banner Message & Dynamic Design */}
              <div className="space-y-2 text-right">
                <p className="text-[11px] font-bold text-gray-200 leading-relaxed leading-normal">{notif.body}</p>
                
                {/* Visual player card highlight display */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 text-[11px] font-black">
                  <span className="text-gray-400">{notif.teamName || 'صافرة 90'}</span>
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full
                      ${notif.type === 'goal' ? 'bg-emerald-400' : ''}
                      ${notif.type === 'yellow_card' ? 'bg-yellow-400' : ''}
                      ${notif.type === 'red_card' ? 'bg-red-400' : ''}
                      ${notif.type === 'sub' ? 'bg-sky-400' : ''}
                      ${notif.type === 'status_change' ? 'bg-white' : ''}
                    `} />
                    <span className="text-yellow-400 font-extrabold">{notif.playerName}</span>
                  </div>
                </div>
              </div>

              {/* Inline Controls (Quick settings directly on banner) */}
              <div className="flex items-center justify-end gap-3 mt-1.5 pt-2 border-t border-white/5 text-[9px] font-black text-gray-400">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="flex items-center gap-1 hover:text-white transition-all cursor-pointer"
                >
                  {isMuted ? (
                    <>
                      <VolumeX size={11} className="text-red-500" />
                      <span>إلغاء الكتم</span>
                    </>
                  ) : (
                    <>
                      <Volume2 size={11} className="text-emerald-500" />
                      <span>كتم الصوت</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setEnableVoice(!enableVoice)}
                  className="flex items-center gap-1 hover:text-white transition-all cursor-pointer"
                >
                  <Megaphone size={11} className={enableVoice ? 'text-primary' : 'text-gray-500'} />
                  <span>{enableVoice ? 'تفعيل المعلق' : 'كتم المعلق'}</span>
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </>
  );
}
