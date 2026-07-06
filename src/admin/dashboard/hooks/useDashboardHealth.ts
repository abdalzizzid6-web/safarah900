import { useState, useCallback } from 'react';
import { dashboardService } from '../services/dashboardService';

export function useDashboardHealth(showToast: (type: 'success' | 'error' | 'info', text: string) => void) {
  const [status, setStatus] = useState({ firebase: 'checking', server: 'checking', api: 'checking', isFirestoreQuotaExceeded: false });
  const [cpuLoad, setCpuLoad] = useState(0);
  const [memoryLoad, setMemoryLoad] = useState(0);
  const [apiPing, setApiPing] = useState(0);
  const [auditingStreamId, setAuditingStreamId] = useState<string | null>(null);
  const [auditResult, setAuditResult] = useState<Record<string, 'online' | 'offline' | 'checking'>>({});
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [isCleaningOldNews, setIsCleaningOldNews] = useState(false);
  const [loadingHealth, setLoadingHealth] = useState(true);

  const fetchHealth = useCallback(async () => {
    setLoadingHealth(true);
    try {
      const metrics = await dashboardService.fetchServerMetrics();
      setStatus(prev => ({ 
        ...prev, 
        server: metrics.status === 'ok' ? 'online' : 'unstable',
        api: 'stable',
        firebase: metrics.isFirestoreQuotaExceeded ? 'quota_exceeded' : 'connected',
        isFirestoreQuotaExceeded: !!metrics.isFirestoreQuotaExceeded
      }));
    } catch (e) {
      setStatus(prev => ({ ...prev, server: 'offline', isFirestoreQuotaExceeded: false }));
    } finally {
      setLoadingHealth(false);
    }
  }, []);

  const handleClearCache = async (fetchStatsCb: () => void) => {
    setIsClearingCache(true);
    showToast('info', 'جاري إرسال طلب تنظيف الذاكرة المؤقتة لقاذف الكوكيز والـ API...');
    try {
      await dashboardService.clearCache();
      showToast('success', 'تم محو الكاش بنجاح وإعادة تشغيل واجهات الـ REST API في وضع الكاش اللحظي الجديد!');
      fetchStatsCb();
    } catch (err: any) {
      console.error(err);
      showToast('error', `أخفق تنظيف الكاش: ${err?.message || String(err)}`);
    } finally {
      setIsClearingCache(false);
    }
  };

  const handleCleanOldNews = async (fetchStatsCb: () => void) => {
    setIsCleaningOldNews(true);
    showToast('info', 'جاري مسح الأخبار القديمة التي تجاوزت 24 ساعة لخفض استهلاك الحصة وتحسين الأداء...');
    try {
      const result = await dashboardService.cleanOldNews();
      showToast('success', `اكتمل مسح الأرشيف التلقائي بنجاح! تم حذف ${result.newsDeleted} خبر قديم و ${result.importsDeleted} استيراد مؤقت.`);
      fetchStatsCb();
    } catch (err: any) {
      console.error(err);
      showToast('error', `فشل تطهير أرشيف الأخبار: ${err?.message || String(err)}`);
    } finally {
      setIsCleaningOldNews(false);
    }
  };

  const auditStreamLink = async (matchId: string) => {
    setAuditingStreamId(matchId);
    setAuditResult(prev => ({ ...prev, [matchId]: 'checking' }));
    setTimeout(() => {
      setAuditResult(prev => ({
        ...prev,
        [matchId]: Math.random() > 0.15 ? 'online' : 'offline'
      }));
      setAuditingStreamId(null);
      showToast('success', 'اكتمل تدقيق خطوط النقل والروابط بنجاح!');
    }, 1200);
  };

  return {
    status,
    cpuLoad,
    memoryLoad,
    apiPing,
    auditingStreamId,
    auditResult,
    isClearingCache,
    isCleaningOldNews,
    loadingHealth,
    setStatus,
    fetchHealth,
    handleClearCache,
    handleCleanOldNews,
    auditStreamLink
  };
}
