import React from 'react';
import { Calendar as CalendarIcon, Clock, Send, Plus } from 'lucide-react';

const SocialScheduler: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">الجدولة والنشر</h2>
        <button className="px-4 py-2 bg-primary text-black rounded-lg hover:bg-primary-hover flex items-center gap-2">
          <Send className="w-4 h-4" />
          إنشاء منشور
        </button>
      </div>

      <div className="bg-surface rounded-xl border border-white/5 p-8 text-center">
        <CalendarIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-white mb-2">لا توجد منشورات مجدولة</h3>
        <p className="text-gray-400 max-w-md mx-auto mb-6">
          قم بإنشاء منشورك الأول وجدولته للنشر التلقائي على جميع منصاتك المتصلة في الوقت الأنسب لجمهورك.
        </p>
        <button className="px-6 py-2 bg-surface-elevated text-white rounded-lg hover:bg-surface-elevated/80 border border-white/10 flex items-center gap-2 mx-auto">
          <Plus className="w-4 h-4" />
          جدولة منشور جديد
        </button>
      </div>
    </div>
  );
};

export default SocialScheduler;
