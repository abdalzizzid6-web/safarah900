import React from 'react';

export default function ActivityWidget({ recentActions, activeLogFilter, setActiveLogFilter }: any) {
  const filteredLogs = recentActions.filter((log: any) => {
    if (activeLogFilter === 'all') return true;
    return log.severity === activeLogFilter;
  });

  return (
    <div className="lg:col-span-2 bg-[#121214] border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col justify-between">
        <div>
            <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-white mb-1">أحدث الأنشطة وسجلات الإشراف</h3>
                <p className="text-xs text-gray-500 font-semibold">تتبع وحماية البيانات السحابية من عمليات الحذف والعمليات الهامة</p>
              </div>
              <div className="flex items-center gap-1.5 bg-black/40 border border-white/[0.04] p-1 rounded-xl">
                {(['all', 'success', 'error', 'info'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveLogFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                      activeLogFilter === filter 
                        ? 'bg-amber-500 text-black shadow' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {filter === 'all' ? 'الكل' :
                     filter === 'success' ? 'نجاح' :
                     filter === 'error' ? 'أخطاء' : 'صيانة'}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="text-gray-500 text-[10px] uppercase bg-white/[0.01]">
                    <th className="px-6 py-4 font-black">الحدث والإجراء</th>
                    <th className="px-6 py-4 font-black">المسؤول عن العملية</th>
                    <th className="px-6 py-4 font-black text-center">توقيت العملية</th>
                    <th className="px-6 py-4 font-black text-left">التصنيف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredLogs.length > 0 ? filteredLogs.map((act: any) => (
                    <tr key={act.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-gray-200 leading-relaxed block">{act.action}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400 font-black">{act.user}</td>
                      <td className="px-6 py-4 text-xs text-gray-500 font-mono text-center">{act.time}</td>
                      <td className="px-6 py-4 text-left">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black border ${act.color}`}>
                          {act.type}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className="text-center py-6 text-gray-500 text-xs font-bold">لا توجد سجلات مطابقة</td></tr>
                  )}
                </tbody>
              </table>
            </div>
        </div>
    </div>
  );
}
