import React from 'react';
import { Database } from 'lucide-react';

export const ApiHeader: React.FC = React.memo(() => {
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="p-2 bg-[#FF003C]/10 rounded-lg text-[#FF003C]">
          <Database className="w-8 h-8" />
        </span>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-sans text-gray-100 flex items-center gap-2">
            نظام إدارة الـ APIs الذكي
            <span className="text-xs bg-[#FF003C]/15 text-[#FF003C] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
              Enterprise V3
            </span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            إدارة مركزية لمزودي البيانات الرياضية، تدوير تلقائي للمفاتيح، مراقبة التكاليف، وفحص تلقائي لجودة الاتصال (Latency Check) لضمان استقرار نتائج المباريات.
          </p>
        </div>
      </div>
    </div>
  );
});

ApiHeader.displayName = 'ApiHeader';
export default ApiHeader;
