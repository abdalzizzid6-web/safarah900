import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Search, Filter, RefreshCw, Brain, Database, 
  ExternalLink, ChevronLeft, ChevronRight, CheckCircle2, 
  Clock, AlertCircle, FileText, Sparkles, Globe
} from 'lucide-react';

interface KnowledgeItem {
  id: string;
  type: 'player' | 'team' | 'competition' | 'match';
  name: string;
  arName: string;
  summary: string;
  lastUpdated: string;
  status: 'synced' | 'pending' | 'error';
  confidence: number;
}

export default function KnowledgeBaseManager() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    fetchKnowledge();
  }, []);

  const fetchKnowledge = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would be a fetch to /api/admin/knowledge
      // For now, we simulate with the data we know exists in Firestore/Backend
      const mockItems: KnowledgeItem[] = [
        {
          id: 'p1',
          type: 'player',
          name: 'Lionel Messi',
          arName: 'ليونيل ميسي',
          summary: 'قائد المنتخب الأرجنتيني وأسطورة كرة القدم العالمية...',
          lastUpdated: new Date().toISOString(),
          status: 'synced',
          confidence: 0.98
        },
        {
          id: 't1',
          type: 'team',
          name: 'Real Madrid',
          arName: 'ريال مدريد',
          summary: 'النادي الملكي الإسباني، الأكثر تتويجاً بدوري أبطال أوروبا...',
          lastUpdated: new Date().toISOString(),
          status: 'synced',
          confidence: 0.99
        },
        {
          id: 'c1',
          type: 'competition',
          name: 'World Cup 2026',
          arName: 'كأس العالم 2026',
          summary: 'النسخة القادمة من المونديال في أمريكا والمكسيك وكندا...',
          lastUpdated: new Date().toISOString(),
          status: 'pending',
          confidence: 0.85
        }
      ];
      setItems(mockItems);
    } catch (error) {
      console.error('Failed to fetch knowledge:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      // Call backend sync service
      await fetch('/api/admin/knowledge/sync-all', { method: 'POST' });
      await fetchKnowledge();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.arName.includes(searchTerm);
    const matchesFilter = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <BookOpen className="text-amber-500" />
            مركز إدارة المعرفة الرياضية (Knowledge Base)
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            إدارة البيانات الوصفية، السير الذاتية، والحقائق التاريخية المعززة بالذكاء الاصطناعي للكيانات الرياضية.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSyncAll}
            disabled={isSyncing}
            className="flex items-center gap-2 bg-amber-500 text-black px-4 py-2 rounded-xl font-bold text-sm hover:bg-amber-400 transition-all disabled:opacity-50"
          >
            <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'جاري المزامنة...' : 'مزامنة شاملة'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="bg-[#111112] border border-white/5 p-4 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
              <Brain size={20} />
            </div>
            <span className="text-xs font-bold text-gray-400">إجمالي الكيانات</span>
          </div>
          <p className="text-2xl font-black text-white">1,248</p>
          <div className="mt-2 text-[10px] text-emerald-400 flex items-center gap-1">
            <Sparkles size={10} /> +24 هذا الأسبوع
          </div>
        </div>

        <div className="bg-[#111112] border border-white/5 p-4 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
              <CheckCircle2 size={20} />
            </div>
            <span className="text-xs font-bold text-gray-400">بيانات موثقة</span>
          </div>
          <p className="text-2xl font-black text-white">92%</p>
          <div className="mt-2 text-[10px] text-gray-500">من إجمالي البيانات المدخلة</div>
        </div>

        <div className="bg-[#111112] border border-white/5 p-4 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
              <Database size={20} />
            </div>
            <span className="text-xs font-bold text-gray-400">حجم قاعدة البيانات</span>
          </div>
          <p className="text-2xl font-black text-white">420 MB</p>
          <div className="mt-2 text-[10px] text-gray-500">تخزين Firestore الموزع</div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-[#111112] border border-white/5 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="البحث عن لاعب، فريق، أو بطولة..."
            className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pr-10 pl-4 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <Filter size={18} className="text-gray-500" />
          <select 
            className="bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-amber-500/50"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">كل الأنواع</option>
            <option value="player">لاعبين</option>
            <option value="team">فرق</option>
            <option value="competition">بطولات</option>
            <option value="match">مباريات</option>
          </select>
        </div>
      </div>

      {/* Knowledge List */}
      <div className="bg-[#111112] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-white/5 text-gray-400 text-xs font-bold uppercase tracking-widest border-b border-white/5">
              <th className="px-6 py-4">الكيان</th>
              <th className="px-6 py-4">النوع</th>
              <th className="px-6 py-4">الحالة</th>
              <th className="px-6 py-4">الدقة</th>
              <th className="px-6 py-4">آخر تحديث</th>
              <th className="px-6 py-4">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={6} className="px-6 py-8">
                    <div className="h-4 bg-white/5 rounded w-full"></div>
                  </td>
                </tr>
              ))
            ) : filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.02] transition-all group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-gray-500">
                        {item.type === 'player' ? <UsersIcon size={14} /> : <Database size={14} />}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{item.arName}</div>
                        <div className="text-[10px] text-gray-500 font-mono uppercase">{item.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs px-2 py-1 rounded bg-white/5 text-gray-400 border border-white/5">
                      {item.type === 'player' ? 'لاعب' : item.type === 'team' ? 'فريق' : 'بطولة'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs">
                      {item.status === 'synced' ? (
                        <>
                          <CheckCircle2 size={14} className="text-emerald-500" />
                          <span className="text-emerald-500">تمت المزامنة</span>
                        </>
                      ) : (
                        <>
                          <Clock size={14} className="text-amber-500" />
                          <span className="text-amber-500">قيد المعالجة</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-24 bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${item.confidence > 0.9 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: `${item.confidence * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">{(item.confidence * 100).toFixed(1)}% ثقة</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[11px] text-gray-400">
                      {new Date(item.lastUpdated).toLocaleDateString('ar-EG')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button className="p-2 hover:bg-amber-500/20 text-amber-500 rounded-lg transition-all" title="تعديل">
                        <FileText size={16} />
                      </button>
                      <button className="p-2 hover:bg-blue-500/20 text-blue-500 rounded-lg transition-all" title="فتح">
                        <ExternalLink size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <AlertCircle size={32} />
                    <p>لم يتم العثور على أي نتائج تطابق بحثك.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="bg-white/5 px-6 py-4 flex items-center justify-between">
          <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">عرض 1-10 من أصل 1,248</p>
          <div className="flex items-center gap-2">
            <button className="p-2 bg-black/40 border border-white/10 rounded-lg text-gray-500 hover:text-white transition-all">
              <ChevronRight size={16} />
            </button>
            <button className="p-2 bg-black/40 border border-white/10 rounded-lg text-gray-500 hover:text-white transition-all">
              <ChevronLeft size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Users as UsersIcon } from 'lucide-react';
