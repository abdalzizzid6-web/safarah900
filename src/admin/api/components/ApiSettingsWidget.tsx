import React from 'react';
import { Route, Check } from 'lucide-react';
import { ApiRouting } from '../types/api';

interface ApiSettingsWidgetProps {
  routing: ApiRouting | undefined;
  actionLoading: string | null;
  onSaveRouting: (category: keyof ApiRouting, provider: string) => void;
}

export const ApiSettingsWidget: React.FC<ApiSettingsWidgetProps> = React.memo(({
  routing,
  actionLoading,
  onSaveRouting
}) => {
  const sections = [
    { key: 'worldCup' as const, label: '🏆 مباريات كأس العالم', desc: 'بطولات الفيفا العالمية والنهائيات' },
    { key: 'premierLeague' as const, label: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 الدوري الإنجليزي', desc: 'البريميرليغ وكؤوس الأندية الإنجليزية' },
    { key: 'arabMatches' as const, label: '🇸🇦 البطولات والمباريات العربية', desc: 'الدوريات والبطولات العربية والآسيوية' },
    { key: 'news' as const, label: '📰 الأخبار والتقارير الرياضية', desc: 'مزامنة أخبار RSS وجلب البيانات الصحفية' },
    { key: 'players' as const, label: '🏃‍♂️ إحصائيات اللاعبين', desc: 'الكرت التعريفي والأرقام الفردية للاعبين' },
    { key: 'teams' as const, label: '🛡️ بيانات وتفاصيل الفرق', desc: 'الشعارات، الملاعب والتشكيلات التاريخية' },
    { key: 'stats' as const, label: '📊 الأحداث والإحصائيات الحية', desc: 'أحداث المباراة المباشرة والتشكيلات' },
    { key: 'streaming' as const, label: '📺 قنوات البث الحي', desc: 'سيرفرات وقنوات النقل التلفزيوني المباشر' }
  ];

  return (
    <div className="bg-[#121214] border border-gray-800 rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2 border-b border-gray-800 pb-4">
        <Route className="w-6 h-6 text-[#FF003C]" />
        <div>
          <h3 className="font-bold text-lg text-gray-200">مركز توجيه البيانات الذكي (Smart Routing Center)</h3>
          <p className="text-xs text-gray-400 mt-1">حدد مزود الخدمة المسؤول عن تزويد البيانات لكل قسم رياضي بشكل منفصل دون كتابة سطر كود واحد.</p>
        </div>
      </div>

      {routing ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          {sections.map((section) => {
            const currentProvider = routing[section.key];
            const isSaving = actionLoading === `route-${section.key}`;

            return (
              <div key={section.key} className="bg-gray-900/60 border border-gray-800/80 p-4 rounded-xl space-y-3 flex flex-col justify-between hover:border-gray-700 transition">
                <div className="space-y-1">
                  <span className="font-bold text-sm text-gray-100 block">{section.label}</span>
                  <span className="text-xs text-gray-400 block leading-relaxed">{section.desc}</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">مزود الخدمة النشط</label>
                  <select
                    value={currentProvider || 'API-Football'}
                    disabled={isSaving}
                    onChange={(e) => onSaveRouting(section.key, e.target.value)}
                    className="w-full bg-[#1A1A1D] border border-gray-800 rounded-lg py-1.5 px-2.5 text-xs text-gray-200 focus:outline-none focus:border-[#FF003C] transition cursor-pointer"
                  >
                    <option value="API-Football">API-Football (الأساسي)</option>
                    <option value="SportMonks">SportMonks (المدفوع)</option>
                    <option value="TheSportsDB">TheSportsDB (المفتوح)</option>
                    <option value="Custom">Custom Server (مزود مخصص)</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-4 text-center text-gray-500">جاري تحميل قواعد التوجيه...</div>
      )}
    </div>
  );
});

ApiSettingsWidget.displayName = 'ApiSettingsWidget';
export default ApiSettingsWidget;
