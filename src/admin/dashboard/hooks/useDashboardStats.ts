import { useState, useCallback } from 'react';
import { dashboardService } from '../services/dashboardService';

export function useDashboardStats(showToast: (type: 'success' | 'error' | 'info', text: string) => void) {
  const [stats, setStats] = useState({ matches: 0, leagues: 0, teams: 0, channels: 0, users: 0, ads: 0 });
  const [liveMatches, setLiveMatches] = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [isRebuildingStats, setIsRebuildingStats] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      let counts = await dashboardService.fetchAggregatedStats();
      if (!counts) {
        counts = await dashboardService.fetchDirectCounts();
      }
      setStats(counts as any);

      try {
        const matches = await dashboardService.fetchLiveMatches();
        setLiveMatches(matches);
      } catch (err) {
        console.warn("Failed to fetch live matches", err);
      }
    } catch (err: any) {
      console.warn("Stats fetch failed", err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const handleRebuildCounters = async () => {
    setIsRebuildingStats(true);
    showToast('info', 'جاري مسح وحساب كافة مدخلات النظام وتحديث العدادات الموثوقة...');
    try {
      const counts = await dashboardService.rebuildSystemCounters();
      setStats(prev => ({ ...prev, ...counts }));
      showToast('success', 'تم إعادة بناء ومزامنة كاونترات النظام بنجاح وتوثيق العملية!');
      await fetchStats();
    } catch (err: any) {
      console.error(err);
      showToast('error', `فشلت مزامنة العدادات: ${err?.message || String(err)}`);
    } finally {
      setIsRebuildingStats(false);
    }
  };

  const handleFetchAiInsights = async () => {
    setLoadingAi(true);
    showToast('info', 'جاري التواصل مع مستشار الذكاء الاصطناعي لتقديم النصائح الاستراتيجية...');
    try {
      const data = await dashboardService.fetchAiInsights(stats);
      setAiInsights(data);
      showToast('success', 'تم توليد الخطة الاستشارية الذكية استناداً لمؤشرات الأداء الحالية ✨');
    } catch (err: any) {
      console.error(err);
      showToast('error', 'أخفق التواصل بالذكاء الاصطناعي. تم تنشيط محاكي المخرجات التحريرية لتفادي التوقف.');
    } finally {
      setLoadingAi(false);
    }
  };

  return {
    stats,
    liveMatches,
    aiInsights,
    loadingAi,
    isRebuildingStats,
    loadingStats,
    fetchStats,
    handleRebuildCounters,
    handleFetchAiInsights
  };
}
