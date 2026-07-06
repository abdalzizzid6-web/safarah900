import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Trophy, Megaphone, Bell, Share2, Search, Users, Activity, Bug } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import BugLogsDashboard from './BugLogsDashboard';
import SeoAnalytics from './SeoAnalytics';
import SystemHealthDashboard from './SystemHealthDashboard';
import MatchesAnalyticsDashboard from './MatchesAnalyticsDashboard';
import UserBehaviorAnalytics from './UserBehaviorAnalytics';
import { userService } from '../../services/userService';
import { matchService } from '../../services/matchService';
import AdminLayout from '../layouts/AdminLayout';

const TABS = [
  { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard },
  { id: 'matches', label: 'المباريات', icon: Trophy },
  { id: 'behavior', label: 'المستخدمين', icon: Users },
  { id: 'seo', label: 'SEO', icon: Search },
  { id: 'system', label: 'النظام', icon: Activity },
  { id: 'errors', label: 'الأخطاء', icon: Bug },
  { id: 'ads', label: 'الإعلانات', icon: Megaphone },
  { id: 'push', label: 'الإشعارات', icon: Bell },
  { id: 'social', label: 'التواصل', icon: Share2 },
];

export default function AnalyticsCenter() {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState({ matches: [], users: [] });
  const [counts, setCounts] = useState({ matches: 0, users: 0, channels: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { doc, getDoc, collection, getDocs, query, limit } = await import('firebase/firestore');
        const { db } = await import('../../firebase');

        const [statsDoc, matchesStatsDoc, usersStatsDoc] = await Promise.all([
          getDoc(doc(db, 'system_stats', 'global')),
          getDoc(doc(db, 'system_stats', 'matches_analytics')),
          getDoc(doc(db, 'system_stats', 'users_analytics'))
        ]);
        
        let matchesStats = matchesStatsDoc.exists() ? matchesStatsDoc.data() : { live: 0, upcoming: 0, finished: 0, cancelled: 0, leagueData: [], dayData: [] };
        let usersStats = usersStatsDoc.exists() ? usersStatsDoc.data() : { total: 0, vips: 0, admins: 0, activeLast24h: 0, activeLast7d: 0, regData: [] };
        
        setData({ matches: matchesStats as any, users: usersStats as any });
        
        if (statsDoc.exists()) {
          const s = statsDoc.data();
          setCounts({
            matches: s.matches || 0,
            users: s.users || 0,
            channels: s.channels || 0
          });
        } else {
          setCounts({ matches: 0, users: 0, channels: 0 });
        }
      } catch (error: any) {
        const isQuota = error?.message?.toLowerCase().includes('quota') || 
                        error?.message?.toLowerCase().includes('exhausted') || 
                        error?.code === 'resource-exhausted';
        if (isQuota) {
          console.warn('[AnalyticsCenter] Firestore quota exceeded. Displaying empty or cached fallback analytics dashboard metrics.');
        } else {
          console.error('Error fetching analytics data:', error);
        }
        // Graceful fallback with empty structures so the UI doesn't crash
        setData({ matches: [], users: [] });
        setCounts({ matches: 0, users: 0, channels: 0 });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500">جاري تحميل البيانات...</div>;

  return (
    <AdminLayout title="مركز التحليلات المتكامل">
      <div className="flex gap-4 mb-8 overflow-x-auto pb-4 custom-scrollbar scrollbar-hide">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold whitespace-nowrap transition-all border ${activeTab === tab.id ? 'bg-primary text-black border-primary shadow-lg shadow-primary/20' : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'}`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && (
            <div className="text-center py-24 bg-black/20 rounded-[3rem] border border-dashed border-white/10 text-slate-500">
               <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Activity size={40} className="text-primary/40" />
               </div>
               <h3 className="font-black text-2xl text-white mb-3 tracking-tighter">لوحة البيانات قيد التجهيز</h3>
               <p className="text-sm text-slate-400 max-w-sm mx-auto px-6 leading-relaxed">
                 يتم تحديث لوحة التحكم الرئيسية لتوفير رؤية أعمق للمستخدمين.
               </p>
            </div>
          )}
          {activeTab === 'matches' && <MatchesAnalyticsDashboard stats={data.matches} />}
          {activeTab === 'behavior' && <UserBehaviorAnalytics stats={data.users} />}
          {activeTab === 'seo' && <SeoAnalytics />}
          {activeTab === 'system' && <SystemHealthDashboard />}
          {activeTab === 'errors' && <BugLogsDashboard />}
          {!['overview', 'matches', 'behavior', 'seo', 'system', 'errors'].includes(activeTab) && (
            <div className="text-center py-24 bg-black/20 rounded-[3rem] border border-dashed border-white/10 text-slate-500">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                 <Activity size={40} className="text-primary/40" />
              </div>
              <h3 className="font-black text-2xl text-white mb-3 tracking-tighter">هذه الوحدة قيد التجهيز</h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto px-6 leading-relaxed">
                نقوم حالياً بربط هذا القسم ({TABS.find(t => t.id === activeTab)?.label}) مع البيانات الحية لتقديم رؤى دقيقة وتصورية شاملة.
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </AdminLayout>
  );
};
