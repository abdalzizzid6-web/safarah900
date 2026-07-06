import React from 'react';
import { NewsVersion } from '../types';
import { History, RotateCcw, Calendar, User, Eye } from 'lucide-react';

interface Props {
  history?: NewsVersion[];
  onRollback: (versionId: string) => void;
}

export function VersionHistory({ history = [], onRollback }: Props) {
  if (history.length === 0) {
    return (
      <div className="bg-[#121214] border border-white/[0.05] rounded-3xl p-6 text-center text-gray-500 text-xs">
        <History className="w-8 h-8 text-gray-700 mx-auto mb-2" />
        لا يوجد سجل تعديلات سابق لهذا المقال حتى الآن
      </div>
    );
  }

  return (
    <div className="bg-[#121214] border border-white/[0.05] rounded-3xl p-6 space-y-4 text-right">
      <div className="flex items-center gap-2 flex-row-reverse border-b border-white/[0.05] pb-3">
        <History className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-white text-base">أرشيف وتاريخ الإصدارات</h3>
      </div>

      <div className="space-y-3 max-h-[300px] overflow-y-auto">
        {history.map((h) => {
          const formattedDate = new Date(h.updatedAt).toLocaleString('ar-EG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });

          return (
            <div key={h.id} className="bg-[#18181C] border border-white/[0.03] hover:border-white/10 rounded-2xl p-4 flex justify-between items-center transition-all flex-row-reverse">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-row-reverse">
                  <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-md font-bold">
                    إصدار {h.version}
                  </span>
                  <span className="text-xs text-gray-400 font-bold">{h.title}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-gray-500 flex-row-reverse">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" /> {h.updatedBy}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {formattedDate}
                  </span>
                </div>
              </div>

              {/* Rollback button */}
              <button
                onClick={() => {
                  if (confirm(`هل أنت متأكد من رغبتك في استعادة الإصدار ${h.version}؟ سيتم استبدال المحتوى الحالي بالكامل.`)) {
                    onRollback(h.id);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs font-bold transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" /> استرجاع هذا الإصدار
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
