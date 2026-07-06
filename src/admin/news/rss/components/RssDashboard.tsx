import React, { useState } from 'react';
import { useRssProviders } from '../hooks/useRssProviders';
import { useRssQueue } from '../hooks/useRssQueue';
import { useRssAnalytics } from '../hooks/useRssAnalytics';
import { RssProvidersList } from './RssProvidersList';
import { RssImportQueue } from './RssImportQueue';
import { RssAnalytics } from './RssAnalytics';
import { RssHealth } from './RssHealth';
import { RssArticleEditor } from './RssArticleEditor';
import { RssImportedArticle } from '../types';
import { Layers, Radio, Globe, BarChart3, Activity } from 'lucide-react';

export function RssDashboard() {
  const [activeSubTab, setActiveSubTab] = useState<'queue' | 'providers' | 'analytics' | 'health'>('queue');
  const [editingArticle, setEditingArticle] = useState<RssImportedArticle | null>(null);

  // Load hooks
  const {
    providers,
    loading: loadingProviders,
    syncingId,
    syncingAll,
    saveProvider,
    deleteProvider,
    toggleProvider,
    syncProvider,
    syncAll,
    seed
  } = useRssProviders();

  const {
    articles,
    loading: loadingQueue,
    filters,
    updateFilters,
    updateArticleStatus,
    editArticle,
    reclassifyArticle
  } = useRssQueue('REVIEW');

  const {
    stats,
    loading: loadingAnalytics,
    fetchAnalytics
  } = useRssAnalytics();

  const handleSaveArticleEdit = async (id: string, updates: Partial<RssImportedArticle>) => {
    const updated = await editArticle(id, updates);
    fetchAnalytics(); // refresh stats
    return updated;
  };

  const handleUpdateStatusAndRefresh = async (id: string, status: string, schedule?: string) => {
    const res = await updateArticleStatus(id, status, schedule);
    fetchAnalytics(); // refresh stats
    return res;
  };

  const handleReclassifyAndRefresh = async (id: string) => {
    const res = await reclassifyArticle(id);
    fetchAnalytics(); // refresh stats
    return res;
  };

  const subTabs = [
    { id: 'queue', label: 'قائمة مراجعة المحتوى المستورد', icon: <Radio className="w-4 h-4" /> },
    { id: 'providers', label: 'إدارة مصادر التغذية (RSS)', icon: <Globe className="w-4 h-4" /> },
    { id: 'analytics', label: 'التحليلات ومعدلات القبول', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'health', label: 'صحة المصادر (RSS Health)', icon: <Activity className="w-4 h-4" /> }
  ];

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Aggregator Header banner */}
      <div className="bg-[#121214] border border-white/[0.05] rounded-3xl p-6 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-primary font-bold text-xs">
            <Layers className="w-4 h-4" /> منصة تجميع الأخبار والذكاء الاصطناعي (RSS Portal)
          </div>
          <h1 className="text-xl font-black text-white mt-1.5 leading-relaxed">
            محرك الاستيراد والتجميع الرياضي التلقائي
          </h1>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
            استيراد تلقائي فوري للمقالات الرياضية من كبرى المصادر العربية والعالمية، تصفية التكرارات، تصنيفها وتوليد التوسيمات بالذكاء الاصطناعي لتأهيلها للمراجعة البشرية بنقرة واحدة.
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute left-0 bottom-0 top-0 opacity-10 pointer-events-none w-1/3 bg-gradient-to-r from-primary to-transparent"></div>
      </div>

      {/* Sub Nav Bar */}
      <div className="flex gap-2 border-b border-white/[0.04] pb-3 overflow-x-auto scrollbar-none">
        {subTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveSubTab(t.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
              activeSubTab === t.id
                ? 'bg-primary/10 text-primary border border-primary/25 font-black'
                : 'text-gray-400 hover:text-white bg-transparent'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Dynamic Sub View */}
      {activeSubTab === 'queue' && (
        <RssImportQueue
          articles={articles}
          providers={providers}
          loading={loadingQueue}
          filters={filters}
          onUpdateFilters={updateFilters}
          onUpdateStatus={handleUpdateStatusAndRefresh}
          onReclassify={handleReclassifyAndRefresh}
          onEditArticle={(art) => setEditingArticle(art)}
        />
      )}

      {activeSubTab === 'providers' && (
        <RssProvidersList
          providers={providers}
          loading={loadingProviders}
          syncingId={syncingId}
          syncingAll={syncingAll}
          onSave={saveProvider}
          onDelete={deleteProvider}
          onToggle={toggleProvider}
          onSync={syncProvider}
          onSyncAll={syncAll}
          onSeed={seed}
        />
      )}

      {activeSubTab === 'analytics' && (
        <RssAnalytics
          stats={stats}
          providers={providers}
          loading={loadingAnalytics}
          onRefresh={fetchAnalytics}
        />
      )}

      {activeSubTab === 'health' && (
        <RssHealth
          providers={providers}
          loading={loadingProviders}
          syncingId={syncingId}
          onSync={syncProvider}
        />
      )}

      {/* Detailed article editor modal */}
      <RssArticleEditor
        article={editingArticle}
        isOpen={!!editingArticle}
        onClose={() => setEditingArticle(null)}
        onSave={handleSaveArticleEdit}
      />
    </div>
  );
}
export default RssDashboard;
