import React from 'react';
import { Database } from 'lucide-react';

export default function FirestoreSecurityWidget() {
  return (
    <div className="bg-[#111113] border border-white/5 p-4 rounded-2xl flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
          <Database size={18} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">قواعد Firestore</h3>
          <p className="text-[10px] text-gray-500">تم تفعيل الجدار الناري بنجاح. كافة العمليات تمر عبر طبقة تحقق مسبقة.</p>
        </div>
      </div>
      <div className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-500/20">
        مُحصّن
      </div>
    </div>
  );
}
