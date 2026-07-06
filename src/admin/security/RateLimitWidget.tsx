import React from 'react';
import { Timer } from 'lucide-react';

export default function RateLimitWidget() {
  return (
    <div className="bg-[#111113] border border-white/5 p-4 rounded-2xl flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-orange-500/10 text-orange-400 rounded-lg">
          <Timer size={18} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">الحد الترددي (Rate Limit)</h3>
          <p className="text-[10px] text-gray-500">تم تنشيط قيود حماية الواجهات ضد الاستخدام الكثيف وهجمات DDOS.</p>
        </div>
      </div>
      <div className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-500/20">
        نشط
      </div>
    </div>
  );
}
