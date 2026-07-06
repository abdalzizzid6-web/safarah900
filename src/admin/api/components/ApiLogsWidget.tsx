import React from 'react';
import { Activity, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import { ApiLog } from '../types/api';

interface ApiLogsWidgetProps {
  logs: ApiLog[];
}

export const ApiLogsWidget: React.FC<ApiLogsWidgetProps> = React.memo(({ logs }) => {
  return (
    <div className="bg-[#121214] border border-gray-800 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-6 h-6 text-[#FF003C]" />
          <div>
            <h3 className="font-bold text-lg text-gray-200">سجل الاستدعاءات الفوري (Live Transaction Logs)</h3>
            <p className="text-xs text-gray-400 mt-1">مراقبة حية لكافة المعاملات والاتصالات الواردة والصادرة على السيرفر ومعدل نجاحها.</p>
          </div>
        </div>
        <span className="text-xs font-mono bg-gray-900 border border-gray-800 px-2 py-1 rounded text-gray-400">
          نشط: {logs.length} عمليات مؤخراً
        </span>
      </div>

      <div className="overflow-x-auto">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500 border border-dashed border-gray-800 rounded-xl flex flex-col items-center justify-center space-y-2">
            <CheckCircle className="w-8 h-8 text-green-500/80" />
            <p className="text-sm font-medium">سليم تماماً - لا توجد أخطاء استدعاء أو انقطاع في الخدمة حالياً.</p>
            <p className="text-xs text-gray-600">المراقبة في وضع الخمول الفعال وبانتظار طلبات المستخدمين.</p>
          </div>
        ) : (
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-800/80 text-gray-400">
                <th className="pb-3 pt-1 pr-2 font-bold">المنتج / المزود</th>
                <th className="pb-3 pt-1 font-bold">المسار (Endpoint)</th>
                <th className="pb-3 pt-1 font-bold text-center">الحالة</th>
                <th className="pb-3 pt-1 font-bold text-left pl-2">زمن الاستجابة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40">
              {logs.map((log) => {
                const isError = log.status >= 400;
                return (
                  <tr key={log.id} className="hover:bg-gray-900/40 transition">
                    <td className="py-2.5 pr-2 font-bold font-mono text-gray-300">{log.provider}</td>
                    <td className="py-2.5 font-mono text-gray-400 text-left" dir="ltr">{log.endpoint}</td>
                    <td className="py-2.5 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                        isError 
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                          : 'bg-green-500/10 text-green-400 border border-green-500/20'
                      }`}>
                        {isError ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-left pl-2 font-mono text-gray-400">{log.latency}ms</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
});

ApiLogsWidget.displayName = 'ApiLogsWidget';
export default ApiLogsWidget;
