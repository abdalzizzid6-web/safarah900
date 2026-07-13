import React, { useState } from 'react';
import { Trophy, Key, Server, Database, Activity, RefreshCw, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import ApiManagementPage from '@/admin/api/ApiManagementPage';
import LeagueManager from '@/admin/shared/LeagueManager';
import TeamsManager from '@/admin/shared/TeamsManager';
import SyncManager from '@/admin/shared/SyncManager';
import { useApiConnections } from '@/admin/api/hooks/useApiConnections';
import { useApiHealth } from '@/admin/api/hooks/useApiHealth';
import { useApiLogs } from '@/admin/api/hooks/useApiLogs';
import ApiKeysWidget from '@/admin/api/components/ApiKeysWidget';
import ApiLogsWidget from '@/admin/api/components/ApiLogsWidget';

export const ApiManagementCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'providers' | 'keys' | 'leagues' | 'teams' | 'sync' | 'logs'>('dashboard');
  const {
    stats,
    actionLoading,
    testKey,
    toggleActive,
    deleteProvider,
    saveProvider,
    testAllActiveKeys,
  } = useApiConnections();
  const health = useApiHealth(stats);
  const { logs } = useApiLogs(stats);

  const tabs = [
    { id: 'dashboard', label: 'نظرة عامة', icon: Activity },
    { id: 'providers', label: 'المزودون', icon: Server },
    { id: 'keys', label: 'مفاتيح الـ API', icon: Key },
    { id: 'leagues', label: 'البطولات', icon: Trophy },
    { id: 'teams', label: 'الفرق', icon: Users },
    { id: 'sync', label: 'المزامنة', icon: RefreshCw },
    { id: 'logs', label: 'السجلات', icon: Database },
  ] as const;

  return (
    <div className="min-h-screen bg-[#09090B] text-gray-100 p-8" dir="rtl">
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-2">مركز إدارة الـ API</h1>
        <p className="text-gray-400">نظام موحد لإدارة جميع مزودي البيانات، مفاتيح الـ API، والبطولات.</p>
      </div>
      <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300 whitespace-nowrap",
              activeTab === tab.id
                ? "bg-primary text-black"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            )}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>
      <div className="bg-[#121214] border border-gray-800 rounded-3xl p-6">
        {activeTab === 'dashboard' && <ApiManagementPage />}
        {(activeTab === 'providers' || activeTab === 'keys') && (
            <ApiKeysWidget
              providers={stats?.providers || []}
              actionLoading={actionLoading}
              testResult={null}
              onTestKey={testKey}
              onToggleActive={toggleActive}
              onEdit={() => {}}
              onDelete={deleteProvider}
            />
        )}
        {activeTab === 'leagues' && <LeagueManager />}
        {activeTab === 'teams' && <TeamsManager />}
        {activeTab === 'sync' && <SyncManager />}
        {activeTab === 'logs' && <ApiLogsWidget logs={logs || []} />}
      </div>
    </div>
  );
};
export default ApiManagementCenter;
