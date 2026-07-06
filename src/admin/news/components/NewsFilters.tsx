import React from 'react';
import { NewsArticleStatus, NewsCategory } from '../types';
import { Search, Calendar, Filter, X } from 'lucide-react';

interface Props {
  categories: NewsCategory[];
  filters: {
    status?: NewsArticleStatus;
    category?: string;
    search?: string;
  };
  onFilterChange: (filters: any) => void;
}

export function NewsFilters({ categories, filters, onFilterChange }: Props) {
  return (
    <div className="bg-[#121214] border border-white/[0.05] rounded-3xl p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute right-4 top-3.5 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="بحث في المقالات الإخبارية..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="w-full bg-[#18181C] border border-white/[0.05] rounded-2xl pr-11 pl-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-all text-right"
          />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <select
            value={filters.category || ''}
            onChange={(e) => onFilterChange({ category: e.target.value || undefined })}
            className="w-full bg-[#18181C] border border-white/[0.05] rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-all appearance-none text-right"
          >
            <option value="">كل التصنيفات</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={filters.status || ''}
            onChange={(e) => onFilterChange({ status: e.target.value || undefined })}
            className="w-full bg-[#18181C] border border-white/[0.05] rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-all appearance-none text-right"
          >
            <option value="">كل الحالات</option>
            {Object.values(NewsArticleStatus).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Clear Filters indicator */}
      {(filters.search || filters.category || filters.status) && (
        <div className="flex justify-end mt-4">
          <button
            onClick={() => onFilterChange({ search: undefined, category: undefined, status: undefined })}
            className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-bold"
          >
            <X className="w-3 h-3" /> مسح كل الفلاتر
          </button>
        </div>
      )}
    </div>
  );
}
