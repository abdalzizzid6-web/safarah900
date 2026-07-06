import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth, registerForPushNotifications } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { FAMOUS_TEAMS } from '../api/apiClient';
import { safeJSONParse } from '../lib/json';

export type NotificationType = 'goal' | 'result' | 'card' | 'status_change';

export interface NotificationLog {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  referenceId?: string; // e.g. matchId
  metadata?: {
    playerName?: string;
    teamName?: string;
    minute?: number;
    homeScore?: number;
    awayScore?: number;
    category?: string;
  };
}

export interface SubscriptionSettings {
  goals: boolean;
  results: boolean;
  cardsAndSubs: boolean;
  audioEffects: boolean;
  arabicVoiceCommentator: boolean;
  onlyFavoriteTeams: boolean;
  smartLeagueAlerts: boolean;
  kickoff: boolean;
}

interface NotificationContextType {
  notifications: NotificationLog[];
  subscriptions: SubscriptionSettings;
  unreadCount: number;
  favoriteTeamIds: number[];
  favoriteLeagues: string[];
  notifiedMatches: string[];
  toggleSubscription: (key: keyof SubscriptionSettings) => void;
  toggleFavoriteTeam: (teamId: number) => void;
  toggleFavoriteLeague: (leagueName: string) => void;
  toggleMatchNotification: (matchId: string) => void;
  addNotificationLog: (
    type: NotificationType,
    title: string,
    body: string,
    referenceId?: string,
    metadata?: any
  ) => void;
  markAllAsRead: () => void;
  clearAllNotifications: () => void;
  playNotificationSound: (type: 'goal' | 'result' | 'card') => void;
  triggerArabicSpeech: (text: string) => void;
}

const defaultSubscriptions: SubscriptionSettings = {
  goals: true,
  results: true,
  cardsAndSubs: true,
  audioEffects: true,
  arabicVoiceCommentator: true,
  onlyFavoriteTeams: false,
  smartLeagueAlerts: true,
  kickoff: true,
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const TEAM_LEAGUE_MAP: Record<number, string> = {
  2939: 'الدوري السعودي للمحترفين', // Al Hilal
  2940: 'الدوري السعودي للمحترفين', // Al Nassr
  2931: 'الدوري السعودي للمحترفين', // Al Ittihad
  2930: 'الدوري السعودي للمحترفين', // Al Ahli
  541: 'الدوري الإسباني - لاليغا',    // Real Madrid
  529: 'الدوري الإسباني - لاليغا',    // Barcelona
  50: 'الدوري الإنجليزي الممتاز',   // Man City
  40: 'الدوري الإنجليزي الممتاز',   // Liverpool
  42: 'الدوري الإنجليزي الممتاز',   // Arsenal
  157: 'بايرن ميونخ',                // Bayern
  85: 'الدوري الفرنسي - الدرجة 1'    // PSG
};

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [user] = useAuthState(auth);
  
  // Load preferences from localStorage
  const [subscriptions, setSubscriptions] = useState<SubscriptionSettings>(() => {
    const saved = localStorage.getItem('Safara 90_notification_preferences');
    return safeJSONParse(saved, defaultSubscriptions);
  });

  // Load favorite team IDs from localStorage
  const [favoriteTeamIds, setFavoriteTeamIds] = useState<number[]>(() => {
    const saved = localStorage.getItem('Safara 90_favorite_team_ids');
    return safeJSONParse(saved, [2939, 2940]); // Initialize with Al Hilal & Al Nassr as default favorites!
  });

  const [favoriteLeagues, setFavoriteLeagues] = useState<string[]>([]);
  const [notifiedMatches, setNotifiedMatches] = useState<string[]>([]);

  // history logs from localStorage
  const [notifications, setNotifications] = useState<NotificationLog[]>(() => {
    const saved = localStorage.getItem('Safara 90_notification_logs');
    return safeJSONParse(saved, []);
  });

  const sessionStartTimeRef = useRef<number>(Date.now());

  // Sync favorites from Firestore if authenticated
  useEffect(() => {
    if (!user) {
      setFavoriteLeagues([]);
      setNotifiedMatches([]);
      return;
    }

    // Register push notifications
    registerForPushNotifications(user.uid);

    const docRef = doc(db, 'users', user.uid);

    const fetchPreferences = async () => {
      try {
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          setFavoriteLeagues(data.favoriteLeagues || []);
          setNotifiedMatches(data.notifiedMatches || []);
        }
      } catch (error: any) {
        if (error.code === 'resource-exhausted') {
          console.warn("Firestore Quota Exceeded in NotificationProvider user listener.");
        } else {
          console.error("Error getting user doc in NotificationProvider:", error);
        }
      }
    };

    fetchPreferences();
  }, [user]);

  const toggleFavoriteLeague = async (leagueName: string) => {
    if (!user) return;
    const current = Array.isArray(favoriteLeagues) ? favoriteLeagues : [];
    const newList = current.includes(leagueName)
      ? current.filter(l => l !== leagueName)
      : [...current, leagueName];
    
    try {
      await updateDoc(doc(db, 'users', user.uid), { favoriteLeagues: newList });
    } catch (e) {
      console.error("Error toggling favorite league:", e);
    }
  };

  const toggleMatchNotification = async (matchId: string) => {
    if (!user) return;
    const current = Array.isArray(notifiedMatches) ? notifiedMatches : [];
    const newList = current.includes(matchId)
      ? current.filter(id => id !== matchId)
      : [...current, matchId];
    
    try {
      await updateDoc(doc(db, 'users', user.uid), { notifiedMatches: newList });
    } catch (e) {
      console.error("Error toggling match notification:", e);
    }
  };

  // Sync preferences to localStorage
  const savePreferences = (updated: SubscriptionSettings) => {
    setSubscriptions(updated);
    localStorage.setItem('Safara 90_notification_preferences', JSON.stringify(updated));
    
    // If smart alerts enabled, perform an immediate sync check
    if (updated.smartLeagueAlerts) {
      syncSmartLeagues();
    }
  };

  const syncSmartLeagues = useCallback(async () => {
    if (!user || !subscriptions.smartLeagueAlerts) return;
    
    const leaguesToSync = favoriteTeamIds
      .map(id => TEAM_LEAGUE_MAP[id])
      .filter((l): l is string => Boolean(l));
    
    if (leaguesToSync.length === 0) return;

    const currentLeagues = Array.isArray(favoriteLeagues) ? favoriteLeagues : [];
    const missingLeagues = leaguesToSync.filter(l => !currentLeagues.includes(l));
    
    if (missingLeagues.length > 0) {
      const newList = [...new Set([...currentLeagues, ...missingLeagues])];
      try {
        await updateDoc(doc(db, 'users', user.uid), { favoriteLeagues: newList });
        console.log(`[SmartSync] Synchronized ${missingLeagues.length} leagues across user profile.`);
      } catch (e) {
        console.warn("Smart sync failed to save to Firestore:", e);
      }
    }
  }, [user, subscriptions.smartLeagueAlerts, favoriteTeamIds, favoriteLeagues]);

  useEffect(() => {
    if (subscriptions.smartLeagueAlerts) {
      syncSmartLeagues();
    }
  }, [favoriteTeamIds, subscriptions.smartLeagueAlerts]);

  // Sync favorite team IDs to localStorage
  useEffect(() => {
    localStorage.setItem('Safara 90_favorite_team_ids', JSON.stringify(favoriteTeamIds));
  }, [favoriteTeamIds]);

  // Sync notifications to localStorage
  useEffect(() => {
    localStorage.setItem('Safara 90_notification_logs', JSON.stringify(notifications));
  }, [notifications]);

  const toggleSubscription = (key: keyof SubscriptionSettings) => {
    const updated = { ...subscriptions, [key]: !subscriptions[key] };
    savePreferences(updated);
  };

  const toggleFavoriteTeam = (teamId: number) => {
    setFavoriteTeamIds((prev) => {
      const current = Array.isArray(prev) ? prev : [];
      return current.includes(teamId) ? current.filter((id) => id !== teamId) : [...current, teamId];
    });
  };

  // Synthesize custom sound effects on-demand
  const playNotificationSound = useCallback((type: 'goal' | 'result' | 'card') => {
    if (!subscriptions.audioEffects) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const now = ctx.currentTime;

      if (type === 'goal') {
        // Goal: Excited crowd whistle and glorious fanfare chords
        // Whistle blows
        for (let whistle = 0; whistle < 2; whistle++) {
          const start = now + whistle * 0.25;
          const duration = 0.15;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(900, start);
          osc.frequency.exponentialRampToValueAtTime(1400, start + duration);
          
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
          gain.gain.setValueAtTime(0.2, start + duration - 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + duration);
        }

        // Fanfare chord: C5 -> E5 -> G5 -> C6
        const chords = [523.25, 659.25, 783.99, 1046.50];
        chords.forEach((freq, idx) => {
          const start = now + 0.4 + idx * 0.07;
          const duration = 1.0;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);
          
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(0.15, start + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + duration);
        });
      } else if (type === 'result') {
        // Result: Triple long Referee Final Whistle blows signifying match end
        const whistles = [
          { delay: 0, len: 0.35 },
          { delay: 0.5, len: 0.35 },
          { delay: 1.0, len: 0.8 },
        ];
        whistles.forEach((w) => {
          const start = now + w.delay;
          const duration = w.len;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(800, start);
          osc.frequency.linearRampToValueAtTime(750, start + duration);
          
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(0.25, start + 0.03);
          gain.gain.setValueAtTime(0.25, start + duration - 0.05);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + duration);
        });
      } else if (type === 'card') {
        // Warning Buzzer for cards
        const duration = 0.3;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(380, now);
        osc.frequency.linearRampToValueAtTime(250, now + duration);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
      }
    } catch (e) {
      console.warn("Sound synthesis blocked or failed:", e);
    }
  }, [subscriptions.audioEffects]);

  // Excited commentator Arabic Text to Speech
  const triggerArabicSpeech = useCallback((text: string) => {
    if (!subscriptions.arabicVoiceCommentator || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar';
      utterance.rate = 1.05;
      utterance.pitch = 1.1;
      
      const voices = window.speechSynthesis.getVoices();
      const arVoice = voices.find(v => v.lang.startsWith('ar') || v.lang.includes('ARA'));
      if (arVoice) {
        utterance.voice = arVoice;
      }
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Arabic speech synthesis failed:", e);
    }
  }, [subscriptions.arabicVoiceCommentator]);

  // Add notification to persistent list
  const addNotificationLog = useCallback((
    type: NotificationType,
    title: string,
    body: string,
    referenceId?: string,
    metadata?: any
  ) => {
    // Check user subscriptions settings before queuing/playing
    if (type === 'goal' && !subscriptions.goals) return;
    if (type === 'result' && !subscriptions.results) return;
    if (type === 'status_change' && !subscriptions.kickoff && title.includes('بداية')) return;
    if ((type === 'card' || type === 'status_change') && !subscriptions.cardsAndSubs && !title.includes('بداية')) return;

    // Filter goals to favorite teams only if enabled
    if (type === 'goal' && subscriptions.onlyFavoriteTeams && metadata?.teamName) {
      const selectedTeamNames = FAMOUS_TEAMS.filter((t) => favoriteTeamIds.includes(t.id)).map((t) => t.name.toLowerCase());
      const eventTeamLower = String(metadata.teamName).toLowerCase();
      const isFavorite = selectedTeamNames.some((name) => eventTeamLower.includes(name) || name.includes(eventTeamLower));
      if (!isFavorite) {
        console.log(`Skipping goal notification since team "${metadata.teamName}" is not on favorites.`);
        return; // Filtered out!
      }
    }

    const newLog: NotificationLog = {
      id: `${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type,
      title,
      body,
      timestamp: new Date().toISOString(),
      read: false,
      referenceId,
      metadata,
    };

    setNotifications((prev) => {
      // Avoid duplicate logs of standard same ref matches (within a small elapsed window)
      if (prev.some((n) => n.referenceId === referenceId && n.title === title && n.type === type)) {
        return prev;
      }
      // Keep up to 50 logs
      const trimmed = [newLog, ...prev];
      return trimmed.slice(0, 50);
    });

    // Play physical sound effects
    if (type === 'goal') {
      playNotificationSound('goal');
    } else if (type === 'result') {
      playNotificationSound('result');
    } else if (type === 'card') {
      playNotificationSound('card');
    }

  }, [subscriptions, favoriteTeamIds, playNotificationSound]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        subscriptions,
        unreadCount,
        favoriteTeamIds,
        favoriteLeagues,
        notifiedMatches,
        toggleSubscription,
        toggleFavoriteTeam,
        toggleFavoriteLeague,
        toggleMatchNotification,
        addNotificationLog,
        markAllAsRead,
        clearAllNotifications,
        playNotificationSound,
        triggerArabicSpeech,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
