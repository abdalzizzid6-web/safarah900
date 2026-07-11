import React, { useState, useEffect } from 'react';
import { Settings, Save, Bell, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface SocialSettingsState {
  publishBreakingNews: boolean;
  useAITitles: boolean;
  useUrlShortener: boolean;
  publishMatchStart: boolean;
  publishGoals: boolean;
  publishMatchResult: boolean;
  notifyOnFailure: boolean;
  notifyTokenExpiry: boolean;
}

const SocialSettings: React.FC = () => {
  const [settings, setSettings] = useState<SocialSettingsState>({
    publishBreakingNews: true,
    useAITitles: false,
    useUrlShortener: true,
    publishMatchStart: true,
    publishGoals: true,
    publishMatchResult: true,
    notifyOnFailure: true,
    notifyTokenExpiry: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/social/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (err) {
      console.error('Failed to fetch settings', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setToast(null);
    try {
      const response = await fetch('/api/social/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (response.ok) {
        setToast({ message: 'تم حفظ إعدادات النشر التلقائي بنجاح!', type: 'success' });
      } else {
        setToast({ message: 'فشل حفظ الإعدادات في قاعدة البيانات', type: 'error' });
      }
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (key: keyof SocialSettingsState) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          الإعدادات العامة للنشر الآلي
        </h2>
        <button 
          onClick={handleSave}
          disabled={isSaving || isLoading}
          className="px-5 py-2.5 bg-primary text-black rounded-lg hover:bg-primary-hover flex items-center gap-2 font-bold text-sm transition-all disabled:opacity-50 shadow-lg shadow-primary/10"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              حفظ التغييرات
            </>
          )}
        </button>
      </div>

      {toast && (
        <div className={`p-4 rounded-xl flex gap-3 text-sm border ${
          toast.type === 'success' 
            ? 'bg-green-900/20 border-green-500/30 text-green-200' 
            : 'bg-red-900/20 border-red-500/30 text-red-200'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-green-500" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          )}
          <p>{toast.message}</p>
        </div>
      )}

      {isLoading ? (
        <div className="bg-surface rounded-xl border border-white/5 p-6 space-y-8 animate-pulse">
          <div className="h-24 bg-surface-elevated rounded-lg" />
          <div className="h-32 bg-surface-elevated rounded-lg" />
          <div className="h-24 bg-surface-elevated rounded-lg" />
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-white/5 p-6 space-y-8">
          {/* Section 1 */}
          <section>
            <h3 className="text-lg font-medium text-white mb-4 border-b border-white/10 pb-2">إعدادات النشر التلقائي للقسم الإخباري</h3>
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={settings.publishBreakingNews}
                  onChange={() => handleToggle('publishBreakingNews')}
                  className="w-5 h-5 rounded border-gray-600 bg-surface-elevated text-primary focus:ring-primary focus:ring-offset-surface mt-0.5" 
                />
                <div>
                  <span className="text-gray-200 group-hover:text-white transition-colors block">نشر الأخبار العاجلة والتقارير الحصرية فوراً</span>
                  <span className="text-xs text-gray-500">مشاركة الأخبار التي تصنف "عاجل" مباشرة على حسابات وقنوات النشر دون انتظار.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={settings.useAITitles}
                  onChange={() => handleToggle('useAITitles')}
                  className="w-5 h-5 rounded border-gray-600 bg-surface-elevated text-primary focus:ring-primary focus:ring-offset-surface mt-0.5" 
                />
                <div>
                  <span className="text-gray-200 group-hover:text-white transition-colors block">استخدام الذكاء الاصطناعي (Gemini Core) لتوليد المنشورات</span>
                  <span className="text-xs text-gray-500">صياغة نص المنشور والوسوم المخصصة بناءً على محتوى الخبر تلقائياً لزيادة التفاعل وجذب الجمهور.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={settings.useUrlShortener}
                  onChange={() => handleToggle('useUrlShortener')}
                  className="w-5 h-5 rounded border-gray-600 bg-surface-elevated text-primary focus:ring-primary focus:ring-offset-surface mt-0.5" 
                />
                <div>
                  <span className="text-gray-200 group-hover:text-white transition-colors block">تفعيل الروابط المختصرة ومقاييس النقرات (URL Shortener)</span>
                  <span className="text-xs text-gray-500">تقصير روابط الأخبار والمباريات تلقائياً لتتبع مصادر الزوار ونسب النقر ومستوى النجاح لكل منصة.</span>
                </div>
              </label>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h3 className="text-lg font-medium text-white mb-4 border-b border-white/10 pb-2">إعدادات النشر التلقائي للمباريات والأهداف المباشرة</h3>
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={settings.publishMatchStart}
                  onChange={() => handleToggle('publishMatchStart')}
                  className="w-5 h-5 rounded border-gray-600 bg-surface-elevated text-primary focus:ring-primary focus:ring-offset-surface mt-0.5" 
                />
                <div>
                  <span className="text-gray-200 group-hover:text-white transition-colors block">الإعلان التلقائي عن انطلاق المباريات</span>
                  <span className="text-xs text-gray-500">نشر بداية صافرة المباراة مع تشكيلة الفريق الأساسية في اللحظة المحددة مسبقاً.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={settings.publishGoals}
                  onChange={() => handleToggle('publishGoals')}
                  className="w-5 h-5 rounded border-gray-600 bg-surface-elevated text-primary focus:ring-primary focus:ring-offset-surface mt-0.5" 
                />
                <div>
                  <span className="text-gray-200 group-hover:text-white transition-colors block">تحديث ونشر الأهداف واللقطات المصورة فور حدوثها</span>
                  <span className="text-xs text-gray-500">التكامل الفوري لنشر الأهداف مع الصور الإحصائية وملخص اللقطة بمجرد ثباتها.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={settings.publishMatchResult}
                  onChange={() => handleToggle('publishMatchResult')}
                  className="w-5 h-5 rounded border-gray-600 bg-surface-elevated text-primary focus:ring-primary focus:ring-offset-surface mt-0.5" 
                />
                <div>
                  <span className="text-gray-200 group-hover:text-white transition-colors block">نشر النتائج النهائية والإحصائيات الشاملة</span>
                  <span className="text-xs text-gray-500">نشر ملخص رقمي ونقاط القوة والضعف والنتيجة الكاملة للمباراة مع صافرة النهاية.</span>
                </div>
              </label>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h3 className="text-lg font-medium text-white mb-4 border-b border-white/10 pb-2">المراقبة وإدارة تنبيهات صلاحية الـ Tokens</h3>
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={settings.notifyOnFailure}
                  onChange={() => handleToggle('notifyOnFailure')}
                  className="w-5 h-5 rounded border-gray-600 bg-surface-elevated text-primary focus:ring-primary focus:ring-offset-surface mt-0.5" 
                />
                <div>
                  <span className="text-gray-200 group-hover:text-white transition-colors block">إرسال إشعارات فورية عبر الإدارة عند فشل النشر</span>
                  <span className="text-xs text-gray-500">الحصول على إشعار في الإدارة المركزية وتفاصيل الخطأ عند حدوث خلل في أحد المنصات.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={settings.notifyTokenExpiry}
                  onChange={() => handleToggle('notifyTokenExpiry')}
                  className="w-5 h-5 rounded border-gray-600 bg-surface-elevated text-primary focus:ring-primary focus:ring-offset-surface mt-0.5" 
                />
                <div>
                  <span className="text-gray-200 group-hover:text-white transition-colors block">تنبيه انتهاء صلاحية رموز التوثيق (Tokens) بـ 7 أيام</span>
                  <span className="text-xs text-gray-500">التحذير المبكر لتحديث رموز الاتصال بالمنصات لتفادي انقطاع تكامل النشر الآلي.</span>
                </div>
              </label>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default SocialSettings;
