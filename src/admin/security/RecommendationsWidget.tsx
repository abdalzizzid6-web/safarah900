import React from 'react';
import { Lightbulb } from 'lucide-react';

export default function RecommendationsWidget() {
  return (
    <div className="bg-[#111113] border border-white/5 p-4 rounded-2xl flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-yellow-500/10 text-yellow-400 rounded-lg">
          <Lightbulb size={18} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">التوصيات الأمنية</h3>
          <p className="text-[10px] text-gray-500">تم مراجعة سجلات الاتصال بنجاح. لا توجد إجراءات إضافية مطلوبة في الوقت الحالي.</p>
        </div>
      </div>
      <div className="px-2.5 py-1 bg-gray-500/10 text-gray-400 text-[10px] font-bold rounded-lg border border-gray-500/20">
        تم الفحص
      </div>
    </div>
  );
}
