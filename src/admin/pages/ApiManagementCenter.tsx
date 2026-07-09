import React, { useState } from 'react';
import { Trophy, Key, Server, Database, Activity, RefreshCw, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
import ApiManagementPage from '../api/ApiManagementPage';
import LeagueManager from '../shared/LeagueManager';
import TeamsManager from '../shared/TeamsManager';
import SyncManager from '../shared/SyncManager';

export const ApiManagementCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'providers' | 'keys' | 'leagues' | 'teams' | 'sync' | 'logs'>('dashboard');

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
        {activeTab === 'providers' && <div className="text-center py-20 text-gray-500">إدارة المزودين (قيد التطوير)</div>}
        {activeTab === 'keys' && <div className="text-center py-20 text-gray-500">مفاتيح الـ API (قيد التطوير)</div>}
        {activeTab === 'leagues' && <LeagueManager />}
        {activeTab === 'teams' && <TeamsManager />}
        {activeTab === 'sync' && <SyncManager />}
        {activeTab === 'logs' && <div className="text-center py-20 text-gray-500">السجلات (قيد التطوير)</div>}
      </div>
    </div>
  );
};

export default ApiManagementCenter;
