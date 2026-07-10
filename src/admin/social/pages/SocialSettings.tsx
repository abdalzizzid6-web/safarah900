import React from 'react';
import { Settings, Save, Bell, RefreshCw } from 'lucide-react';

const SocialSettings: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          الإعدادات العامة
        </h2>
        <button className="px-4 py-2 bg-primary text-black rounded-lg hover:bg-primary-hover flex items-center gap-2 font-medium">
          <Save className="w-4 h-4" />
          حفظ التغييرات
        </button>
      </div>

      <div className="bg-surface rounded-xl border border-white/5 p-6 space-y-8">
        {/* Section 1 */}
        <section>
          <h3 className="text-lg font-medium text-white mb-4 border-b border-white/10 pb-2">إعدادات النشر التلقائي (الأخبار)</h3>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-5 h-5 rounded border-gray-600 bg-surface-elevated text-primary focus:ring-primary focus:ring-offset-surface" />
              <span className="text-gray-300">نشر الأخبار العاجلة فوراً</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-5 h-5 rounded border-gray-600 bg-surface-elevated text-primary focus:ring-primary focus:ring-offset-surface" />
              <span className="text-gray-300">استخدام الذكاء الاصطناعي لتوليد العناوين</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-5 h-5 rounded border-gray-600 bg-surface-elevated text-primary focus:ring-primary focus:ring-offset-surface" />
              <span className="text-gray-300">إضافة رابط مختصر (URL Shortener)</span>
            </label>
          </div>
        </section>

        {/* Section 2 */}
        <section>
          <h3 className="text-lg font-medium text-white mb-4 border-b border-white/10 pb-2">إعدادات المباريات المباشرة</h3>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-5 h-5 rounded border-gray-600 bg-surface-elevated text-primary focus:ring-primary focus:ring-offset-surface" />
              <span className="text-gray-300">نشر بداية المباراة</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-5 h-5 rounded border-gray-600 bg-surface-elevated text-primary focus:ring-primary focus:ring-offset-surface" />
              <span className="text-gray-300">نشر الأهداف تلقائياً مع فيديو أو صورة</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-5 h-5 rounded border-gray-600 bg-surface-elevated text-primary focus:ring-primary focus:ring-offset-surface" />
              <span className="text-gray-300">نشر النتيجة النهائية</span>
            </label>
          </div>
        </section>

        {/* Section 3 */}
        <section>
          <h3 className="text-lg font-medium text-white mb-4 border-b border-white/10 pb-2">التنبيهات والمراقبة</h3>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-5 h-5 rounded border-gray-600 bg-surface-elevated text-primary focus:ring-primary focus:ring-offset-surface" />
              <span className="text-gray-300">تنبيه عند فشل النشر</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-5 h-5 rounded border-gray-600 bg-surface-elevated text-primary focus:ring-primary focus:ring-offset-surface" />
              <span className="text-gray-300">تنبيه قبل انتهاء صلاحية رموز التوثيق (Tokens) بـ 7 أيام</span>
            </label>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SocialSettings;
