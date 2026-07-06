import React, { useState } from 'react';
import { useBreakingNews } from '../hooks/useBreakingNews';
import { Radio, AlertTriangle, Trash2, Plus, Calendar, Eye, EyeOff } from 'lucide-react';

export function BreakingSelector() {
  const { breakingFlashes, loading, addBreakingFlash, toggleFlashActive, deleteFlash } = useBreakingNews();
  const [text, setText] = useState('');
  const [link, setLink] = useState('');
  const [duration, setDuration] = useState(24);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const success = await addBreakingFlash(text, link, duration);
    if (success) {
      setText('');
      setLink('');
      setDuration(24);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#121214] border border-white/[0.05] rounded-3xl p-6 md:p-8 space-y-8 text-right">
      <div className="flex items-center gap-2 flex-row-reverse border-b border-white/[0.05] pb-4">
        <Radio className="w-6 h-6 text-red-500 animate-pulse" />
        <div>
          <h3 className="text-xl font-black text-white">شريط الأخبار العاجلة والتحذيرات السريعة</h3>
          <p className="text-xs text-gray-500 mt-0.5">أدخل نصوصاً عاجلة تظهر أعلى شاشات التطبيق فوراً لجميع المستخدمين</p>
        </div>
      </div>

      {/* Add new breaking form */}
      <form onSubmit={handleAdd} className="bg-[#18181C] border border-white/[0.05] p-5 rounded-2xl space-y-4">
        <h4 className="font-bold text-white text-sm">بث خبر عاجل جديد</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-1">
            <label className="block text-xs font-bold text-gray-400">نص الخبر العاجل</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full bg-[#121214] border border-white/[0.05] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
              placeholder="مثال: عاجل.. قرعة كأس العالم ٢٠٢٦ تقام الليلة في لوس أنجلوس بمشاركة منتخبات عربية"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-400">مدة البقاء التلقائي (بالساعات)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full bg-[#121214] border border-white/[0.05] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
              min={1}
              max={168}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-400">الرابط الموجه للخبر (اختياري)</label>
          <input
            type="text"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="w-full bg-[#121214] border border-white/[0.05] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none text-left font-mono"
            placeholder="https://korea90.xyz/news/slug"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" /> بث الومضة العاجلة
          </button>
        </div>
      </form>

      {/* List of active breaking flashes */}
      <div className="space-y-3">
        <h4 className="font-bold text-white text-sm">الأخبار العاجلة المسجلة والمفعلة حالياً</h4>
        
        {breakingFlashes.length === 0 ? (
          <p className="text-gray-500 text-xs text-center py-4">لا توجد ومضات عاجلة نشطة في الوقت الراهن</p>
        ) : (
          <div className="space-y-2">
            {breakingFlashes.map((flash) => {
              const expires = flash.expiresAt ? new Date(flash.expiresAt).toLocaleString('ar-EG') : 'غير محدد';

              return (
                <div key={flash.id} className={`p-4 rounded-xl border flex justify-between items-center flex-row-reverse transition-all ${flash.active ? 'bg-red-500/5 border-red-500/20' : 'bg-white/2 border-white/[0.03]'}`}>
                  <div className="space-y-1">
                    <p className="text-xs font-black text-white">{flash.text}</p>
                    <div className="flex items-center gap-3 text-[10px] text-gray-500 flex-row-reverse">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> انتهاء الصلاحية: {expires}</span>
                      {flash.link && <span className="bg-red-500/10 text-red-400 px-1.5 py-0.2 rounded text-[9px] font-bold">رابط متصل</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleFlashActive(flash.id)}
                      className={`p-2 rounded-lg border transition-all ${flash.active ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-white/5 border-white/[0.05] text-gray-500'}`}
                      title={flash.active ? 'إلغاء تفعيل البث' : 'تفعيل البث'}
                    >
                      {flash.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => deleteFlash(flash.id)}
                      className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/20 transition-all"
                      title="حذف نهائي"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
