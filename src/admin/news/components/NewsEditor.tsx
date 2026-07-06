import React, { useState, useEffect } from 'react';
import { useNewsEditor } from '../hooks/useNewsEditor';
import { NewsCategory, NewsArticleStatus, NewsArticle } from '../types';
import { ImageUploader } from './ImageUploader';
import { SeoEditor } from './SeoEditor';
import { PublishScheduler } from './PublishScheduler';
import { RelatedSelectors } from './RelatedSelectors';
import { VersionHistory } from './VersionHistory';
import { Save, X, Eye, FileText, CheckCircle2 } from 'lucide-react';

interface Props {
  articleId?: string;
  categories: NewsCategory[];
  onClose: () => void;
  onSaveSuccess: () => void;
  authorUser?: any;
}

export function NewsEditor({ articleId, categories, onClose, onSaveSuccess, authorUser }: Props) {
  const {
    article,
    title,
    content,
    excerpt,
    status,
    categories: selectedCategories,
    tags,
    featuredImage,
    seo,
    relatedContent,
    publishDate,
    loading,
    saving,
    error,
    setTitle,
    setContent,
    setExcerpt,
    setStatus,
    setCategories: setSelectedCategories,
    setTags,
    setFeaturedImage,
    setSeo,
    setRelatedContent,
    setPublishDate,
    save,
    rollbackVersion
  } = useNewsEditor(articleId, authorUser);

  const [isScheduled, setIsScheduled] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');

  useEffect(() => {
    if (status === NewsArticleStatus.SCHEDULED) {
      setIsScheduled(true);
    }
  }, [status]);

  const handleSave = async (overrideStatus?: NewsArticleStatus) => {
    const finalStatus = overrideStatus || (isScheduled ? NewsArticleStatus.SCHEDULED : status);
    const result = await save(finalStatus);
    if (result) {
      onSaveSuccess();
    }
  };

  const handleCategoryToggle = (catName: string) => {
    if (selectedCategories.includes(catName)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== catName));
    } else {
      setSelectedCategories([...selectedCategories, catName]);
    }
  };

  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    if (tags.includes(newTagInput.trim())) return;
    setSelectedCategories([...selectedCategories]); // trigger force render
    setTags([...tags, newTagInput.trim()]);
    setNewTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#09090B] border border-white/10 rounded-3xl p-6 md:p-8 space-y-8 text-right max-w-6xl mx-auto shadow-2xl relative">
      {/* Top action header bar */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 border-b border-white/[0.05] pb-6">
        <div>
          <h2 className="text-2xl font-black text-white">
            {articleId ? 'تعديل المقال الرياضي' : 'إنشاء مقال رياضي جديد'}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            املأ بيانات الخبر وتحقق من مؤشرات السيو والربط التلقائي بالمباريات قبل الحفظ والنشر
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-2xl text-xs font-bold transition-all"
          >
            <X className="w-4 h-4" /> إلغاء
          </button>
          
          <button
            onClick={() => handleSave(NewsArticleStatus.DRAFT)}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#18181C] hover:bg-white/5 border border-white/[0.05] text-white rounded-2xl text-xs font-bold transition-all"
          >
            <FileText className="w-4 h-4" /> حفظ كمسودة
          </button>

          <button
            onClick={() => handleSave(NewsArticleStatus.PUBLISHED)}
            disabled={saving}
            className="bg-primary text-black flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black shadow-[0_4px_20px_rgba(var(--color-primary-rgb),0.3)] transition-all active:scale-95 whitespace-nowrap"
          >
            <Save className="w-4 h-4" /> نشر المقال الآن
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-xs text-rose-400">
          ⚠️ {error}
        </div>
      )}

      {/* Inputs grid form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main story input column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Article Title */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-400">عنوان الخبر الأساسي</label>
            <input
              type="text"
              value={title || ''}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#121214] border border-white/[0.05] rounded-2xl px-5 py-4 text-lg font-black text-white focus:outline-none focus:border-primary transition-all text-right placeholder-gray-600"
              placeholder="اكتب عنوان الخبر المثير للاهتمام هنا..."
              required
            />
          </div>

          {/* Excerpt Summary */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-400">موجز الخبر / الخلاصة السريعة</label>
            <textarea
              value={excerpt || ''}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
              className="w-full bg-[#121214] border border-white/[0.05] rounded-2xl p-4 text-sm text-gray-300 focus:outline-none focus:border-primary placeholder-gray-600"
              placeholder="اكتب مقتطفاً أو خلاصة سريعة تظهر في الصفحة الرئيسية للخبر..."
            />
          </div>

          {/* Body content Editor */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-gray-400">محتوى المقال الكامل والفقرات</label>
              <div className="text-[10px] text-gray-600 font-mono">
                {content?.length || 0} حرف | {content?.split(/\s+/).filter(Boolean).length || 0} كلمة
              </div>
            </div>
            <textarea
              value={content || ''}
              onChange={(e) => setContent(e.target.value)}
              rows={15}
              className="w-full bg-[#121214] border border-white/[0.05] rounded-2xl p-5 text-base text-gray-200 focus:outline-none focus:border-primary leading-relaxed placeholder-gray-600 font-medium"
              placeholder="اكتب الفقرات والتفاصيل الكاملة للخبر الرياضي هنا بالتفصيل الممتع..."
            />
          </div>

          {/* SEO Module Editor integration */}
          <SeoEditor seo={seo} onChange={setSeo} />

          {/* Related Associations entities links selectors */}
          <RelatedSelectors value={relatedContent} onChange={setRelatedContent} />
        </div>

        {/* Sidebar settings column */}
        <div className="space-y-6">
          {/* Cover image uploader */}
          <ImageUploader image={featuredImage} onChange={setFeaturedImage} />

          {/* Categories Selector Checklist */}
          <div className="bg-[#121214] border border-white/[0.05] rounded-3xl p-6 space-y-4">
            <h3 className="font-bold text-white text-sm border-b border-white/[0.05] pb-3">تصنيف الخبر</h3>
            <div className="space-y-2 max-h-[160px] overflow-y-auto">
              {categories.map((cat) => (
                <label key={cat.id} className="flex items-center gap-3 flex-row-reverse text-xs text-gray-300 hover:text-white cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat.name)}
                    onChange={() => handleCategoryToggle(cat.name)}
                    className="w-4 h-4 accent-primary"
                  />
                  <span>{cat.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Tags cloud builder */}
          <div className="bg-[#121214] border border-white/[0.05] rounded-3xl p-6 space-y-4">
            <h3 className="font-bold text-white text-sm border-b border-white/[0.05] pb-3">الوسوم والهاشتاجات (Tags)</h3>
            <div className="flex gap-2">
              <button
                onClick={handleAddTag}
                className="px-3 bg-[#18181C] hover:bg-white/10 border border-white/[0.05] text-white rounded-xl text-xs font-bold"
              >
                إضافة
              </button>
              <input
                type="text"
                value={newTagInput || ''}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                className="flex-1 bg-[#18181C] border border-white/[0.05] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                placeholder="اكتب وسماً جديداً واضغط Enter"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2 justify-start">
              {tags.map((t) => (
                <span key={t} className="bg-white/5 text-gray-400 border border-white/10 px-2 py-0.5 rounded text-[10px] flex items-center gap-1 font-mono">
                  #{t}
                  <button onClick={() => handleRemoveTag(t)} className="text-rose-500 hover:text-white">×</button>
                </span>
              ))}
            </div>
          </div>

          {/* Publish Scheduler component integration */}
          <PublishScheduler
            publishDate={publishDate}
            onChange={setPublishDate}
            isScheduled={isScheduled}
            onScheduleToggle={(val) => {
              setIsScheduled(val);
              setStatus(val ? NewsArticleStatus.SCHEDULED : NewsArticleStatus.DRAFT);
            }}
          />

          {/* Version history sidebar rollback integration */}
          {articleId && article?.history && (
            <VersionHistory
              history={article.history}
              onRollback={rollbackVersion}
            />
          )}
        </div>
      </div>
    </div>
  );
}
