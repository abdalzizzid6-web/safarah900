import React from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

interface Props {
  publishDate: string;
  onChange: (date: string) => void;
  onScheduleToggle: (isScheduled: boolean) => void;
  isScheduled: boolean;
}

export function PublishScheduler({ publishDate, onChange, onScheduleToggle, isScheduled }: Props) {
  return (
    <div className="bg-[#121214] border border-white/[0.05] rounded-3xl p-6 space-y-4 text-right">
      <div className="flex justify-between items-center flex-row-reverse border-b border-white/[0.05] pb-3">
        <h3 className="font-bold text-white text-base flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" /> جدولة النشر التلقائي
        </h3>
        
        {/* Toggle switch */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isScheduled}
            onChange={(e) => onScheduleToggle(e.target.checked)}
            className="w-4 h-4 accent-primary"
            id="scheduler_toggle"
          />
          <label htmlFor="scheduler_toggle" className="text-xs text-gray-400 font-bold cursor-pointer">تفعيل الجدولة</label>
        </div>
      </div>

      {isScheduled && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex gap-3 flex-row-reverse text-right">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <p className="text-xs text-blue-300 leading-relaxed">
              عند تفعيل الجدولة، سيتم حفظ المقال بحالة "مجدول" ولن يظهر للجمهور في الموقع العام إلا عند حلول التاريخ والوقت المحددين أدناه تلقائياً.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-400">تاريخ النشر المستهدف</label>
              <input
                type="datetime-local"
                value={publishDate ? publishDate.slice(0, 16) : ''}
                onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : '')}
                className="w-full bg-[#18181C] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary text-right"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
