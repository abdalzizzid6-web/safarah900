import { useState, useEffect, useCallback } from 'react';
import { RssProvider } from '../types';
import { rssService } from '../services/rssService';

export function useRssProviders() {
  const [providers, setProviders] = useState<RssProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await rssService.getProviders();
      setProviders(data);
    } catch (err: any) {
      setError(err.message || 'فشل تحميل مزودي RSS');
    } finally {
      setLoading(false);
    }
  }, []);

  const saveProvider = async (provider: Partial<RssProvider>) => {
    setError(null);
    try {
      const saved = await rssService.saveProvider(provider);
      setProviders((prev) => {
        const index = prev.findIndex((p) => p.id === saved.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = saved;
          return updated;
        } else {
          return [...prev, saved];
        }
      });
      return saved;
    } catch (err: any) {
      setError(err.message || 'فشل حفظ مزود الخدمة');
      throw err;
    }
  };

  const deleteProvider = async (id: string) => {
    setError(null);
    try {
      await rssService.deleteProvider(id);
      setProviders((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      setError(err.message || 'فشل حذف مزود الخدمة');
      throw err;
    }
  };

  const toggleProvider = async (id: string) => {
    try {
      const newEnabled = await rssService.toggleProvider(id);
      setProviders((prev) =>
        prev.map((p) => (p.id === id ? { ...p, enabled: newEnabled } : p))
      );
    } catch (err: any) {
      setError(err.message || 'فشل تغيير حالة تفعيل مزود الخدمة');
    }
  };

  const syncProvider = async (id: string) => {
    setSyncingId(id);
    setError(null);
    try {
      const stats = await rssService.syncSingleProvider(id);
      await fetchProviders(); // reload to get new lastSync / status
      return stats;
    } catch (err: any) {
      setError(`فشل مزامنة المصدر: ${err.message}`);
      throw err;
    } finally {
      setSyncingId(null);
    }
  };

  const syncAll = async () => {
    setSyncingAll(true);
    setError(null);
    try {
      const stats = await rssService.syncAllProviders();
      await fetchProviders();
      return stats;
    } catch (err: any) {
      setError(`فشل مزامنة كافة المصادر: ${err.message}`);
      throw err;
    } finally {
      setSyncingAll(false);
    }
  };

  const seed = async () => {
    setLoading(true);
    try {
      await rssService.seedProviders();
      await fetchProviders();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  return {
    providers,
    loading,
    error,
    syncingId,
    syncingAll,
    fetchProviders,
    saveProvider,
    deleteProvider,
    toggleProvider,
    syncProvider,
    syncAll,
    seed
  };
}
