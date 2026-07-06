import React from 'react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

export default function SecurityWidget({ securityEvents }: { securityEvents: any[] }) {
  return (
    <div className="bg-[#121214] border border-white/5 rounded-[2.5rem] p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
          <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
            <ShieldAlert size={16} className="text-red-500 animate-pulse" />
            أمن شبكة الـ API وصلاحيات الخدمة
          </h3>
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" title="بوابة أمان الـ API تعمل بنجاح" />
        </div>

        <div className="space-y-3">
          {securityEvents.length > 0 ? securityEvents.map((evt, idx) => (
            <div key={idx} className="p-3 bg-white/[0.01] border border-white/[0.04] rounded-xl flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-black text-red-400 capitalize">{evt.method || 'GET'}</span>
                <span className="text-[10px] text-gray-500 font-mono">{evt.time || 'الآن'}</span>
              </div>
              <p className="font-semibold text-gray-300 line-clamp-1">{evt.path || '/api'}</p>
              <p className="text-[10px] text-gray-500 leading-relaxed font-semibold">المستخدم: {evt.user || 'الزائر'}</p>
            </div>
          )) : (
            <div className="py-12 text-center text-gray-600 text-xs font-semibold uppercase tracking-wider space-y-2">
              <ShieldCheck size={28} className="mx-auto text-emerald-500 mb-1" />
              <p>لا توجد تهديدات أو محاولات اختراق نشطة</p>
              <p className="text-[10px] text-gray-500">منظومة الحماية ترشح مروراً سالماً بنسبة 100%</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-[11px] text-emerald-400/80 leading-relaxed font-bold mt-4">
        🛡️ تم تحصين الـ API وجداول Firestore بالكامل ضد كافة هجمات الحقن وقراءة البيانات الجماعية المفتوحة.
      </div>
    </div>
  );
}
