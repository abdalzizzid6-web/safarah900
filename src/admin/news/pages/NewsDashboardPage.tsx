import React, { useState } from 'react';
import { useNews } from '../hooks/useNews';
import { useNewsCategories } from '../hooks/useNewsCategories';
import { NewsToolbar } from '../components/NewsToolbar';
import { NewsFilters } from '../components/NewsFilters';
import { NewsTable } from '../components/NewsTable';
import { NewsCard } from '../components/NewsCard';
import { NewsPreview } from '../components/NewsPreview';
import { NewsEditor } from '../components/NewsEditor';
import { NewsCategoriesPage } from './NewsCategoriesPage';
import { NewsTagsPage } from './NewsTagsPage';
import { FeaturedNewsPage } from './FeaturedNewsPage';
import { BreakingNewsPage } from './BreakingNewsPage';
import { NewsAnalyticsPage } from './NewsAnalyticsPage';
import { NewsSettingsPage } from './NewsSettingsPage';
import { RssDashboard } from '../rss/components/RssDashboard';
import { NewsDashboardSummary } from '../components/NewsDashboardSummary';
import { NewsArticle, NewsArticleStatus } from '../types';
import { LayoutGrid, List } from 'lucide-react';

export function NewsDashboardPage() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [previewArticle, setPreviewArticle] = useState<NewsArticle | null>(null);

  // Core Hooks
  const { categories } = useNewsCategories();
  const {
    articles,
    loading,
    filters,
    hasMore,
    updateFilters,
    loadMore,
    refresh,
    deleteArticle,
    transitionStatus
  } = useNews(activeTab === 'dashboard' ? undefined : { status: undefined });

  const handleEdit = (article: NewsArticle) => {
    setEditingArticleId(article.id);
    setIsCreating(false);
  };

  const handleNewArticle = () => {
    setEditingArticleId(null);
    setIsCreating(true);
  };

  const handleSaveSuccess = () => {
    setEditingArticleId(null);
    setIsCreating(false);
    refresh();
  };

  return (
    <div className="p-6 md:p-8 space-y-8 min-h-screen bg-[#070709] text-right" dir="rtl">
      {/* Top Welcome Title Row */}
      <div className="flex justify-between items-center flex-row-reverse">
        <div>
          <span className="text-xs font-bold text-primary tracking-wider uppercase">بوابة التحكم الإداري</span>
          <h1 className="text-3xl font-black text-white mt-1">نظام إدارة الأخبار الرياضية (News CMS)</h1>
        </div>
      </div>

      {/* Main editor screen state */}
      {(isCreating || editingArticleId) ? (
        <NewsEditor
          articleId={editingArticleId || undefined}
          categories={categories}
          onClose={() => { setEditingArticleId(null); setIsCreating(false); }}
          onSaveSuccess={handleSaveSuccess}
        />
      ) : (
        <>
          {/* Action Toolbar */}
          <NewsToolbar
            onNewArticle={handleNewArticle}
            onNavigateTab={(tab) => {
              setActiveTab(tab);
              // Clear search filters on tab transition
              updateFilters({ search: undefined, category: undefined, status: undefined });
            }}
            activeTab={activeTab}
          />

          {/* Render target panel dynamically based on selected activeTab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fade-in">
              {/* Summary Stats */}
              <NewsDashboardSummary stats={{
                published: articles.filter(a => a.status === 'PUBLISHED').length,
                draft: articles.filter(a => a.status === 'DRAFT').length,
                pending: articles.filter(a => a.status === 'REVIEW').length,
                scheduled: articles.filter(a => a.status === 'SCHEDULED').length,
                archived: articles.filter(a => a.status === 'ARCHIVED').length,
                rejected: 0,
              }} />

              {/* Search and drop list Filters */}
              <NewsFilters
                categories={categories}
                filters={filters}
                onFilterChange={updateFilters}
              />

              {/* View Layout buttons switcher */}
              <div className="flex justify-between items-center bg-[#121214] border border-white/[0.05] p-4 rounded-2xl flex-row-reverse">
                <span className="text-xs text-gray-400 font-bold">تغيير نمط عرض مقالات الأخبار</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2 rounded-xl transition-all ${viewMode === 'table' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`p-2 rounded-xl transition-all ${viewMode === 'cards' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'}`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* List container layout style (Table / Grid) */}
              {viewMode === 'table' ? (
                <NewsTable
                  articles={articles}
                  onEdit={handleEdit}
                  onDelete={(id) => { if (confirm('هل أنت متأكد من رغبتك في حذف هذا الخبر نهائياً من قاعدة البيانات؟')) deleteArticle(id); }}
                  onPreview={(art) => setPreviewArticle(art)}
                  onTransitionStatus={(id, status) => transitionStatus(id, status, 'محرر سفارة ٩٠')}
                  loading={loading}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {articles.map((art) => (
                    <NewsCard
                      key={art.id}
                      article={art}
                      onEdit={handleEdit}
                      onPreview={(a) => setPreviewArticle(a)}
                    />
                  ))}
                </div>
              )}

              {/* Load more paginations */}
              {hasMore && (
                <div className="flex justify-center pt-6">
                  <button
                    onClick={loadMore}
                    className="px-6 py-3 bg-[#121214] hover:bg-white/5 border border-white/[0.05] text-xs font-bold text-gray-300 hover:text-white rounded-2xl transition-all"
                  >
                    عرض المزيد من الأخبار
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'categories' && <NewsCategoriesPage />}
          {activeTab === 'tags' && <NewsTagsPage />}
          {activeTab === 'featured' && <FeaturedNewsPage />}
          {activeTab === 'breaking' && <BreakingNewsPage />}
          {activeTab === 'analytics' && <NewsAnalyticsPage />}
          {activeTab === 'settings' && <NewsSettingsPage />}
          {activeTab === 'rss' && <RssDashboard />}
        </>
      )}

      {/* Dynamic Device Preview modal overlay */}
      {previewArticle && (
        <NewsPreview
          article={previewArticle}
          onClose={() => setPreviewArticle(null)}
        />
      )}
    </div>
  );
}

export default NewsDashboardPage;
