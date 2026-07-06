import React from 'react';
import { Link2 } from 'lucide-react';

export const BrokenLinksWidget: React.FC = () => {
  return (
    <div className="p-6 rounded-[2rem] bg-white/[0.01] border border-white/5 space-y-4 leading-relaxed font-semibold text-xs text-gray-400">
      <div className="flex items-start gap-3">
        <Link2 className="text-amber-500 shrink-0 mt-0.5" size={18} />
        <div className="space-y-1">
          <h4 className="text-sm font-black text-white">فلسفة الربط الداخلي بموقع صافرة 90 V2</h4>
          <p className="leading-relaxed">
            تصميم نظام الأرشفة لدينا يعتمد على ربط كل مقال بجدول المباريات والترتيبات والفرق لتسهيل تنقل زواحف جوجل والعناكب الفنية محلياً.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
        <div className="bg-black/30 p-4 rounded-xl space-y-1">
          <span className="text-gray-500 block">Breadcrumb Navigation</span>
          <span className="text-emerald-400 font-bold">نشطة 🟢</span>
        </div>

        <div className="bg-black/30 p-4 rounded-xl space-y-1">
          <span className="text-gray-500 block">Category links matching</span>
          <span className="text-emerald-400 font-bold">نشطة 🟢</span>
        </div>

        <div className="bg-black/30 p-4 rounded-xl space-y-1">
          <span className="text-gray-500 block">Relative router links</span>
          <span className="text-emerald-400 font-bold">نشطة 🟢</span>
        </div>
      </div>
    </div>
  );
};
