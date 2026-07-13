import { useState, useCallback, useEffect } from 'react';
import { DashboardStats, ApiProvider, ApiRouting } from '../types/api';
import { apiManagementService } from '../services/apiManagementService';

export function useApiConnections() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadStats = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await apiManagementService.getStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'خطأ أثناء جلب إحصائيات النظام');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const showNotification = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    if (type === 'success') {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setError(msg);
      setTimeout(() => setError(null), 5000);
    }
  }, []);

  const toggleActive = useCallback(async (provider: ApiProvider) => {
    setActionLoading(`toggle-${provider.id}`);
    try {
      await apiManagementService.saveProvider({
        ...provider,
        active: !provider.active
      });
      showNotification(`تم ${!provider.active ? 'تفعيل' : 'إلغاء تفعيل'} المفتاح بنجاح`);
      await loadStats(true);
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  }, [loadStats, showNotification]);

  const deleteProvider = useCallback(async (id: string) => {
    setActionLoading(`delete-${id}`);
    try {
      await apiManagementService.deleteProvider(id);
      showNotification('تم حذف المفتاح نهائياً بنجاح');
      await loadStats(true);
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  }, [loadStats, showNotification]);

  const saveProvider = useCallback(async (provider: Partial<ApiProvider>) => {
    setActionLoading('save-provider');
    try {
      await apiManagementService.saveProvider(provider);
      showNotification('تم حفظ بيانات مزود الخدمة ومزامنتها بنجاح');
      await loadStats(true);
      return true;
    } catch (err: any) {
      showNotification(err.message, 'error');
      return false;
    } finally {
      setActionLoading(null);
    }
  }, [loadStats, showNotification]);

  const saveRouting = useCallback(async (category: keyof ApiRouting, provider: string) => {
    if (!stats) return;
    const newRouting = { ...stats.routing, [category]: provider };
    setActionLoading(`route-${category}`);
    try {
      await apiManagementService.saveRouting(newRouting);
      showNotification(`تم حفظ توجيه قسم "${category}" إلى ${provider} بنجاح`);
      await loadStats(true);
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  }, [stats, loadStats, showNotification]);

  const resetQuotas = useCallback(async () => {
    setActionLoading('reset-quotas');
    try {
      await apiManagementService.resetQuotas();
      showNotification('تم تصفير عدادات الاستهلاك وإعادة ضبط الحالة للنشطين بنجاح');
      await loadStats(true);
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  }, [loadStats, showNotification]);

  const testKey = useCallback(async (provider: ApiProvider) => {
    setActionLoading(`test-${provider.id}`);
    try {
      const data = await apiManagementService.testKey(provider.provider, provider.key);
      if (data.success) {
        showNotification(`فحص الاتصال ناجح لمفتاح ${provider.name} (زمن الاستجابة: ${data.latency}ms)`);
      } else {
        showNotification(`فشل فحص الاتصال لمفتاح ${provider.name}: ${data.message}`, 'error');
      }
      await loadStats(true);
      return data;
    } catch (err: any) {
      showNotification(`فشل بدء فحص الاتصال: ${err.message}`, 'error');
      return { success: false, message: err.message };
    } finally {
      setActionLoading(null);
    }
  }, [loadStats, showNotification]);

  const testAllActiveKeys = useCallback(async () => {
    if (!stats?.providers) return;
    setActionLoading('test-all');
    let successCount = 0;
    const activeProviders = stats.providers.filter(p => p.active);
    
    for (const provider of activeProviders) {
      try {
        const data = await apiManagementService.testKey(provider.provider, provider.key);
        if (data.success) successCount++;
      } catch (err) {
        console.error(`[Auto-Test] Failed for ${provider.name}:`, err);
      }
    }
    
    showNotification(`اكتمل فحص جودة الاتصال التلقائي: ${successCount} من ${activeProviders.length} مفاتيح تعمل بكفاءة`);
    await loadStats(true);
    setActionLoading(null);
  }, [stats, loadStats, showNotification]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    actionLoading,
    successMsg,
    loadStats,
    toggleActive,
    deleteProvider,
    saveProvider,
    saveRouting,
    resetQuotas,
    testKey,
    testAllActiveKeys,
    showNotification
  };
}
