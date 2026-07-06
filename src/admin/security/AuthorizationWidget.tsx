import React from 'react';
import { LockKeyhole, Play } from 'lucide-react';

export default function AuthorizationWidget({ handleSimulateValidation, simulatingType }: any) {
  return (
    <div className="bg-[#111113] hover:bg-[#151518] border border-amber-500/10 hover:border-amber-500/30 p-4 rounded-2xl transition-all duration-300">
      <div className="flex items-center gap-2.5 mb-4">
        <LockKeyhole size={18} className="text-amber-400" />
        <h3 className="text-sm font-bold text-white">التحقق الهيكلي (Authorization)</h3>
      </div>
      <p className="text-[11px] text-gray-400 mb-4 leading-relaxed">
        إرسال مدخلات تالفة أو فارغة لمسارات الذكاء الاصطناعي لاختبار قوة مُعالج البيانات وموثوقية قواعد Zod.
      </p>
      <button
        onClick={handleSimulateValidation}
        disabled={!!simulatingType}
        className="w-full flex items-center justify-between bg-[#151518] hover:bg-amber-500/10 border border-white/5 p-3 rounded-xl transition-all duration-300 group disabled:opacity-50 disabled:pointer-events-none"
      >
        <span className="text-amber-400 font-bold text-xs">حقن حقول تالفة</span>
        <div className="bg-amber-500/10 text-amber-400 p-2 rounded-lg group-hover:scale-105 transition-transform">
          <Play size={12} fill="currentColor" />
        </div>
      </button>
    </div>
  );
}
