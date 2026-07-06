import React, { useState, useEffect } from 'react';
import { 
  Rss, Globe, Settings, RefreshCw, Plus, Trash2, 
  CheckCircle2, AlertCircle, Clock, ExternalLink,
  Filter, Search, Power, Zap, Share2
} from 'lucide-react';

interface RssProvider {
  id: string;
  name: string;
  url: string;
  category: string;
  status: 'active' | 'inactive' | 'error';
  lastSync: string;
  itemsCount: number;
}

export default function RssManager() {
  const [providers, setProviders] = useState<RssProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    setIsLoading(true);
    try {
      // Simulation of fetching RSS providers
      const mockProviders: RssProvider[] = [
        {
          id: 'p1',
          name: 'Yalla Kora',
          url: 'https://www.yallakora.com/rss/news',
          category: 'Sports News',
          status: 'active',
          lastSync: new Date().toISOString(),
          itemsCount: 1240
        },
        {
          id: 'p2',
          name: 'Koora.com',
          url: 'https://www.kooora.com/?rss=1',
          category: 'International News',
          status: 'active',
          lastSync: new Date().toISOString(),
          itemsCount: 850
        },
        {
          id: 'p3',
          name: 'BBC Arabic Sports',
          url: 'http://newsrss.bbc.co.uk/rss/arabic/news/rss.xml',
          category: 'Global',
          status: 'error',
          lastSync: new Date(Date.now() - 3600000).toISOString(),
          itemsCount: 0
        }
      ];
      setProviders(mockProviders);
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      await fetch('/api/admin/rss/refresh-all', { method: 'POST' });
      await fetchProviders();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleProviderStatus = async (id: string) => {
    setProviders(prev => prev.map(p => 
      p.id === id ? { ...p, status: p.status === 'active' ? 'inactive' : 'active' } : p
    ));
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <Rss className="text-orange-500" />
            مركز إدارة خلاصات الأخبار (RSS Feeds Center)
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            إدارة مصادر الأخبار التلقائية، وجدولة المزامنة، وتصفية المحتوى الرياضي المجمع.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefreshAll}
            disabled={isRefreshing}
            className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-white/20 transition-all"
          >
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            تحديث الكل الآن
          </button>
          <button className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-orange-500 transition-all shadow-lg shadow-orange-600/10">
            <Plus size={18} />
            إضافة مصدر جديد
          </button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#111112] border border-white/5 p-5 rounded-2xl">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block">المصادر النشطة</span>
          <h4 className="text-2xl font-black text-white mt-1">12 <span className="text-xs text-gray-400 font-normal">من أصل 15</span></h4>
        </div>
        <div className="bg-[#111112] border border-white/5 p-5 rounded-2xl">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block">إجمالي المقالات المجمعة</span>
          <h4 className="text-2xl font-black text-emerald-400 mt-1">45.2K</h4>
        </div>
        <div className="bg-[#111112] border border-white/5 p-5 rounded-2xl">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block">متوسط زمن المزامنة</span>
          <h4 className="text-2xl font-black text-blue-400 mt-1">5 <span className="text-xs text-gray-400 font-normal">دقائق</span></h4>
        </div>
        <div className="bg-[#111112] border border-white/5 p-5 rounded-2xl">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block">كفاءة التصفية</span>
          <h4 className="text-2xl font-black text-orange-400 mt-1">99.8%</h4>
        </div>
      </div>

      {/* Provider List */}
      <div className="bg-[#111112] border border-white/5 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-black text-white">مزودي خلاصات RSS</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
              <input 
                type="text" 
                placeholder="ابحث عن مصدر..."
                className="bg-black/40 border border-white/10 rounded-lg py-1.5 pr-8 pl-3 text-xs text-white focus:outline-none focus:border-orange-500/50"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-white/[0.02] text-gray-500 text-[10px] font-black uppercase tracking-tighter">
                <th className="px-6 py-4">المصدر</th>
                <th className="px-6 py-4">الفئة</th>
                <th className="px-6 py-4">الحالة</th>
                <th className="px-6 py-4">إجمالي المحتوى</th>
                <th className="px-6 py-4">آخر مزامنة</th>
                <th className="px-6 py-4 text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {providers.map((p) => (
                <tr key={p.id} className="group hover:bg-white/[0.02] transition-all">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-black border border-orange-500/10 flex items-center justify-center text-orange-500">
                        <Globe size={18} />
                      </div>
                      <div>
                        <div className="text-sm font-black text-white">{p.name}</div>
                        <div className="text-[10px] text-gray-500 font-mono truncate max-w-[200px]">{p.url}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {p.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      {p.status === 'active' ? (
                        <>
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[11px] font-bold text-emerald-500">نشط</span>
                        </>
                      ) : p.status === 'error' ? (
                        <>
                          <AlertCircle size={14} className="text-red-500" />
                          <span className="text-[11px] font-bold text-red-500">خطأ بالاتصال</span>
                        </>
                      ) : (
                        <>
                          <Power size={14} className="text-gray-500" />
                          <span className="text-[11px] font-bold text-gray-500">معطل</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-gray-300">
                    {p.itemsCount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-white font-bold">{new Date(p.lastSync).toLocaleTimeString('ar-EG')}</span>
                      <span className="text-[10px] text-gray-500">{new Date(p.lastSync).toLocaleDateString('ar-EG')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => toggleProviderStatus(p.id)}
                        className={`p-2 rounded-lg transition-all ${p.status === 'active' ? 'hover:bg-red-500/20 text-red-500' : 'hover:bg-emerald-500/20 text-emerald-500'}`}
                        title={p.status === 'active' ? 'تعطيل' : 'تفعيل'}
                      >
                        <Power size={14} />
                      </button>
                      <button className="p-2 hover:bg-orange-500/20 text-orange-500 rounded-lg transition-all">
                        <Settings size={14} />
                      </button>
                      <button className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111112] border border-white/5 p-6 rounded-3xl space-y-4">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Zap size={16} className="text-amber-500" />
            جدولة التحديث التلقائي
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-500 font-black uppercase">فترة المزامنة (بالدقائق)</label>
              <input type="number" defaultValue={5} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-500 font-black uppercase">الحد الأقصى للمقالات/دورة</label>
              <input type="number" defaultValue={50} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white" />
            </div>
          </div>
          <button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs py-3 rounded-xl transition-all">
            حفظ إعدادات الجدولة
          </button>
        </div>

        <div className="bg-[#111112] border border-white/5 p-6 rounded-3xl space-y-4">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Share2 size={16} className="text-blue-500" />
            توزيع المحتوى الذكي
          </h3>
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5">
            <span className="text-xs font-bold text-gray-300">نشر تلقائي في السوشيال ميديا</span>
            <div className="w-10 h-5 bg-emerald-600 rounded-full relative cursor-pointer">
              <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full translate-x-5 transition-all" />
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5">
            <span className="text-xs font-bold text-gray-300">ترجمة فورية للمقالات الأجنبية</span>
            <div className="w-10 h-5 bg-emerald-600 rounded-full relative cursor-pointer">
              <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full translate-x-5 transition-all" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
