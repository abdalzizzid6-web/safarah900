import React, { useState, useEffect } from 'react';
import { 
  Activity, BarChart2, Share2, CheckCircle2, XCircle, Clock, Send, Eye, MousePointer, ThumbsUp, MessageSquare, RefreshCw 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface StatItem {
  title: string;
  value: string | number;
  icon: any;
  color: string;
}

interface PerformanceData {
  name: string;
  reach: number;
  clicks: number;
}

interface QueuedItem {
  id: string;
  content: string;
  platforms: string[];
  scheduledFor?: string;
  status: string;
}

const SocialDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    activeAccounts: 0,
    todayPosts: 0,
    successPosts: 0,
    failedPosts: 0,
    reach: 0,
    views: 0,
    clicks: 0,
    likes: 0,
    shares: 0,
    comments: 0,
    ctr: 0,
    bestPublishTime: ''
  });
  const [chartData, setChartData] = useState<PerformanceData[]>([]);
  const [queue, setQueue] = useState<QueuedItem[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch live metrics & aggregate analytics
      const res = await fetch('/api/social/analytics');
      if (res.ok) {
        const data = await res.json();
        setStats({
          activeAccounts: data.summary.activeAccounts,
          todayPosts: data.summary.todayPosts,
          successPosts: data.summary.successPosts,
          failedPosts: data.summary.failedPosts,
          reach: data.reach,
          views: data.views,
          clicks: data.clicks,
          likes: data.likes,
          shares: data.shares,
          comments: data.comments,
          ctr: data.ctr,
          bestPublishTime: data.bestPublishTime
        });
        setChartData(data.performanceTrend || []);
      }

      // 2. Fetch pending queue
      const qRes = await fetch('/api/social/queue');
      if (qRes.ok) {
        const qData = await qRes.json();
        setQueue((qData.queue || []).slice(0, 5));
      }
    } catch (err) {
      console.error('Failed to load social dashboard analytics', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const statItems: StatItem[] = [
    { title: 'الحسابات النشطة', value: stats.activeAccounts, icon: Share2, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
    { title: 'منشورات اليوم', value: stats.todayPosts, icon: Activity, color: 'text-green-500 bg-green-500/10 border-green-500/20' },
    { title: 'تم النشر بنجاح', value: stats.successPosts, icon: CheckCircle2, color: 'text-primary bg-primary/10 border-primary/20' },
    { title: 'فشل النشر', value: stats.failedPosts, icon: XCircle, color: 'text-red-500 bg-red-500/10 border-red-500/20' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">نظرة عامة على الإحصائيات</h2>
          <p className="text-xs text-gray-400 mt-1">تحديث حي ومباشر لنشاط النشر التلقائي ومقاييس التفاعل في كافة المنصات.</p>
        </div>
        <button 
          onClick={fetchDashboardData}
          disabled={isLoading}
          className="p-2 rounded-lg bg-surface-elevated text-gray-400 hover:text-white border border-white/5 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((stat, i) => (
          <div key={i} className={`bg-surface rounded-xl p-5 border ${stat.color.split(' ')[2] || 'border-white/5'}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-xs font-medium">{stat.title}</p>
                <p className="text-3xl font-extrabold text-white mt-2 tracking-tight">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl border ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[
          { label: 'الوصول الكلي (Reach)', val: stats.reach.toLocaleString('ar-SA'), icon: Eye, unit: 'مستهدف' },
          { label: 'مرات المشاهدة (Views)', val: stats.views.toLocaleString('ar-SA'), icon: Activity, unit: 'مشاهدة' },
          { label: 'النقرات الإجمالية (Clicks)', val: stats.clicks.toLocaleString('ar-SA'), icon: MousePointer, unit: 'نقرة' },
          { label: 'نسبة النقر للظهور (CTR)', val: `${stats.ctr}%`, icon: CheckCircle2, unit: 'متوسط' }
        ].map((subStat, idx) => (
          <div key={idx} className="bg-surface rounded-xl p-4 border border-white/5 flex gap-3.5 items-center">
            <div className="w-10 h-10 rounded-lg bg-surface-elevated flex items-center justify-center border border-white/5">
              <subStat.icon className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase">{subStat.label}</p>
              <p className="text-lg font-bold text-white mt-0.5">{subStat.val}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-surface rounded-xl border border-white/5 p-6 flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-primary" />
              تحليل تفاعلي للجمهور والانتشار
            </h3>
            <p className="text-xs text-gray-500 mt-1">مقارنة حجم انتشار المنشورات (Reach) مقابل نقرات الروابط (Clicks) للسبعة أيام الماضية.</p>
          </div>
          
          {isLoading ? (
            <div className="h-[250px] bg-surface-elevated rounded-lg animate-pulse" />
          ) : chartData.length === 0 ? (
            <div className="min-h-[250px] flex items-center justify-center text-center">
              <div>
                <BarChart2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">لا توجد بيانات كافية لعرض الرسوم البيانية</p>
              </div>
            </div>
          ) : (
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="name" stroke="#888" fontSize={11} tickLine={false} />
                  <YAxis stroke="#888" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#1c1c1e', border: '1px solid #333', borderRadius: '8px' }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Bar name="الانتشار (Reach)" dataKey="reach" fill="#ffca28" radius={[4, 4, 0, 0]} />
                  <Bar name="النقرات (Clicks)" dataKey="clicks" fill="#34c759" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Dashboard Sidebar - Queue */}
        <div className="bg-surface rounded-xl border border-white/5 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              جدول النشر التالي
            </h3>
            
            {isLoading ? (
              <div className="space-y-3">
                <div className="h-12 bg-surface-elevated rounded-lg animate-pulse" />
                <div className="h-12 bg-surface-elevated rounded-lg animate-pulse" />
              </div>
            ) : queue.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-sm">لا توجد منشورات في قائمة الانتظار</p>
              </div>
            ) : (
              <div className="space-y-3">
                {queue.map(item => (
                  <div key={item.id} className="p-3.5 bg-surface-elevated rounded-lg border border-white/5 space-y-2">
                    <p className="text-gray-200 text-xs font-semibold line-clamp-2 leading-relaxed">{item.content}</p>
                    <div className="flex justify-between items-center text-[10px] text-gray-500 font-semibold pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {item.scheduledFor ? new Date(item.scheduledFor).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : 'النشر المباشر'}
                      </span>
                      <div className="flex gap-1">
                        {item.platforms.map(p => (
                          <span key={p} className="px-1 py-0.2 rounded bg-primary/10 text-primary uppercase text-[8px] font-bold">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="border-t border-white/5 pt-4 mt-4 text-center">
            <p className="text-xs text-gray-400">ساعة الذروة الأفضل للنشر تلقائياً: <strong className="text-primary">{stats.bestPublishTime || '8:00 مساءً'}</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialDashboard;
