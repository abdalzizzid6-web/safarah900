import React from 'react';
import { Lock, RefreshCw } from 'lucide-react';

export default function SecurityHeader({ fetchSecurityAudits, loading }: { fetchSecurityAudits: () => void, loading: boolean }) {
  return (
    <div className="max-w-7xl mx-auto mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-400 border border-amber-500/25 px-2.5 py-1 rounded-full text-xs font-semibold mb-3">
            <Lock size={12} />
            <span>جدار الحماية الفولاذي نشط</span>
          </div>
          <h1 className="text-3xl font-black text-white leading-tight">الأمان والرقابة والتحصين السحابي</h1>
          <p className="text-gray-400 text-sm mt-1">تتبع التدقيق الأمني، التصدي لثغرات الـ SSRF والمصادقة الأمنية لجميع مزودي الموارد.</p>
        </div>
        
        <button 
          onClick={fetchSecurityAudits}
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 py-2 rounded-xl transition-all duration-300 font-bold text-sm"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>تحديث السجلات</span>
        </button>
      </div>
    </div>
  );
}
