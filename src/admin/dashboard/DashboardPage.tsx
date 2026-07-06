import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import DashboardHeader from '@/src/admin/dashboard/DashboardHeader';
import StatisticsCards from '@/src/admin/dashboard/StatisticsCards';
import LiveMatchesWidget from '@/src/admin/dashboard/LiveMatchesWidget';
import QuickActions from '@/src/admin/dashboard/QuickActions';
import SystemHealthWidget from '@/src/admin/dashboard/SystemHealthWidget';
import RecentActivityWidget from '@/src/admin/dashboard/RecentActivityWidget';
import TrafficWidget from '@/src/admin/dashboard/TrafficWidget';
import ApiUsageWidget from '@/src/admin/dashboard/ApiUsageWidget';
import DatabaseActionsWidget from '@/src/admin/dashboard/DatabaseActionsWidget';
import AiInsightsWidget from '@/src/admin/dashboard/AiInsightsWidget';
import SecurityWidget from '@/src/admin/dashboard/SecurityWidget';
import ApiHealthDashboard from '@/src/admin/shared/ApiHealthDashboard';
import ApiSettings from '@/src/admin/shared/ApiSettings';
import { useDashboardStats } from '@/src/admin/dashboard/hooks/useDashboardStats';
import { useDashboardHealth } from '@/src/admin/dashboard/hooks/useDashboardHealth';
import { useDashboardActivity } from '@/src/admin/dashboard/hooks/useDashboardActivity';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 }
  }
};

export default function DashboardPage() {
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4500);
  };

  const {
    stats, liveMatches, aiInsights, loadingAi, isRebuildingStats, loadingStats, fetchStats, handleRebuildCounters, handleFetchAiInsights
  } = useDashboardStats(showToast);

  const {
    status, cpuLoad, memoryLoad, apiPing, auditingStreamId, auditResult, isClearingCache, isCleaningOldNews, loadingHealth, setStatus, fetchHealth, handleClearCache, handleCleanOldNews, auditStreamLink
  } = useDashboardHealth(showToast);

  const {
    recentActions, securityEvents, chartData, loadingActivity, fetchActivity
  } = useDashboardActivity();

  useEffect(() => {
    fetchStats();
    fetchHealth();
    fetchActivity();
    setTimeout(() => setStatus(prev => ({ ...prev, server: 'online', api: 'authorized' })), 1000);
  }, [fetchStats, fetchHealth, fetchActivity, setStatus]);

  const loading = loadingStats || loadingHealth || loadingActivity;

  const handleClearCacheWrapper = () => handleClearCache(fetchStats);
  const handleCleanOldNewsWrapper = () => handleCleanOldNews(fetchStats);

  const [activeLogFilter, setActiveLogFilter] = useState<'all' | 'error' | 'success' | 'info'>('all');
  const [showApiSettings, setShowApiSettings] = useState(false);

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-16 text-right" 
      dir="rtl"
    >
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, x: -50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-20 left-6 z-50 shadow-2xl"
          >
            <div className={`px-5 py-3.5 rounded-2xl border backdrop-blur-md flex items-center gap-3 ${
              toastMessage.type === 'success' ? 'bg-emerald-950/95 border-emerald-500/40 text-emerald-300' :
              toastMessage.type === 'error' ? 'bg-red-950/95 border-red-500/40 text-red-300' :
              'bg-indigo-950/95 border-indigo-500/40 text-indigo-300'
            }`}>
              {toastMessage.type === 'success' && <CheckCircle2 size={16} className="text-emerald-400" />}
              {toastMessage.type === 'error' && <AlertTriangle size={16} className="text-red-400" />}
              {toastMessage.type === 'info' && <RefreshCw size={16} className="animate-spin text-indigo-400" />}
              <span className="text-xs font-black leading-relaxed">{toastMessage.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={itemVariants}><DashboardHeader fetchStats={fetchStats} loading={loading} title="لوحة الإدارة والمطابقة الذكية" /></motion.div>

      {status.isFirestoreQuotaExceeded && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 bg-amber-500/10 border border-amber-500/25 rounded-[2rem] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="flex items-start gap-3.5">
            <AlertTriangle className="text-amber-400 shrink-0 w-6 h-6 animate-pulse mt-0.5" />
            <div className="space-y-1 text-right">
              <h4 className="font-extrabold text-white text-sm">تم تفعيل وضع حماية وحفظ الحصة لقاعدة البيانات (Firestore Quota Protection)</h4>
              <p className="text-xs text-gray-400 font-semibold leading-relaxed">
                قاعدة بيانات Firestore تخطت استهلاك الحصة المجانية اليومية المحددة. تم تنشيط نظام التراجع التلقائي بنجاح؛ الخادم يخدم الزوار حالياً من ملفات الكاش المحلية الذكية لتأمين البقاء دون أي خلل أو توقف.
              </p>
            </div>
          </div>
          <button 
            onClick={handleCleanOldNewsWrapper} 
            disabled={isCleaningOldNews}
            className="shrink-0 px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/30 transition-all active:scale-95 whitespace-nowrap cursor-pointer outline-none"
          >
            {isCleaningOldNews ? 'جاري التنظيف...' : 'تنظيف الأرشيف والبيانات القديمة'}
          </button>
        </motion.div>
      )}

      <motion.div variants={itemVariants}><StatisticsCards stats={stats} status={status} /></motion.div>
      <motion.div variants={itemVariants}><ApiHealthDashboard /></motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants}><SystemHealthWidget cpuLoad={cpuLoad} memoryLoad={memoryLoad} apiPing={apiPing} /></motion.div>
        <motion.div variants={itemVariants} className="lg:col-span-2"><TrafficWidget chartData={chartData} /></motion.div>
      </div>
      <motion.div variants={itemVariants}><ApiUsageWidget /></motion.div>

      <motion.div variants={itemVariants}>
        <DatabaseActionsWidget 
          handleRebuildCounters={handleRebuildCounters} isRebuildingStats={isRebuildingStats} loading={loading}
          handleClearCache={handleClearCacheWrapper} isClearingCache={isClearingCache}
          handleCleanOldNews={handleCleanOldNewsWrapper} isCleaningOldNews={isCleaningOldNews}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <LiveMatchesWidget liveMatches={liveMatches} auditStreamLink={auditStreamLink} auditingStreamId={auditingStreamId} auditResult={auditResult} showToast={showToast} />
      </motion.div>

      <motion.div variants={itemVariants}>
        <AiInsightsWidget handleFetchAiInsights={handleFetchAiInsights} loadingAi={loadingAi} aiInsights={aiInsights} />
      </motion.div>

      <motion.div variants={itemVariants}>
        <QuickActions setShowApiSettings={setShowApiSettings} showApiSettings={showApiSettings} />
      </motion.div>

      <AnimatePresence>
        {showApiSettings && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#121214] border border-white/5 rounded-[2.5rem] p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-black text-white">إعدادات الـ API</h2>
                 <button onClick={() => setShowApiSettings(false)} className="text-gray-400 hover:text-white">إغلاق</button>
               </div>
               <ApiSettings />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <RecentActivityWidget recentActions={recentActions} activeLogFilter={activeLogFilter} setActiveLogFilter={setActiveLogFilter} />
        </motion.div>
        <motion.div variants={itemVariants}><SecurityWidget securityEvents={securityEvents} /></motion.div>
      </div>
    </motion.div>
  );
}
