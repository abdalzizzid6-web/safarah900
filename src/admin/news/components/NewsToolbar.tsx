import React from 'react';
import { Plus, BarChart3, Settings, Tag, FolderEdit, Newspaper } from 'lucide-react';

interface Props {
  onNewArticle: () => void;
  onNavigateTab: (tab: string) => void;
  activeTab: string;
}

export function NewsToolbar({ onNewArticle, onNavigateTab, activeTab }: Props) {
  const tabs = [
    { id: 'dashboard', label: 'المقالات الإخبارية', icon: <Newspaper className="w-4 h-4" /> },
    { id: 'rss', label: 'تجميع الأخبار الذكي (RSS)', icon: <Newspaper className="w-4 h-4" /> },
    { id: 'categories', label: 'التصنيفات', icon: <FolderEdit className="w-4 h-4" /> },
    { id: 'tags', label: 'الوسوم (Tags)', icon: <Tag className="w-4 h-4" /> },
    { id: 'featured', label: 'الأخبار المميزة', icon: <Plus className="w-4 h-4" /> },
    { id: 'breaking', label: 'شريط الأخبار العاجلة', icon: <Plus className="w-4 h-4" /> },
    { id: 'analytics', label: 'التحليلات والمشاهدات', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'settings', label: 'إعدادات المنشورات', icon: <Settings className="w-4 h-4" /> }
  ];

  return (
    <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-[#121214] border border-white/[0.05] rounded-3xl p-5 mb-6">
      {/* Tab Navigation buttons */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onNavigateTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-primary text-black shadow-[0_4px_15px_rgba(var(--color-primary-rgb),0.3)]'
                : 'bg-[#18181C] text-gray-400 border border-white/[0.05] hover:text-white hover:border-white/10'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Action button */}
      <button
        onClick={onNewArticle}
        className="bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-black shadow-[0_4px_20px_rgba(16,185,129,0.25)] transition-all active:scale-95 whitespace-nowrap"
      >
        <Plus className="w-4 h-4" /> إضافة مقال جديد
      </button>
    </div>
  );
}
