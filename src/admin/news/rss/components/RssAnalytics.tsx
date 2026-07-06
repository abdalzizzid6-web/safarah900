import React from 'react';
import { RssAnalyticsStats, RssProvider } from '../types';
import { BarChart3, Shield, RefreshCw, Layers, CheckCircle2, AlertOctagon, Heart, Radio } from 'lucide-react';

interface Props {
  stats: RssAnalyticsStats | null;
  providers: RssProvider[];
  loading: boolean;
  onRefresh: () => void;
}

export function RssAnalytics({ stats, providers, loading, onRefresh }: Props) {
  if (loading || !stats) {
    return (
      <div className="flex justify-center items-center py-20">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Calculate percentages safely
  const publishedPercent = stats.totalImported > 0 ? Math.round((stats.published / stats.totalImported) * 100) : 0;
  const reviewPercent = stats.totalImported > 0 ? Math.round((stats.pendingReview / stats.totalImported) * 100) : 0;
  const rejectedPercent = stats.totalImported > 0 ? Math.round((stats.rejected / stats.totalImported) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top action */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-black text-white">تحليلات وبث المزامنة لـ RSS</h2>
          <p className="text-xs text-gray-400 mt-1">إحصائيات كاملة لحالة تغذية الأخبار ومعدلات قبول المواد والمحافظة على المفاتيح</p>
        </div>
        <button
          onClick={onRefresh}
          className="p-2.5 rounded-xl bg-[#18181C] hover:bg-[#23232C] text-gray-400 hover:text-white border border-white/[0.05] transition-all flex items-center gap-2 text-xs font-bold"
        >
          <RefreshCw className="w-3.5 h-3.5" /> تحديث التحليلات
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-[#121214] border border-white/[0.05] rounded-3xl p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-500 block">إجمالي المقالات المستوردة</span>
            <span className="text-xl font-black text-white mt-1.5 block font-mono">{stats.totalImported}</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#18181C] border border-white/[0.05] flex items-center justify-center text-primary">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-[#121214] border border-white/[0.05] rounded-3xl p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-500 block">قيد المراجعة والتدقيق</span>
            <span className="text-xl font-black text-white mt-1.5 block font-mono">{stats.pendingReview}</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500">
            <Radio className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-[#121214] border border-white/[0.05] rounded-3xl p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-500 block">معدل نجاح الاتصال بالمزودين</span>
            <span className="text-xl font-black text-emerald-400 mt-1.5 block font-mono">{stats.syncSuccessRate}%</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-[#121214] border border-white/[0.05] rounded-3xl p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-500 block">نسبة التكرار الممنوعة</span>
            <span className="text-xl font-black text-red-400 mt-1.5 block font-mono">{stats.duplicateRate}%</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-400">
            <AlertOctagon className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribution Card */}
        <div className="lg:col-span-1 bg-[#121214] border border-white/[0.05] rounded-3xl p-5 space-y-5">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-black text-white">توزيع المقالات وحالة الفلترة</h3>
          </div>

          <div className="space-y-4">
            {/* Stat Item 1 */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-gray-400">منشور ومثبت بالموقع ({stats.published})</span>
                <span className="font-bold text-emerald-400 font-mono">{publishedPercent}%</span>
              </div>
              <div className="w-full bg-[#18181C] h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${publishedPercent}%` }}></div>
              </div>
            </div>

            {/* Stat Item 2 */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-gray-400">بانتظار المراجعة والتدقيق ({stats.pendingReview})</span>
                <span className="font-bold text-amber-500 font-mono">{reviewPercent}%</span>
              </div>
              <div className="w-full bg-[#18181C] h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${reviewPercent}%` }}></div>
              </div>
            </div>

            {/* Stat Item 3 */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-gray-400">مرفوض مكرر / محتوى ضعيف ({stats.rejected})</span>
                <span className="font-bold text-red-500 font-mono">{rejectedPercent}%</span>
              </div>
              <div className="w-full bg-[#18181C] h-2 rounded-full overflow-hidden">
                <div className="bg-red-500 h-full rounded-full" style={{ width: `${rejectedPercent}%` }}></div>
              </div>
            </div>
          </div>

          <div className="bg-[#18181C]/50 rounded-2xl p-4 text-[10px] text-gray-500 leading-relaxed border border-white/[0.02]">
            <span className="font-bold text-gray-400 block mb-1">💡 فحص التكرارات التلقائي:</span>
            يقوم محرك التصفية بمقارنة الرابط التعريفي والرمز الفريد (GUID) ونسبة تطابق الأحرف في العناوين لضمان عدم تمرير مقالات مكررة نهائياً.
          </div>
        </div>

        {/* Health status list */}
        <div className="lg:col-span-2 bg-[#121214] border border-white/[0.05] rounded-3xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-emerald-500" />
            <h3 className="text-xs font-black text-white">سلامة واستقرار مصادر التغذية (Provider Health)</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="border-b border-white/[0.03] text-[10px] text-gray-500">
                  <th className="pb-3 font-bold">اسم المصدر</th>
                  <th className="pb-3 font-bold text-center">الحالة</th>
                  <th className="pb-3 font-bold text-center">التردد</th>
                  <th className="pb-3 font-bold text-left">ملاحظات الأخطاء الأخيرة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02] text-xs">
                {providers.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.01] transition-all">
                    <td className="py-3 font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      {p.name}
                    </td>
                    <td className="py-3 text-center">
                      {p.enabled ? (
                        p.status === 'FAILED' ? (
                          <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/15">
                            فشل اتصال
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/15">
                            سليم
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] font-bold text-gray-500 bg-gray-500/10 px-2 py-0.5 rounded-full border border-gray-500/10">
                          معطل
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-center font-mono text-[10px] text-gray-400">كل {p.updateInterval} د</td>
                    <td className="py-3 text-left font-mono text-[9px] text-red-400/80 max-w-xs truncate" title={p.lastError || ''}>
                      {p.lastError || <span className="text-gray-600">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
