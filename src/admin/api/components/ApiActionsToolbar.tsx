import React from 'react';
import { RefreshCw, Plus, Zap, Database, RotateCw } from 'lucide-react';
import { ApiProvider } from '../types/api';

interface ApiActionsToolbarProps {
  onResetQuotas: () => void;
  onAddKey: (defaultValues: Partial<ApiProvider>) => void;
  onTestAll: () => void;
  onClearCache: () => void;
  onReload: () => void;
  actionLoading: string | null;
}

export const ApiActionsToolbar: React.FC<ApiActionsToolbarProps> = React.memo(({
  onResetQuotas,
  onAddKey,
  onTestAll,
  onClearCache,
  onReload,
  actionLoading
}) => {
  const handleAddNewKey = () => {
    onAddKey({
      name: '',
      key: '',
      provider: 'API-Football',
      quotaDaily: 100,
      quotaMonthly: 3000,
      usedToday: 0,
      usedMonth: 0,
      priority: 1,
      priorityType: 'primary',
      active: true,
      fallbackProvider: 'none',
      costPerCall: 0.0001,
      categories: ['matches', 'leagues', 'teams', 'players', 'news', 'predictions', 'live_stream', 'ai_analysis']
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3 self-end md:self-auto">
      <button
        onClick={onReload}
        disabled={!!actionLoading}
        title="إعادة تحميل البيانات"
        className="flex items-center justify-center p-2.5 bg-gray-900 border border-gray-800 text-gray-300 hover:text-white rounded-lg text-sm font-semibold transition cursor-pointer disabled:opacity-50"
      >
        <RotateCw className={`w-4 h-4 ${actionLoading === 'reload' ? 'animate-spin' : ''}`} />
      </button>

      <button
        onClick={onClearCache}
        disabled={!!actionLoading}
        className="flex items-center gap-2 bg-amber-600/10 border border-amber-500/20 text-amber-400 hover:text-amber-300 px-4 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Database className={`w-4 h-4 ${actionLoading === 'clear-cache' ? 'animate-bounce' : ''}`} />
        تنظيف الكاش
      </button>

      <button
        onClick={onTestAll}
        disabled={!!actionLoading}
        className="flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:text-blue-300 px-4 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Zap className={`w-4 h-4 ${actionLoading === 'test-all' ? 'animate-pulse' : ''}`} />
        فحص جودة الاتصال
      </button>

      <button
        onClick={onResetQuotas}
        disabled={!!actionLoading}
        className="flex items-center gap-2 bg-gray-900 border border-gray-800 text-gray-300 hover:text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RefreshCw className={`w-4 h-4 ${actionLoading === 'reset-quotas' ? 'animate-spin text-[#FF003C]' : ''}`} />
        تصفير الكوتا اليومية
      </button>

      <button
        onClick={handleAddNewKey}
        className="flex items-center gap-2 bg-[#FF003C] hover:bg-[#D00030] text-black px-5 py-2.5 rounded-lg text-sm font-bold transition shadow-lg shadow-[#FF003C]/15 cursor-pointer"
      >
        <Plus className="w-5 h-5" />
        إضافة مفتاح جديد
      </button>
    </div>
  );
});

ApiActionsToolbar.displayName = 'ApiActionsToolbar';
export default ApiActionsToolbar;
