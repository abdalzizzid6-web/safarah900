import React from 'react';

interface Props {
  stats: {
    published: number;
    draft: number;
    pending: number;
    scheduled: number;
    archived: number;
    rejected: number;
  };
}

export const NewsDashboardSummary = ({ stats }: Props) => {
  const cards = [
    { label: 'منشور', value: stats.published, color: 'text-emerald-500' },
    { label: 'مسودة', value: stats.draft, color: 'text-gray-400' },
    { label: 'بانتظار المراجعة', value: stats.pending, color: 'text-amber-500' },
    { label: 'مجدول', value: stats.scheduled, color: 'text-blue-500' },
    { label: 'مؤرشف', value: stats.archived, color: 'text-gray-600' },
    { label: 'مرفوض', value: stats.rejected, color: 'text-red-500' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((c, i) => (
        <div key={i} className="bg-[#121214] border border-white/[0.05] rounded-2xl p-4 text-center">
          <p className="text-[10px] text-gray-500 font-bold mb-1">{c.label}</p>
          <p className={`text-xl font-black ${c.color}`}>{c.value}</p>
        </div>
      ))}
    </div>
  );
};
