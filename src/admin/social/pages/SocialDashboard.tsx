import React from 'react';
import { Activity, BarChart2, Share2, CheckCircle2, XCircle } from 'lucide-react';

const SocialDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'الحسابات النشطة', value: '0', icon: Share2, color: 'text-blue-500' },
          { title: 'منشورات اليوم', value: '0', icon: Activity, color: 'text-green-500' },
          { title: 'تم النشر بنجاح', value: '0', icon: CheckCircle2, color: 'text-primary' },
          { title: 'فشل النشر', value: '0', icon: XCircle, color: 'text-red-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-surface rounded-xl p-6 border border-white/5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm">{stat.title}</p>
                <p className="text-2xl font-bold text-white mt-2">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg bg-surface-elevated ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface rounded-xl border border-white/5 p-6 min-h-[300px] flex items-center justify-center">
            <div className="text-center">
              <BarChart2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">لا توجد بيانات كافية لعرض الرسوم البيانية</p>
            </div>
        </div>
        <div className="bg-surface rounded-xl border border-white/5 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">قائمة الانتظار</h3>
          <div className="text-center py-8">
            <p className="text-gray-500">لا توجد منشورات في قائمة الانتظار</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialDashboard;
