import React, { useState, useMemo } from 'react';
import { KeyRound, Layers } from 'lucide-react';
import { ApiProvider } from '../types/api';
import ApiConnectionsTable from './ApiConnectionsTable';

interface ApiKeysWidgetProps {
  providers: ApiProvider[];
  actionLoading: string | null;
  testResult: { id: string; success: boolean; latency?: number; message?: string } | null;
  onTestKey: (p: ApiProvider) => void;
  onToggleActive: (p: ApiProvider) => void;
  onEdit: (p: ApiProvider) => void;
  onDelete: (id: string) => void;
}

export const ApiKeysWidget: React.FC<ApiKeysWidgetProps> = React.memo(({
  providers,
  actionLoading,
  testResult,
  onTestKey,
  onToggleActive,
  onEdit,
  onDelete
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'الكل (All)' },
    { id: 'matches', label: 'مباريات' },
    { id: 'leagues', label: 'بطولات' },
    { id: 'teams', label: 'فرق' },
    { id: 'players', label: 'لاعبين' },
    { id: 'news', label: 'أخبار' },
    { id: 'predictions', label: 'توقعات' },
    { id: 'live_stream', label: 'بث مباشر' },
    { id: 'ai_analysis', label: 'تحليل AI' }
  ];

  // Filtering of providers according to the selected category filter
  const filteredProviders = useMemo(() => {
    if (selectedCategory === 'all') return providers;
    return providers.filter(p => 
      !p.categories || p.categories.length === 0 || p.categories.includes(selectedCategory)
    );
  }, [providers, selectedCategory]);

  const activeCount = useMemo(() => {
    return filteredProviders.filter(p => p.active).length;
  }, [filteredProviders]);

  return (
    <div className="bg-[#121214] border border-gray-800 rounded-2xl p-6 space-y-5">
      {/* Header section inside the widget */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div className="flex items-center gap-2">
          <KeyRound className="w-6 h-6 text-[#FF003C]" />
          <div>
            <h3 className="font-bold text-lg text-gray-200">مجمع مفاتيح واجهة برمجة التطبيقات (API Key Pool)</h3>
            <p className="text-xs text-gray-400 mt-1">توزيع آلي للأحمال، تبديل تلقائي للمفاتيح عند تجاوز كوتا اليوم، وتخطي الأخطاء الذاتي.</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-end md:self-auto text-xs bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-lg">
          <Layers className="w-4 h-4 text-gray-400" />
          <span className="text-gray-400">مفاتيح نشطة في القسم الحالي:</span>
          <span className="font-bold text-[#FF003C] font-mono">{activeCount} من {filteredProviders.length}</span>
        </div>
      </div>

      {/* Category Selection Filter Badges */}
      <div className="flex flex-wrap gap-2 pt-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-[#FF003C]/10 text-[#FF003C] border-[#FF003C]/35'
                : 'bg-transparent text-gray-400 border-gray-800 hover:text-white hover:border-gray-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Render the Connections List Table/Cards */}
      {filteredProviders.length === 0 ? (
        <div className="py-10 text-center text-gray-500 border border-dashed border-gray-800 rounded-xl">
          لا توجد مفاتيح مسجلة تحت هذا القسم. انقر على "إضافة مفتاح جديد" لتهيئة مفتاح لهذا القسم.
        </div>
      ) : (
        <ApiConnectionsTable
          providers={filteredProviders}
          actionLoading={actionLoading}
          testResult={testResult}
          onTestKey={onTestKey}
          onToggleActive={onToggleActive}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    </div>
  );
});

ApiKeysWidget.displayName = 'ApiKeysWidget';
export default ApiKeysWidget;
