import React from 'react';
import { ShieldAlert, Play } from 'lucide-react';

export default function AuthenticationWidget({ handleSimulateUnauthorized, simulatingType }: any) {
  return (
    <div className="bg-[#111113] hover:bg-[#151518] border border-rose-500/10 hover:border-rose-500/30 p-4 rounded-2xl transition-all duration-300">
      <div className="flex items-center gap-2.5 mb-4">
        <ShieldAlert size={18} className="text-rose-400" />
        <h3 className="text-sm font-bold text-white">المصادقة (Authentication)</h3>
      </div>
      <p className="text-[11px] text-gray-400 mb-4 leading-relaxed">
        محاكاة الوصول إلى الإعدادات المحمية ومسارات التشخيص السحابية دون تضمين مفاتيح التوثيق (Bearer Token).
      </p>
      <button
        onClick={handleSimulateUnauthorized}
        disabled={!!simulatingType}
        className="w-full flex items-center justify-between bg-[#151518] hover:bg-rose-500/10 border border-white/5 p-3 rounded-xl transition-all duration-300 group disabled:opacity-50 disabled:pointer-events-none"
      >
        <span className="text-rose-400 font-bold text-xs">تجاوز المصادقة</span>
        <div className="bg-rose-500/10 text-rose-400 p-2 rounded-lg group-hover:scale-105 transition-transform">
          <Play size={12} fill="currentColor" />
        </div>
      </button>
    </div>
  );
}
