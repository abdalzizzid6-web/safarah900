import React, { useState, useCallback } from 'react';
import { useApiConnections } from './hooks/useApiConnections';
import { useApiHealth } from './hooks/useApiHealth';
import { useApiStatistics } from './hooks/useApiStatistics';
import { useApiLogs } from './hooks/useApiLogs';
import { ApiProvider } from './types/api';

import ApiHeader from './components/ApiHeader';
import ApiActionsToolbar from './components/ApiActionsToolbar';
import ApiStatusCards from './components/ApiStatusCards';
import ApiStatisticsWidget from './components/ApiStatisticsWidget';
import ApiHealthWidget from './components/ApiHealthWidget';
import ApiSettingsWidget from './components/ApiSettingsWidget';
import ApiKeysWidget from './components/ApiKeysWidget';
import ApiLogsWidget from './components/ApiLogsWidget';
import ConnectionDetailsDialog from './components/ConnectionDetailsDialog';
import { DollarSign } from 'lucide-react';

export const ApiManagementPage: React.FC = () => {
  const {
    stats,
    loading,
    error,
    actionLoading,
    successMsg,
    toggleActive,
    deleteProvider,
    saveProvider,
    saveRouting,
    resetQuotas,
    testKey,
    testAllActiveKeys,
    clearCache,
    loadStats,
  } = useApiConnections();

  const health = useApiHealth(stats);
  const statistics = useApiStatistics(stats);
  const { logs } = useApiLogs(stats);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Partial<ApiProvider> | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; latency?: number; message?: string } | null>(null);

  // Automatic periodic check for quality assurance (Every 5 minutes)
  React.useEffect(() => {
    const interval = setInterval(() => {
      console.log("[API Manager] Triggering background latency quality check...");
      testAllActiveKeys();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [testAllActiveKeys]);

  const handleAddKey = useCallback((defaultValues: Partial<ApiProvider>) => {
    setEditingProvider(defaultValues);
    setIsFormOpen(true);
  }, []);

  const handleEditProvider = useCallback((provider: ApiProvider) => {
    setEditingProvider({ ...provider });
    setIsFormOpen(true);
  }, []);

  const handleFormChange = useCallback((updated: Partial<ApiProvider>) => {
    setEditingProvider(updated);
  }, []);

  const handleFormSave = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProvider) return;
    const success = await saveProvider(editingProvider);
    if (success) {
      setIsFormOpen(false);
      setEditingProvider(null);
    }
  }, [editingProvider, saveProvider]);

  const handleTestConnection = useCallback(async (provider: ApiProvider) => {
    setTestResult(null);
    const result = await testKey(provider);
    setTestResult({ id: provider.id, ...result });
  }, [testKey]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] text-gray-100 p-6 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#FF003C] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-gray-400 font-sans">جاري تهيئة قنوات الاتصال والتحقق من سلامة خوادم الـ API الموزعة...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-gray-100 p-4 md:p-8 space-y-8" dir="rtl">
      {/* Top Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#121214] border border-gray-800 p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-[#FF003C]/5 rounded-full blur-3xl pointer-events-none"></div>
        <ApiHeader />
        <ApiActionsToolbar
          onResetQuotas={resetQuotas}
          onAddKey={handleAddKey}
          onTestAll={testAllActiveKeys}
          onClearCache={clearCache}
          onReload={() => loadStats()}
          actionLoading={actionLoading}
        />
      </div>

      {/* Alert Banners */}
      {successMsg && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl text-sm font-semibold flex items-center gap-2 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-ping"></span>
          {successMsg}
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm font-semibold flex items-center gap-2 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-red-400"></span>
          {error}
        </div>
      )}

      {/* High-level status row */}
      <ApiStatusCards stats={stats} />

      {/* Bento Grid Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dashboard 1: Consumption */}
        <ApiStatisticsWidget
          totalRequests={statistics.totalRequests}
          successRate={statistics.successRate}
          hourlyTrends={statistics.hourlyTrends}
        />

        {/* Dashboard 2: Cost Controls */}
        <div className="bg-[#121214] border border-gray-800 rounded-2xl p-5 space-y-4 relative overflow-hidden flex flex-col justify-between min-h-[300px]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-200 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                لوحة التحكم بالتكاليف والنفقات
              </h3>
              <span className="text-xs text-green-400/80 font-semibold font-mono">Live Budget</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900/50 border border-gray-800/40 p-3 rounded-xl">
                <span className="text-xs text-gray-400 block">إجمالي التكاليف التقديرية</span>
                <span className="text-2xl font-black text-gray-100 font-mono block mt-1">
                  ${statistics.totalCost.toFixed(5)}
                </span>
              </div>
              <div className="bg-gray-900/50 border border-gray-800/40 p-3 rounded-xl">
                <span className="text-xs text-gray-400 block">متوسط تكلفة 1000 طلب</span>
                <span className="text-2xl font-black text-gray-100 font-mono block mt-1 text-green-400">
                  ${statistics.averageCostPerThousand.toFixed(4)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3.5 pt-1 border-t border-gray-800/50">
            {statistics.providerCosts.map((provCost) => (
              <div key={provCost.name} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400 font-mono">{provCost.name}</span>
                  <span className="text-gray-200 font-mono font-bold">${provCost.cost.toFixed(4)}</span>
                </div>
                <div className="bg-gray-950 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-green-400 h-full rounded-full" style={{ width: `${provCost.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard 3: Health */}
        <ApiHealthWidget health={health} />
      </div>

      {/* Smart Routing Configuration */}
      <ApiSettingsWidget
        routing={stats?.routing}
        actionLoading={actionLoading}
        onSaveRouting={saveRouting}
      />

      {/* Key Pool Table/Cards Panel */}
      <ApiKeysWidget
        providers={stats?.providers || []}
        actionLoading={actionLoading}
        testResult={testResult}
        onTestKey={handleTestConnection}
        onToggleActive={toggleActive}
        onEdit={handleEditProvider}
        onDelete={deleteProvider}
      />

      {/* Live Activity Transactions */}
      <ApiLogsWidget logs={logs} />

      {/* Modal dialog for adding/editing keys */}
      <ConnectionDetailsDialog
        isOpen={isFormOpen}
        provider={editingProvider}
        actionLoading={actionLoading}
        onClose={() => { setIsFormOpen(false); setEditingProvider(null); }}
        onSave={handleFormSave}
        onChange={handleFormChange}
      />
    </div>
  );
};

export default ApiManagementPage;
