import React, { useState } from 'react';
import { RssProvider } from '../types';
import { Plus, Edit2, Trash2, RefreshCw, Power, CheckCircle, AlertTriangle, Globe, Shield, Calendar } from 'lucide-react';
import { formatArabicDate } from '../utils';

interface Props {
  providers: RssProvider[];
  loading: boolean;
  syncingId: string | null;
  syncingAll: boolean;
  onSave: (provider: Partial<RssProvider>) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
  onToggle: (id: string) => Promise<any>;
  onSync: (id: string) => Promise<any>;
  onSyncAll: () => Promise<any>;
  onSeed: () => Promise<any>;
}

export function RssProvidersList({
  providers,
  loading,
  syncingId,
  syncingAll,
  onSave,
  onDelete,
  onToggle,
  onSync,
  onSyncAll,
  onSeed
}: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Partial<RssProvider> | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    url: '',
    language: 'العربية',
    country: 'عالمي',
    sport: 'كرة القدم',
    category: 'أخبار عامة',
    updateInterval: 30
  });

  const openAddModal = () => {
    setEditingProvider(null);
    setFormData({
      name: '',
      logo: '',
      url: '',
      language: 'العربية',
      country: 'عالمي',
      sport: 'كرة القدم',
      category: 'أخبار عامة',
      updateInterval: 30
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p: RssProvider) => {
    setEditingProvider(p);
    setFormData({
      name: p.name,
      logo: p.logo,
      url: p.url,
      language: p.language,
      country: p.country,
      sport: p.sport,
      category: p.category,
      updateInterval: p.updateInterval
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.url) {
      alert('يرجى ملء الحقول الإلزامية');
      return;
    }
    try {
      await onSave({
        ...editingProvider,
        ...formData
      });
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-black text-white">مصادر التغذية الإخبارية (RSS Feeds)</h2>
          <p className="text-xs text-gray-400 mt-1">قم بإدارة وتحديث مصادر الأخبار التلقائية وضبط فترات المزامنة</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {providers.length === 0 && (
            <button
              onClick={onSeed}
              className="bg-[#1C1C24] hover:bg-[#252530] text-gray-300 px-4 py-2.5 rounded-2xl text-xs font-bold border border-white/[0.05] transition-all flex items-center gap-2"
            >
              <Globe className="w-4 h-4 text-emerald-500" /> تثبيت المصادر العربية الافتراضية
            </button>
          )}

          <button
            onClick={onSyncAll}
            disabled={syncingAll || providers.length === 0}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border border-white/[0.05] ${
              syncingAll
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-[#18181C] text-primary hover:bg-[#23232C]'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${syncingAll ? 'animate-spin' : ''}`} />
            {syncingAll ? 'جاري تحديث الكل...' : 'مزامنة كافة المصادر'}
          </button>

          <button
            onClick={openAddModal}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> إضافة مصدر جديد
          </button>
        </div>
      </div>

      {providers.length === 0 ? (
        <div className="bg-[#121214] border border-white/[0.05] rounded-3xl p-12 text-center">
          <Globe className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-sm font-bold text-gray-300">لا يوجد مصادر مضافة</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            قم بإضافة مصادر تغذية رياضية للحصول على تحديثات تلقائية وتصنيفها بالذكاء الاصطناعي
          </p>
          <button
            onClick={onSeed}
            className="mt-4 bg-primary text-black px-5 py-2.5 rounded-2xl text-xs font-bold transition-all"
          >
            تثبيت المصادر الافتراضية الآن
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {providers.map((p, index) => {
            const isSyncing = syncingId === p.id;
            return (
              <div
                key={p.id || `provider-${index}`}
                className={`bg-[#121214] border rounded-3xl p-5 transition-all ${
                  p.enabled
                    ? p.status === 'FAILED'
                      ? 'border-red-500/20 hover:border-red-500/30'
                      : 'border-white/[0.05] hover:border-white/[0.1]'
                    : 'border-white/[0.02] opacity-60'
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#18181C] border border-white/[0.05] flex items-center justify-center p-2 overflow-hidden shrink-0">
                      {p.logo ? (
                        <img src={p.logo} alt={p.name} className="w-full h-full object-contain" onError={(e) => { (e.target as any).style.display = 'none'; }} />
                      ) : (
                        <Globe className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-white">{p.name}</h3>
                        {p.enabled ? (
                          p.status === 'FAILED' ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                              <AlertTriangle className="w-3 h-3" /> خطأ اتصال
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              <CheckCircle className="w-3 h-3" /> نشط
                            </span>
                          )
                        ) : (
                          <span className="text-[10px] font-bold text-gray-500 bg-gray-500/10 px-2 py-0.5 rounded-full border border-gray-500/10">
                            معطل
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 font-mono mt-1 max-w-xs truncate">{p.url}</p>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onSync(p.id)}
                      disabled={isSyncing || !p.enabled}
                      title="مزامنة وتغذية الآن"
                      className={`p-2 rounded-xl border border-white/[0.05] transition-all ${
                        isSyncing
                          ? 'bg-gray-850 text-gray-500'
                          : p.enabled
                          ? 'bg-[#18181C] text-primary hover:bg-[#23232C]'
                          : 'text-gray-600 bg-transparent cursor-not-allowed'
                      }`}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    </button>

                    <button
                      onClick={() => onToggle(p.id)}
                      title={p.enabled ? 'تعطيل' : 'تفعيل'}
                      className={`p-2 rounded-xl border border-white/[0.05] transition-all ${
                        p.enabled
                          ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                          : 'bg-gray-500/10 text-gray-400 hover:bg-gray-500/20'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => openEditModal(p)}
                      title="تعديل"
                      className="p-2 rounded-xl bg-[#18181C] text-gray-400 border border-white/[0.05] hover:text-white hover:bg-[#23232C] transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm('هل أنت متأكد من حذف هذا المصدر نهائياً؟')) onDelete(p.id);
                      }}
                      title="حذف"
                      className="p-2 rounded-xl bg-[#18181C] text-red-400 border border-white/[0.05] hover:text-red-500 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/[0.03] text-[10px] text-gray-400">
                  <div>
                    <span className="block text-gray-500">البلد / الرياضة</span>
                    <span className="font-bold text-gray-300 mt-0.5 block">{p.country} / {p.sport}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500">المزامنة (دقائق)</span>
                    <span className="font-bold text-gray-300 mt-0.5 block flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-primary" /> كل {p.updateInterval} دقيقة
                    </span>
                  </div>
                  <div>
                    <span className="block text-gray-500">المزامنة الأخيرة</span>
                    <span className="font-bold text-gray-300 mt-0.5 block truncate">
                      {p.lastSync ? formatArabicDate(p.lastSync).split('في')[1] || 'مؤخراً' : 'لم يسبق'}
                    </span>
                  </div>
                </div>

                {p.lastError && p.enabled && (
                  <div className="mt-3 bg-red-500/5 border border-red-500/10 rounded-2xl p-2.5 text-[10px] text-red-400 flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-500" />
                    <div>
                      <span className="font-bold block">خطأ المزامنة الأخير:</span>
                      <p className="mt-0.5 font-mono leading-relaxed">{p.lastError}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-white/[0.08] rounded-3xl max-w-md w-full p-6 text-right" dir="rtl">
            <h3 className="text-md font-black text-white mb-4">
              {editingProvider ? 'تعديل مصدر RSS' : 'إضافة مصدر RSS جديد'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5">اسم المصدر *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال:Hespress الرياضية"
                  className="w-full bg-[#18181C] border border-white/[0.05] rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5">رابط التغذية (Feed URL) *</label>
                <input
                  type="url"
                  required
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://example.com/sport/feed/"
                  className="w-full bg-[#18181C] border border-white/[0.05] rounded-2xl px-4 py-3 text-xs text-left text-white focus:outline-none focus:border-primary transition-all font-mono"
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">رابط شعار المصدر (اختياري)</label>
                  <input
                    type="url"
                    value={formData.logo}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                    placeholder="https://example.com/logo.png"
                    className="w-full bg-[#18181C] border border-white/[0.05] rounded-2xl px-4 py-3 text-xs text-left text-white focus:outline-none focus:border-primary transition-all font-mono"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">معدل التحديث (بالدقائق)</label>
                  <input
                    type="number"
                    min="5"
                    max="1440"
                    value={formData.updateInterval}
                    onChange={(e) => setFormData({ ...formData, updateInterval: Number(e.target.value) })}
                    className="w-full bg-[#18181C] border border-white/[0.05] rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">البلد</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="مصر، المغرب، عالمي"
                    className="w-full bg-[#18181C] border border-white/[0.05] rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">الرياضة / الفئة</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="الدوري الإسباني، أخبار عامة"
                    className="w-full bg-[#18181C] border border-white/[0.05] rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/[0.05]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-transparent hover:bg-white/5 text-gray-400 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-primary hover:bg-[#DDF242] text-black px-6 py-2.5 rounded-2xl text-xs font-black transition-all"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
