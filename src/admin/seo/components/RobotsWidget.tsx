import React from 'react';
import { RobotStatus } from '../types';

interface RobotsWidgetProps {
  robotsTxt: RobotStatus;
}

export const RobotsWidget: React.FC<RobotsWidgetProps> = ({ robotsTxt }) => {
  return (
    <div className="p-6 rounded-[2rem] bg-white/[0.01] border border-white/5 space-y-4 flex flex-col justify-between h-full">
      <div>
        <h4 className="text-xs font-black text-white border-b border-white/5 pb-2">
          ملف توجيه الزواحف robots.txt
        </h4>
        
        <div className="my-4 space-y-2 font-bold text-xs">
          <div className="flex justify-between p-2 rounded bg-black/20">
            <span className="text-gray-400 font-semibold">هل يتوفر رابط Sitemap داخل الملف؟</span>
            <span className={robotsTxt.hasSitemapUrl ? 'text-emerald-400' : 'text-red-400'}>
              {robotsTxt.hasSitemapUrl ? '🟢 نعم - مضمّن بطريقة صحيحة' : '🔴 لا - غير مضمن'}
            </span>
          </div>

          <div className="flex justify-between p-2 rounded bg-black/20">
            <span className="text-gray-400 font-semibold">هل يتيح لكافة الزواحف الفحص؟</span>
            <span className={robotsTxt.allowsAll ? 'text-emerald-400' : 'text-red-400'}>
              {robotsTxt.allowsAll ? '🟢 نعم - متاح بالكامل (Allow: /)' : '🔴 لا - يوجد قيود'}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-1 bg-black/40 p-4 rounded-xl border border-white/5">
        <span className="text-[10px] text-gray-500 font-black block mb-1">الرد الخام للموجه:</span>
        <pre className="font-mono text-[10px] leading-relaxed text-gray-400 truncate whitespace-pre-wrap select-all max-h-32 overflow-y-auto">
          {robotsTxt.content || 'لا توجد قراءة'}
        </pre>
      </div>
    </div>
  );
};
