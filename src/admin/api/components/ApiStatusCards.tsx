import React from 'react';
import { Key, CheckCircle, Activity, DollarSign } from 'lucide-react';
import { ApiProvider, DashboardStats } from '../types/api';

interface ApiStatusCardsProps {
  stats: DashboardStats | null;
}

export const ApiStatusCards: React.FC<ApiStatusCardsProps> = React.memo(({ stats }) => {
  const providers = stats?.providers || [];
  const activeCount = providers.filter(p => p.active).length;
  const healthyCount = stats?.analytics?.health?.healthyCount || 0;
  const avgLatency = stats?.analytics?.averageLatency || 120;
  const totalCost = stats?.analytics?.totalCost || 0;

  const cardItems = [
    {
      title: 'المفاتيح النشطة',
      value: `${activeCount} / ${providers.length}`,
      desc: 'إجمالي المفاتيح المهيأة في المجمع',
      icon: Key,
      iconColor: 'text-[#FF003C]',
      bgAccent: 'bg-[#FF003C]/10',
    },
    {
      title: 'عقد خادم سليمة',
      value: `${healthyCount}`,
      desc: 'المزودين المتاحين للعمل فورا',
      icon: CheckCircle,
      iconColor: 'text-green-400',
      bgAccent: 'bg-green-500/10',
    },
    {
      title: 'متوسط زمن الاستجابة',
      value: `${avgLatency}ms`,
      desc: 'كفاءة وزمن اتصال خوادمنا',
      icon: Activity,
      iconColor: 'text-cyan-400',
      bgAccent: 'bg-cyan-500/10',
    },
    {
      title: 'تكلفة الاستهلاك اليومي',
      value: `$${totalCost.toFixed(5)}`,
      desc: 'إجمالي تقديري للاستخدام اليوم',
      icon: DollarSign,
      iconColor: 'text-green-400',
      bgAccent: 'bg-green-500/10',
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cardItems.map((item, idx) => (
        <div key={idx} className="bg-[#121214] border border-gray-800 rounded-xl p-4 flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-xs text-gray-400 block font-sans">{item.title}</span>
            <span className="text-xl font-black text-gray-100 font-mono block">{item.value}</span>
            <span className="text-[10px] text-gray-500 block leading-tight">{item.desc}</span>
          </div>
          <span className={`p-2.5 rounded-lg ${item.bgAccent} ${item.iconColor}`}>
            <item.icon className="w-5 h-5" />
          </span>
        </div>
      ))}
    </div>
  );
});

ApiStatusCards.displayName = 'ApiStatusCards';
export default ApiStatusCards;
