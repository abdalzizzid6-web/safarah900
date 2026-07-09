import React, { useCallback } from 'react';
import { Database, Save, X } from 'lucide-react';
import { ApiProvider } from '../types/api';

interface ConnectionDetailsDialogProps {
  isOpen: boolean;
  provider: Partial<ApiProvider> | null;
  actionLoading: string | null;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  onChange: (updated: Partial<ApiProvider>) => void;
}

export const ConnectionDetailsDialog: React.FC<ConnectionDetailsDialogProps> = React.memo(({
  isOpen,
  provider,
  actionLoading,
  onClose,
  onSave,
  onChange
}) => {
  if (!isOpen || !provider) return null;

  const categoriesList = [
    { id: 'matches', label: 'مباريات (Matches)' },
    { id: 'leagues', label: 'بطولات (Leagues)' },
    { id: 'teams', label: 'فرق (Teams)' },
    { id: 'players', label: 'لاعبين (Players)' },
    { id: 'news', label: 'أخبار (News)' },
    { id: 'predictions', label: 'توقعات (Predictions)' },
    { id: 'live_stream', label: 'بث مباشر (Live Stream)' },
    { id: 'ai_analysis', label: 'تحليل AI (AI Analysis)' }
  ];

  const handleToggleCategory = (catId: string) => {
    let currentCats = Array.isArray(provider.categories) 
      ? [...provider.categories] 
      : ['matches', 'leagues', 'teams', 'players', 'news', 'predictions', 'live_stream', 'ai_analysis'];
    
    if (currentCats.includes(catId)) {
      currentCats = currentCats.filter(c => c !== catId);
    } else {
      currentCats.push(catId);
    }
    onChange({ ...provider, categories: currentCats });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#121214] border border-gray-800 rounded-2xl max-w-xl w-full p-6 space-y-6 relative animate-scale-up" dir="rtl">
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <h3 className="font-extrabold text-lg text-gray-100 flex items-center gap-2">
            <Database className="w-5 h-5 text-[#FF003C]" />
            {provider.id ? 'تعديل حزمة بيانات المفتاح' : 'تسجيل مفتاح رياضي جديد في المجمع'}
          </h3>
          <button 
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-white text-xl cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1 font-bold">اسم المفتاح (معرف مميز) *</label>
              <input
                type="text"
                required
                value={provider.name || ''}
                onChange={(e) => onChange({ ...provider, name: e.target.value })}
                placeholder="مثال: المفتاح الأساسي رابيد"
                className="w-full bg-[#1A1A1D] border border-gray-800 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-[#FF003C] transition"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1 font-bold">المزود الرياضي *</label>
              <select
                value={provider.provider || 'API-Football'}
                onChange={(e: any) => onChange({ ...provider, provider: e.target.value })}
                className="w-full bg-[#1A1A1D] border border-gray-800 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-[#FF003C] transition cursor-pointer"
              >
                <option value="API-Football">API-Football</option>
                <option value="SportMonks">SportMonks</option>
                <option value="TheSportsDB">TheSportsDB</option>
                <option value="Custom">Custom Server</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1 font-bold">قيمة المفتاح السرية (API Key) *</label>
            <input
              type="text"
              required
              value={provider.key || ''}
              onChange={(e) => onChange({ ...provider, key: e.target.value })}
              placeholder="أدخل الهاش السري الخاص بالمزود"
              className="w-full bg-[#1A1A1D] border border-gray-800 rounded-lg py-2 px-3 text-sm text-white font-mono focus:outline-none focus:border-[#FF003C] transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1 font-bold">الكوتا اليومية المسموحة *</label>
              <input
                type="number"
                required
                value={provider.quotaDaily !== undefined ? provider.quotaDaily : 100}
                onChange={(e) => onChange({ ...provider, quotaDaily: Number(e.target.value) })}
                className="w-full bg-[#1A1A1D] border border-gray-800 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-[#FF003C] transition font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1 font-bold">الكوتا الشهرية المسموحة *</label>
              <input
                type="number"
                required
                value={provider.quotaMonthly !== undefined ? provider.quotaMonthly : 3000}
                onChange={(e) => onChange({ ...provider, quotaMonthly: Number(e.target.value) })}
                className="w-full bg-[#1A1A1D] border border-gray-800 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-[#FF003C] transition font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1 font-bold">فئة دور الأولوية *</label>
              <select
                value={provider.priorityType || 'primary'}
                onChange={(e) => onChange({ ...provider, priorityType: e.target.value as any })}
                className="w-full bg-[#1A1A1D] border border-gray-800 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-[#FF003C] transition cursor-pointer"
              >
                <option value="primary">Primary Provider (الأساسي الأول)</option>
                <option value="secondary">Secondary Provider (الاحتياطي الثاني)</option>
                <option value="fallback">Fallback Provider (الاحتياطي الطارئ الثالث)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1 font-bold">ترتيب الأولوية الرقمي (أرقام أصغر = تسبق) *</label>
              <input
                type="number"
                required
                value={provider.priority !== undefined ? provider.priority : 1}
                onChange={(e) => onChange({ ...provider, priority: Number(e.target.value) })}
                className="w-full bg-[#1A1A1D] border border-gray-800 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-[#FF003C] transition font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1 font-bold">تكلفة الطلب الواحد (USD) *</label>
              <input
                type="number"
                step="0.00001"
                required
                value={provider.costPerCall !== undefined ? provider.costPerCall : 0}
                onChange={(e) => onChange({ ...provider, costPerCall: Number(e.target.value) })}
                className="w-full bg-[#1A1A1D] border border-gray-800 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-[#FF003C] transition font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1 font-bold">حالة تفعيل المفتاح</label>
              <div className="flex items-center h-10">
                <input
                  type="checkbox"
                  id="active"
                  checked={provider.active !== false}
                  onChange={(e) => onChange({ ...provider, active: e.target.checked })}
                  className="w-5 h-5 rounded text-[#FF003C] bg-gray-900 border-gray-800 focus:ring-[#FF003C] cursor-pointer"
                />
                <label htmlFor="active" className="text-xs text-gray-300 mr-2 cursor-pointer">نشط وقابل للاستخدام فوراً</label>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-2 font-bold">الأقسام الرياضية المسموح باستخدام هذا المفتاح فيها *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-[#161619] border border-gray-800 p-3 rounded-lg">
              {categoriesList.map((cat) => {
                const isChecked = Array.isArray(provider.categories) 
                  ? provider.categories.includes(cat.id) 
                  : true;

                return (
                  <label key={cat.id} className="flex items-center gap-2 text-xs text-gray-300 hover:text-white cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleCategory(cat.id)}
                      className="w-4 h-4 rounded text-[#FF003C] bg-gray-900 border-gray-800 focus:ring-[#FF003C] cursor-pointer"
                    />
                    <span>{cat.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1 font-bold">الدوريات المسموحة (قم بالفصل بينها بفاصلة)</label>
            <input
              type="text"
              value={provider.allowedLeagues?.join(', ') || ''}
              onChange={(e) => onChange({ ...provider, allowedLeagues: e.target.value.split(',').map(l => l.trim()).filter(l => l) })}
              placeholder="مثال: Premier League, La Liga, Champions League"
              className="w-full bg-[#1A1A1D] border border-gray-800 rounded-lg py-2 px-3 text-sm text-white font-mono focus:outline-none focus:border-[#FF003C] transition"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1 font-bold">سيرفر الاستدعاء الاحتياطي أو المخصص (Fallback Endpoint / URL)</label>
            <input
              type="text"
              value={provider.fallbackProvider || ''}
              onChange={(e) => onChange({ ...provider, fallbackProvider: e.target.value })}
              placeholder="مثال: https://custom-sports-api.com/v3"
              className="w-full bg-[#1A1A1D] border border-gray-800 rounded-lg py-2 px-3 text-sm text-white font-mono focus:outline-none focus:border-[#FF003C] transition"
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-gray-900 border border-gray-800 hover:bg-gray-800 rounded-lg text-sm text-gray-400 transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={actionLoading === 'save-provider'}
              className="px-6 py-2 bg-[#FF003C] hover:bg-[#D00030] text-black font-bold rounded-lg text-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading === 'save-provider' ? <X className="animate-spin w-4 h-4 text-black" /> : <Save className="w-4 h-4" />}
              حفظ ومزامنة المفتاح
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

ConnectionDetailsDialog.displayName = 'ConnectionDetailsDialog';
export default ConnectionDetailsDialog;
