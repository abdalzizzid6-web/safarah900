import { serverTimestamp } from 'firebase/firestore';
import * as analyticsRepository from '../features/analytics/repositories/analyticsRepository';

export type AnalyticsEvent = 
  | 'page_view'
  | 'login'
  | 'signup'
  | 'match_view'
  | 'share_match'
  | 'error_boundary_catch';

// Session tracking
let currentSessionId = sessionStorage.getItem('safra_session_id');
if (!currentSessionId) {
  currentSessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  sessionStorage.setItem('safra_session_id', currentSessionId);
}

// User tracking
let currentUserId = localStorage.getItem('safra_user_id');
if (!currentUserId) {
  currentUserId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  localStorage.setItem('safra_user_id', currentUserId);
}

// Check if we've already tracked this user today to save Firestore reads
const checkDailyTracking = () => {
  const dateStr = new Date().toISOString().split('T')[0];
  const lastTracked = localStorage.getItem(`safra_last_tracked_${dateStr}`);
  if (lastTracked) return true;
  localStorage.setItem(`safra_last_tracked_${dateStr}`, 'true');
  return false;
};

const parseUserAgent = (userAgent: string) => {
  const ua = userAgent.toLowerCase();
  
  // OS
  let os = 'Unknown OS';
  if (ua.includes('win')) os = 'Windows';
  else if (ua.includes('mac')) os = 'Mac';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iPhone';
  else if (ua.includes('cros')) os = 'Chrome OS';

  // Device type
  let device = 'Desktop';
  if (ua.includes('mobi') || ua.includes('android') || ua.includes('iphone')) device = 'Mobile';
  if (ua.includes('tablet') || ua.includes('ipad')) device = 'Tablet';

  return { os, device };
};

const getSource = (referrer: string) => {
  if (!referrer) return 'مباشر (Direct)';
  const lowerRef = referrer.toLowerCase();
  if (lowerRef.includes('google')) return 'بحث Google';
  if (lowerRef.includes('facebook') || lowerRef.includes('fb.com')) return 'Facebook';
  if (lowerRef.includes('x.com') || lowerRef.includes('twitter')) return 'X (Twitter)';
  if (lowerRef.includes('t.me') || lowerRef.includes('telegram')) return 'Telegram';
  if (lowerRef.includes('whatsapp')) return 'WhatsApp';
  return 'روابط خارجية';
};

export const pingPresence = async () => {
  try {
    const isLocal = window.location.hostname === 'localhost';
    if (isLocal) return;

    await analyticsRepository.updatePresence(currentSessionId as string, {
      userId: currentUserId,
      url: window.location.href,
      device: parseUserAgent(navigator.userAgent).device
    });
  } catch (err) {}
};

// Start heartbeats
if (typeof window !== 'undefined') {
  pingPresence();
}

let eventCounter = 0;
const generateUniqueEventId = () => {
  eventCounter++;
  return `evt_${Date.now()}_${eventCounter}_${Math.random().toString(36).substring(2, 6)}`;
};

export const logEvent = async (eventName: AnalyticsEvent, params?: Record<string, any>) => {
  try {
    const isLocal = window.location.hostname === 'localhost';
    if (isLocal) {
        console.log(`[Analytics] ${eventName}`, params);
    }
    
    // Log the event record
    const customId = generateUniqueEventId();
    const uaParsing = parseUserAgent(navigator.userAgent);
    const source = getSource(document.referrer);

    const eventPayload = {
      eventName,
      params: params || {},
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent,
      os: uaParsing.os,
      device: uaParsing.device,
      source,
      url: window.location.href,
      path: window.location.pathname,
      sessionId: currentSessionId,
      userId: currentUserId
    };

    await analyticsRepository.logAnalyticsEvent(customId, eventPayload);
    
    // Increment daily aggregations - only if not already tracked today to save reads
    const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const alreadyTrackedToday = checkDailyTracking();
    
    if (!alreadyTrackedToday || eventName === 'signup' || eventName === 'login') {
      await analyticsRepository.updateDailyAggregation(dateStr, {
        currentUserId: currentUserId as string,
        currentSessionId: currentSessionId as string,
        device: uaParsing.device,
        os: uaParsing.os,
        source
      });
    }

  } catch (error: any) {
    // Fail silently when database is quota-limited or offline to prevent log spam
    const isQuota = error?.message?.toLowerCase().includes('quota') || 
                    error?.message?.toLowerCase().includes('exhausted') || 
                    error?.code === 'resource-exhausted';
    if (isQuota) {
      // Just log a silent warning once or ignore
    } else {
      console.warn('Analytics event logging bypassed:', error?.message || error);
    }
  }
};

export const exportAnalyticsData = (data: any[], filename: string = 'analytics_export', format: 'csv' | 'json' = 'csv') => {
  try {
    if (!data || data.length === 0) {
      console.warn('No data to export');
      return;
    }

    if (format === 'json') {
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }

    // CSV Export
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          let cellData = row[header];
          // Handle objects and arrays
          if (typeof cellData === 'object' && cellData !== null) {
            cellData = JSON.stringify(cellData);
          }
          // Escape quotes and wrap in quotes if contains comma
          const cellString = String(cellData ?? '');
          if (cellString.includes(',') || cellString.includes('"') || cellString.includes('\n')) {
            return `"${cellString.replace(/"/g, '""')}"`;
          }
          return cellString;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // Added BOM for Excel UTF-8 support
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export data', error);
  }
};
