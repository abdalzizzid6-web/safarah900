import React from 'react';
import { Database, HardDrive, RefreshCw } from 'lucide-react';

export function WcSourcesTab({ providerSettings, customSyncUrl, setCustomSyncUrl, runSync, loading }: any) {
  return (
    <div className="space-y-6">
      <h3 className="text-xs font-black text-[#f3c623] uppercase">مزامنة البيانات الأساسية للبطولة</h3>
      
      <div className="bg-[#0f0f12] border border-white/5 p-5 rounded-2xl max-w-xl space-y-4">
        <div>
          <p className="text-xs text-gray-400 font-bold mb-4 leading-relaxed">
            استيراد المباريات والمنتخبات من مزود API الرئيسي المعتمد (Football-Data أو SportMonks). 
            المزامنة هنا تجلب التواريخ الأساسية والنتائج الرسمية من قاعدة البيانات الخارجية وتقوم بحفظها بشكل دائم في Firestore لتخفيف الاستهلاك.
          </p>
          
          <div className="bg-black border border-white/5 p-4 rounded-xl flex items-start gap-3">
            <HardDrive className="w-5 h-5 text-gray-500 mt-1" />
            <div>
              <span className="text-xs font-bold text-white block">المزود الحالي: {providerSettings?.provider === 'SPORTMONKS' ? 'SportMonks' : 'API-Football'}</span>
              <span className="text-[10px] text-gray-400">نطاق الاستيراد سيتم تحديده من سيرفر Node</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-white/5">
          <label className="text-[10px] text-gray-400 font-bold block mb-2">رابط مزامنة مخصص (اختياري للاختبار والديمو JSON)</label>
          <input 
            type="text" 
            value={customSyncUrl}
            onChange={(e) => setCustomSyncUrl(e.target.value)}
            className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs text-white font-mono mb-4"
            placeholder="اتركه فارغاً لاستخدام API الرسمي المعتمد للمزود..."
          />

          <button 
            disabled={loading}
            onClick={() => runSync(customSyncUrl)}
            className="w-full py-3 bg-[#d4af37] text-black font-black rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-amber-400 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="animate-spin w-4 h-4" /> : <Database className="w-4 h-4" />}
            {loading ? 'جاري استيراد البيانات...' : 'بدء مزامنة وحفظ مباريات كأس العالم'}
          </button>
        </div>
      </div>
    </div>
  );
}
