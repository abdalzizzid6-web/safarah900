import { db, auth } from '@/firebase';
import { collection, getDocs, query, limit, orderBy, doc, getDoc, getCountFromServer, setDoc } from 'firebase/firestore';

export const dashboardService = {
  async fetchAggregatedStats() {
    const statsDoc = await getDoc(doc(db, 'system_stats', 'global'));
    if (statsDoc.exists()) {
      return statsDoc.data();
    }
    return null;
  },

  async fetchDirectCounts() {
    const [matchesCount, usersCount, leaguesCount, teamsCount, channelsCount] = await Promise.all([
      getCountFromServer(collection(db, 'matches')),
      getCountFromServer(collection(db, 'users')),
      getCountFromServer(collection(db, 'leagues')),
      getCountFromServer(collection(db, 'teams')),
      getCountFromServer(collection(db, 'channels'))
    ]);

    return {
      matches: matchesCount.data().count,
      users: usersCount.data().count,
      leagues: leaguesCount.data().count,
      teams: teamsCount.data().count,
      channels: channelsCount.data().count,
      ads: 0
    };
  },

  async fetchLiveMatches() {
    const matchesSnap = await getDocs(query(collection(db, 'matches'), orderBy('time', 'desc'), limit(15)));
    return matchesSnap.docs.map(doc => ({
      id: doc.id,
      homeName: doc.data().homeName,
      awayName: doc.data().awayName,
      hasStreams: doc.data().streamingLinks && doc.data().streamingLinks.length > 0,
      streamsCount: doc.data().streamingLinks ? doc.data().streamingLinks.length : 0,
      time: doc.data().time,
      status: doc.data().status
    }));
  },

  async fetchRecentActivityLogs() {
    const logsSnap = await getDocs(query(collection(db, 'activity_logs'), orderBy('timestamp', 'desc'), limit(15)));
    return logsSnap.docs.map(doc => ({
      id: doc.id,
      action: doc.data().message,
      user: doc.data().userName || 'النظام',
      time: new Date(doc.data().timestamp?.toDate() || Date.now()).toLocaleString('ar-EG'),
      type: doc.data().type || 'تنبيه',
      severity: doc.data().severity || 'info',
      color: doc.data().severity === 'success' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' : 
             doc.data().severity === 'error' ? 'text-red-400 border-red-500/20 bg-red-500/10' : 
             doc.data().severity === 'warning' ? 'text-amber-400 border-amber-500/20 bg-amber-500/10' :
             'text-blue-400 border-blue-500/20 bg-blue-500/10'
    }));
  },

  async fetchServerMetrics() {
    const res = await fetch('/api/admin/metrics');
    return res.json();
  },

  async fetchTrafficTrends() {
    const q = query(collection(db, 'analytics_daily'), orderBy('date', 'desc'), limit(14));
    const snap = await getDocs(q);
    const trends: any[] = [];
    snap.forEach(doc => {
      const d = doc.data();
      trends.unshift({
        date: d.date.split('-').slice(1).join('/'),
        count: d.pageViews || 0
      });
    });
    return trends;
  },

  async fetchSecurityAudits() {
    await auth.authStateReady();
    const token = await auth.currentUser?.getIdToken(true);
    const res = await fetch('/api/admin/security/audits', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error('Failed to fetch security audits');
    const audits = await res.json();
    return Array.isArray(audits) ? audits.slice(0, 10) : [];
  },

  async rebuildSystemCounters() {
    const counts = await this.fetchDirectCounts();
    const payload = {
      ...counts,
      updatedAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'system_stats', 'global'), payload, { merge: true });
    
    // Log action
    const actRef = doc(collection(db, 'activity_logs'));
    await setDoc(actRef, {
      message: "تم حفظ وإعادة مطابقة العدادات ومزامنة قاعدة البيانات بنجاح",
      userName: auth.currentUser?.displayName || 'المسؤول',
      timestamp: new Date(),
      type: "صيانة",
      severity: "success"
    });

    return counts;
  },

  async clearCache() {
    await auth.authStateReady();
    const token = await auth.currentUser?.getIdToken(true);
    const response = await fetch('/api/admin/clear-cache', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error("فشل خوادم الكاش في تلبية طلب التنظيف.");
  },

  async cleanOldNews() {
    await auth.authStateReady();
    const token = await auth.currentUser?.getIdToken(true);
    const response = await fetch('/api/admin/clean-old-news', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error("فشل خادم معالجة الأخبار في إتمام التنظيف التلقائي.");
    return response.json();
  },

  async fetchAiInsights(stats: any) {
    await auth.authStateReady();
    const token = await auth.currentUser?.getIdToken(true);
    const response = await fetch('/api/admin/ai-insights', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ stats })
    });
    if (!response.ok) throw new Error("فشلت واجهة الذكاء الاصطناعي في الاستجابة حالياً.");
    return response.json();
  }
};
