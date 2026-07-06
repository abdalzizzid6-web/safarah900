import React, { useState, useEffect } from 'react';
import { newsRepositoryV2, NewsSettings } from '../../../core/repository/NewsRepositoryV2';
import { Settings, ShieldCheck, CheckCircle2 } from 'lucide-react';

export function NewsSettingsPage() {
  const [readingSpeed, setReadingSpeed] = useState(200);
  const [autoSitemap, setAutoSitemap] = useState(true);
  const [minViewsForPopular, setMinViewsForPopular] = useState(50);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const settings = await newsRepositoryV2.getSettings();
        setReadingSpeed(settings.readingSpeed);
        setAutoSitemap(settings.autoSitemap);
        setMinViewsForPopular(settings.minViewsForPopular);
      } catch (e) {
        console.error('Error loading general news settings:', e);
      }
    };
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      await newsRepositoryV2.updateSettings({
        readingSpeed,
        autoSitemap,
        minViewsForPopular,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving news settings:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#121214] border border-white/[0.05] rounded-3xl p-6 md:p-8 space-y-6 text-right max-w-3xl mx-auto">
      <div className="flex items-center gap-2 flex-row-reverse border-b border-white/[0.05] pb-4">
        <Settings className="w-6 h-6 text-primary" />
        <div>
          <h3 className="text-xl font-black text-white">إعدادات النشر والتحرير العامة</h3>
          <p className="text-xs text-gray-500 mt-0.5">ضبط الخوارزميات ومؤشرات الأداء التلقائية للمقالات الإخبارية</p>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-xs flex items-center gap-2 flex-row-reverse font-bold">
          <CheckCircle2 className="w-4 h-4" /> تم حفظ الإعدادات بنجاح في قاعدة البيانات
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Reading Speed configuration */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-400">معدل سرعة القراءة (كلمة في الدقيقة)</label>
            <input
              type="number"
              value={readingSpeed}
              onChange={(e) => setReadingSpeed(Number(e.target.value))}
              className="w-full bg-[#18181C] border border-white/[0.05] rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
              required
              min={50}
              max={1000}
            />
            <span className="block text-[10px] text-gray-500">يستخدم تلقائياً لتقدير زمن قراءة المقال</span>
          </div>

          {/* Min Views for popular list tagger */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-400">الحد الأدنى للمشاهدات لوسم "رائج"</label>
            <input
              type="number"
              value={minViewsForPopular}
              onChange={(e) => setMinViewsForPopular(Number(e.target.value))}
              className="w-full bg-[#18181C] border border-white/[0.05] rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
              required
              min={1}
            />
            <span className="block text-[10px] text-gray-500">الخبر الذي يتجاوز هذا العدد يتم تلوينه تلقائياً</span>
          </div>
        </div>

        {/* Auto sitemap config */}
        <div className="flex items-center justify-between bg-[#18181C] border border-white/[0.05] p-4 rounded-xl flex-row-reverse">
          <div>
            <span className="block text-xs font-bold text-gray-200">تضمين الأخبار في خرائط جوجل Sitemap تلقائياً</span>
            <span className="block text-[10px] text-gray-500 mt-1">يضمن التحديث المستمر لأرشفة الأخبار الجديدة فور نشرها</span>
          </div>
          <input
            type="checkbox"
            checked={autoSitemap}
            onChange={(e) => setAutoSitemap(e.target.checked)}
            className="w-4 h-4 accent-primary"
          />
        </div>

        {/* Save button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary hover:bg-opacity-90 text-black px-6 py-3 rounded-xl text-xs font-black transition-all"
          >
            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </div>
      </form>
    </div>
  );
}
export default NewsSettingsPage;
