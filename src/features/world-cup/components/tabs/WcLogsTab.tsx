import React from 'react';

export function WcLogsTab({ apiLogs }: any) {
  return (
    <div className="space-y-6">
      <h3 className="text-xs font-black text-[#f3c623] uppercase">سجلات وأخطاء الاستيراد من الـ API</h3>
      
      <div className="bg-[#0f0f12] border border-white/5 rounded-2xl overflow-hidden p-2">
        <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1">
          {apiLogs.length > 0 ? apiLogs.map((log: any) => (
            <div key={log.id} className="p-3 bg-black border border-white/5 rounded-xl font-mono text-xs flex flex-col gap-2">
              <div className="flex justify-between text-[10px%">
                <span className={log.status === 'error' ? 'text-red-400' : 'text-green-400'}>
                  [{log.status?.toUpperCase()}] {log.endpoint}
                </span>
                <span className="text-gray-500">{log.timestamp ? new Date(log.timestamp?.toDate ? log.timestamp.toDate() : log.timestamp).toLocaleString('ar-SA') : ''}</span>
              </div>
              <p className="text-gray-300 w-full overflow-x-auto whitespace-pre">{log.message}</p>
            </div>
          )) : (
            <div className="p-6 text-center text-gray-500 text-xs">لا توجد سجلات حالية.</div>
          )}
        </div>
      </div>
    </div>
  );
}
