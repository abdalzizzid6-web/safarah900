import React, { useState, useEffect } from 'react';
import { RssImportedArticle } from '../types';
import { 
  X, 
  Save, 
  Sparkles, 
  AlertCircle, 
  Search, 
  Hash, 
  Languages, 
  Cpu, 
  Link2, 
  Image as ImageIcon, 
  Check, 
  TrendingUp, 
  Zap, 
  Activity, 
  MapPin, 
  User, 
  Users, 
  Award, 
  BookOpen, 
  Copy, 
  ExternalLink 
} from 'lucide-react';

interface Props {
  article: RssImportedArticle | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<RssImportedArticle>) => Promise<any>;
}

export function RssArticleEditor({ article, isOpen, onClose, onSave }: Props) {
  const [activeTab, setActiveTab] = useState<'content' | 'ai_intel' | 'sports_link' | 'media_intel' | 'ai_editor'>('content');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    league: 'عام',
    competition: 'General',
    country: 'عالمي',
    articleType: 'تقرير إخباري',
    teamsStr: '',
    playersStr: '',
    tagsStr: '',
    metaTitle: '',
    metaDescription: '',
    readingTime: 1,

    // Translation override
    titleEn: '',
    titleAr: '',
    descriptionEn: '',
    descriptionAr: '',

    // Image Intelligence
    imageAlt: '',
    imageCaption: '',
    imageCredit: '',
  });
  const [saving, setSaving] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  useEffect(() => {
    if (article) {
      setFormData({
        title: article.title || '',
        description: article.description || '',
        imageUrl: article.imageUrl || '',
        league: article.classification?.league || 'عام',
        competition: article.classification?.competition || 'General',
        country: article.classification?.country || 'عالمي',
        articleType: article.classification?.articleType || 'تقرير إخباري',
        teamsStr: article.classification?.teams?.join(', ') || '',
        playersStr: article.classification?.players?.join(', ') || '',
        tagsStr: article.classification?.suggestedTags?.join(', ') || '',
        metaTitle: article.seo?.metaTitle || article.title || '',
        metaDescription: article.seo?.metaDescription || article.description || '',
        readingTime: article.seo?.readingTime || 1,

        titleEn: article.translations?.titleEn || '',
        titleAr: article.translations?.titleAr || article.title || '',
        descriptionEn: article.translations?.descriptionEn || '',
        descriptionAr: article.translations?.descriptionAr || article.description || '',

        imageAlt: article.imageIntel?.altText || article.title || '',
        imageCaption: article.imageIntel?.caption || article.title || '',
        imageCredit: article.imageIntel?.credit || 'محرر سفارة ٩٠',
      });
    }
  }, [article]);

  if (!isOpen || !article) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const teams = formData.teamsStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const players = formData.playersStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const suggestedTags = formData.tagsStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await onSave(article.id, {
        title: formData.title,
        description: formData.description,
        imageUrl: formData.imageUrl,
        classification: {
          league: formData.league,
          competition: formData.competition,
          teams,
          players,
          country: formData.country,
          articleType: formData.articleType,
          suggestedTags
        },
        seo: {
          slug: article.seo?.slug || article.id,
          metaTitle: formData.metaTitle,
          metaDescription: formData.metaDescription,
          readingTime: Number(formData.readingTime || 1),
          canonicalUrl: article.originalUrl,
          keywords: suggestedTags,
          includeInSitemap: true
        },
        translations: {
          titleEn: formData.titleEn,
          titleAr: formData.titleAr,
          descriptionEn: formData.descriptionEn,
          descriptionAr: formData.descriptionAr,
        },
        imageIntel: {
          ...article.imageIntel,
          altText: formData.imageAlt,
          caption: formData.imageCaption,
          credit: formData.imageCredit,
          suggestedImages: article.imageIntel?.suggestedImages || []
        }
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ المقال');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(label);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const applyAiSuggestion = (field: 'title' | 'metaTitle' | 'metaDescription' | 'slug') => {
    if (!article.aiEditor) return;
    if (field === 'title' && article.aiEditor.headlineSuggestions?.[0]) {
      setFormData(prev => ({ ...prev, title: article.aiEditor!.headlineSuggestions[0] }));
    } else if (field === 'metaTitle' && article.aiEditor.seoTitleSuggestion) {
      setFormData(prev => ({ ...prev, metaTitle: article.aiEditor!.seoTitleSuggestion }));
    } else if (field === 'metaDescription' && article.aiEditor.metaDescriptionSuggestion) {
      setFormData(prev => ({ ...prev, metaDescription: article.aiEditor!.metaDescriptionSuggestion }));
    }
  };

  // Determine difficulty color badge
  const getDifficultyBadge = (diff: string | undefined) => {
    switch (diff) {
      case 'مبتدئ': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'متقدم': return 'bg-red-500/10 text-red-400 border border-red-500/20';
      default: return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#121214] border border-white/[0.08] rounded-3xl max-w-5xl w-full h-[90vh] flex flex-col text-right overflow-hidden shadow-2xl" dir="rtl">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-white/[0.05] shrink-0">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-primary animate-pulse" />
            <div>
              <h3 className="text-md font-black text-white">منصة ذكاء الأخبار والتحليل التحريري</h3>
              <p className="text-[10px] text-gray-400 font-medium">مراجعة المحتوى، التراجم المزدوجة، الربط بالحقائق، وفحص الجودة بمساعد الذكاء الاصطناعي</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-[#18181C] hover:bg-white/5 text-gray-400 hover:text-white rounded-xl transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-2 px-6 py-2 border-b border-white/[0.03] bg-[#161619] shrink-0 overflow-x-auto scrollbar-none" dir="rtl">
          <button
            onClick={() => setActiveTab('content')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'content' ? 'bg-primary text-black' : 'bg-[#18181C] text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Languages className="w-3.5 h-3.5" /> المحتوى والتراجم
          </button>

          <button
            onClick={() => setActiveTab('ai_intel')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'ai_intel' ? 'bg-primary text-black' : 'bg-[#18181C] text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> التحليل الذكي والجودة
          </button>

          <button
            onClick={() => setActiveTab('sports_link')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'sports_link' ? 'bg-primary text-black' : 'bg-[#18181C] text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" /> الربط الذكي والتصنيف
          </button>

          <button
            onClick={() => setActiveTab('media_intel')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'media_intel' ? 'bg-primary text-black' : 'bg-[#18181C] text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" /> ذكاء الصور والميديا
          </button>

          <button
            onClick={() => setActiveTab('ai_editor')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'ai_editor' ? 'bg-primary text-black' : 'bg-[#18181C] text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" /> اقتراحات التحرير التلقائي
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: CONTENT & TRANSLATIONS */}
          {activeTab === 'content' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content Areas */}
              <div className="lg:col-span-2 space-y-5">
                {/* Standard Input Form */}
                <div className="bg-[#18181C]/50 border border-white/[0.03] rounded-2xl p-5 space-y-4">
                  <span className="text-xs font-black text-white block">العنوان والمحتوى الأصلي</span>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1.5">عنوان المقال المستورد</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full bg-[#121214] border border-white/[0.05] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-primary transition-all font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1.5">المقتطف الرئيسي / محتوى المقال</label>
                    <textarea
                      required
                      rows={6}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-[#121214] border border-white/[0.05] rounded-xl p-4 text-xs text-white focus:outline-none focus:border-primary transition-all leading-relaxed"
                    />
                  </div>
                </div>

                {/* Overridable Translations */}
                <div className="bg-[#18181C]/50 border border-white/[0.03] rounded-2xl p-5 space-y-4">
                  <span className="text-xs font-black text-emerald-400 block flex items-center gap-1.5">
                    <Languages className="w-4 h-4" /> نظام الترجمة المزدوجة المعتمد (English & Arabic)
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 mb-1.5">العنوان باللغة الإنجليزية (Title EN)</label>
                      <input
                        type="text"
                        value={formData.titleEn}
                        onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                        className="w-full bg-[#121214] border border-white/[0.05] text-left rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-primary transition-all font-mono"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 mb-1.5">العنوان باللغة العربية (Title AR)</label>
                      <input
                        type="text"
                        value={formData.titleAr}
                        onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                        className="w-full bg-[#121214] border border-white/[0.05] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-primary transition-all font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 mb-1.5">المقتطف المترجم بالإنجليزية (Description EN)</label>
                      <textarea
                        rows={4}
                        value={formData.descriptionEn}
                        onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                        className="w-full bg-[#121214] border border-white/[0.05] text-left rounded-xl p-3 text-xs text-white focus:outline-none focus:border-primary transition-all leading-relaxed font-mono"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 mb-1.5">المقتطف المترجم بالعربية (Description AR)</label>
                      <textarea
                        rows={4}
                        value={formData.descriptionAr}
                        onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                        className="w-full bg-[#121214] border border-white/[0.05] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-primary transition-all leading-relaxed"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar SEO */}
              <div className="space-y-5 bg-[#18181C]/40 border border-white/[0.03] rounded-2xl p-5 h-fit">
                <span className="text-xs font-black text-gray-300 block flex items-center gap-1.5">
                  <Search className="w-4 h-4 text-primary" /> إعدادات النشر ومحركات البحث
                </span>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 mb-1.5">عنوان الميتا (Meta Title)</label>
                  <input
                    type="text"
                    value={formData.metaTitle}
                    onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                    className="w-full bg-[#121214] border border-white/[0.05] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-primary transition-all font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 mb-1.5">وصف الميتا (Meta Description)</label>
                  <textarea
                    rows={3}
                    value={formData.metaDescription}
                    onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                    className="w-full bg-[#121214] border border-white/[0.05] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-primary transition-all leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 mb-1.5">وقت القراءة (دقائق)</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.readingTime}
                      onChange={(e) => setFormData({ ...formData, readingTime: Number(e.target.value) })}
                      className="w-full bg-[#121214] border border-white/[0.05] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 mb-1.5">رابط الصورة الخارجية</label>
                    <input
                      type="text"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      className="w-full bg-[#121214] border border-white/[0.05] text-left rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-primary transition-all font-mono"
                      dir="ltr"
                    />
                  </div>
                </div>

                {article.originalUrl && (
                  <div className="pt-2">
                    <a
                      href={article.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-primary hover:underline flex items-center justify-center gap-1 bg-[#121214] py-2 rounded-xl border border-white/[0.04]"
                    >
                      عرض المصدر الأصلي للمقال <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: AI INTEL & QUALITY SCORE */}
          {activeTab === 'ai_intel' && (
            <div className="space-y-6">
              {/* Executive Summary Widget */}
              {article.intelligence && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#18181C]/50 border border-white/[0.03] rounded-3xl p-6">
                  <div className="space-y-2">
                    <span className="text-xs font-black text-gray-300 flex items-center gap-1.5">
                      <Languages className="w-4 h-4 text-primary" /> ملخص تنفيذي عربي (Arabic Brief)
                    </span>
                    <p className="text-xs text-gray-200 leading-relaxed bg-[#121214]/50 border border-white/[0.02] p-4 rounded-2xl">
                      {article.intelligence.summaryAr}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs font-black text-gray-300 flex items-center gap-1.5" dir="ltr">
                      <Languages className="w-4 h-4 text-emerald-400" /> Executive English Summary
                    </span>
                    <p className="text-xs text-gray-300 leading-relaxed bg-[#121214]/50 border border-white/[0.02] p-4 rounded-2xl" dir="ltr">
                      {article.intelligence.summaryEn}
                    </p>
                  </div>
                </div>
              )}

              {/* AI Scores Metrics Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#18181C]/60 border border-white/[0.03] p-5 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] font-black text-gray-400 block flex items-center justify-between">
                    درجة الأهمية الإخبارية <Award className="w-4 h-4 text-amber-400" />
                  </span>
                  <div className="my-3 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white">{article.intelligence?.importanceScore || 70}</span>
                    <span className="text-xs text-gray-500">/١٠٠</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-400 h-full rounded-full" 
                      style={{ width: `${article.intelligence?.importanceScore || 70}%` }}
                    />
                  </div>
                </div>

                <div className="bg-[#18181C]/60 border border-white/[0.03] p-5 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] font-black text-gray-400 block flex items-center justify-between">
                    مؤشر الرواج والتداول <TrendingUp className="w-4 h-4 text-primary" />
                  </span>
                  <div className="my-3 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white">{article.intelligence?.trendingScore || 50}</span>
                    <span className="text-xs text-gray-500">/١٠٠</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-primary h-full rounded-full" 
                      style={{ width: `${article.intelligence?.trendingScore || 50}%` }}
                    />
                  </div>
                </div>

                <div className="bg-[#18181C]/60 border border-white/[0.03] p-5 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] font-black text-gray-400 block flex items-center justify-between">
                    درجة العاجل والخطورة <Zap className="w-4 h-4 text-red-400 animate-pulse" />
                  </span>
                  <div className="my-3 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white">{article.intelligence?.breakingScore || 30}</span>
                    <span className="text-xs text-gray-500">/١٠٠</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-red-400 h-full rounded-full" 
                      style={{ width: `${article.intelligence?.breakingScore || 30}%` }}
                    />
                  </div>
                </div>

                <div className="bg-[#18181C]/60 border border-white/[0.03] p-5 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] font-black text-gray-400 block flex items-center justify-between">
                    مستوى صعوبة المحتوى <BookOpen className="w-4 h-4 text-indigo-400" />
                  </span>
                  <div className="my-4">
                    <span className={`px-4 py-2 rounded-xl text-xs font-black block text-center ${getDifficultyBadge(article.intelligence?.difficulty)}`}>
                      {article.intelligence?.difficulty || 'متوسط'}
                    </span>
                  </div>
                  <span className="text-[9px] text-indigo-400 font-bold block text-center">يقيس سلاسة صياغة الخبر للجمهور</span>
                </div>
              </div>

              {/* Quality Score Analysis */}
              <div className="bg-[#18181C]/40 border border-white/[0.03] rounded-3xl p-6 space-y-5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-gray-300 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-400" /> تقييم جودة الصياغة الإخبارية (News Quality Diagnostics)
                  </span>
                  <div className="flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    <span className="text-[10px] font-black text-emerald-400">معدل الجودة:</span>
                    <span className="text-xs font-black text-white">{article.intelligence?.qualityScore || 80}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                  {[
                    { label: 'الأصالة وعدم التكرار', val: article.intelligence?.qualityBreakdown?.originality || 80, color: 'bg-emerald-400' },
                    { label: 'اكتمال التفاصيل والحقائق', val: article.intelligence?.qualityBreakdown?.completeness || 85, color: 'bg-indigo-400' },
                    { label: 'التوافق مع السيو محلياً', val: article.intelligence?.qualityBreakdown?.seo || 75, color: 'bg-amber-400' },
                    { label: 'سلاسة القراءة للمتصفح', val: article.intelligence?.qualityBreakdown?.readability || 85, color: 'bg-pink-400' },
                    { label: 'حداثة وتوقيت النشر', val: article.intelligence?.qualityBreakdown?.freshness || 90, color: 'bg-sky-400' },
                    { label: 'سلامة الصورة والمرفقات', val: article.intelligence?.qualityBreakdown?.mediaQuality || 70, color: 'bg-rose-400' },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-[#121214]/50 border border-white/[0.02] p-4 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-gray-400">{item.label}</span>
                        <span className="text-white font-black">{item.val}%</span>
                      </div>
                      <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SMART SPORTS DETECTION & LINKING */}
          {activeTab === 'sports_link' && (
            <div className="space-y-6">
              {/* Sports Metadata Cards */}
              <div className="bg-[#18181C]/50 border border-white/[0.03] rounded-3xl p-6 space-y-5">
                <span className="text-xs font-black text-gray-300 block flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-primary" /> تفاصيل التصنيف والوقائع الرياضية المستخرجة
                </span>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'البطولة / المسابقة', value: article.sportsDetection?.competition || 'غير محدد', icon: Award },
                    { label: 'الدوري المرتبط', value: article.sportsDetection?.league || 'عام', icon: Award },
                    { label: 'الموسم الرياضي', value: article.sportsDetection?.season || '2025/2026', icon: Activity },
                    { label: 'الجولة / الدور', value: article.sportsDetection?.round || 'غير محدد', icon: Activity },
                    { label: 'المدرب المستهدف', value: article.sportsDetection?.coach || 'غير محدد', icon: User },
                    { label: 'ملعب المباراة', value: article.sportsDetection?.stadium || 'غير محدد', icon: MapPin },
                    { label: 'حكم الساحة', value: article.sportsDetection?.referee || 'غير محدد', icon: User },
                    { label: 'تاريخ الحدث المعين', value: article.sportsDetection?.matchDate || 'غير محدد', icon: Award },
                  ].map((field, idx) => {
                    const Icon = field.icon;
                    return (
                      <div key={idx} className="bg-[#121214]/50 border border-white/[0.02] p-4 rounded-xl space-y-1 text-right">
                        <span className="text-[10px] font-bold text-gray-400 block flex items-center gap-1">
                          <Icon className="w-3.5 h-3.5 text-primary" /> {field.label}
                        </span>
                        <span className="text-xs font-black text-white block truncate">{field.value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Linked Database Entities */}
              <div className="bg-[#18181C]/40 border border-white/[0.03] rounded-3xl p-6 space-y-4">
                <span className="text-xs font-black text-gray-300 block flex items-center gap-1.5">
                  <Link2 className="w-4 h-4 text-emerald-400" /> كيانات قاعدة البيانات المتصلة تلقائياً (Smart Entity Link)
                </span>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[#121214]/60 border border-white/[0.02] p-4 rounded-xl">
                    <span className="text-[10px] text-gray-400 font-bold block mb-2">الفرق المتصلة بقاعدة البيانات</span>
                    {article.smartLinks?.teamIds && article.smartLinks.teamIds.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {article.smartLinks.teamIds.map((tid, idx) => (
                          <span key={idx} className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-lg border border-emerald-500/20">
                            Team ID: {tid}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-500 italic block">لم يتم العثور على روابط فرق مسجلة</span>
                    )}
                  </div>

                  <div className="bg-[#121214]/60 border border-white/[0.02] p-4 rounded-xl">
                    <span className="text-[10px] text-gray-400 font-bold block mb-2">اللاعبون المتصلون بقاعدة البيانات</span>
                    {article.smartLinks?.playerIds && article.smartLinks.playerIds.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {article.smartLinks.playerIds.map((pid, idx) => (
                          <span key={idx} className="bg-indigo-500/10 text-indigo-400 text-[10px] font-bold px-2 py-1 rounded-lg border border-indigo-500/20">
                            Player ID: {pid}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-500 italic block">لم يتم العثور على روابط لاعبين مسجلة</span>
                    )}
                  </div>

                  <div className="bg-[#121214]/60 border border-white/[0.02] p-4 rounded-xl">
                    <span className="text-[10px] text-gray-400 font-bold block mb-2">مباراة أو مسابقة مباشرة مرتبطة</span>
                    <div className="space-y-1.5">
                      {article.smartLinks?.matchId && (
                        <div className="bg-amber-500/10 text-amber-400 text-[10px] font-bold px-2 py-1 rounded-lg border border-amber-500/20 w-fit">
                          Match ID Connected: {article.smartLinks.matchId}
                        </div>
                      )}
                      {article.smartLinks?.worldCupPageLinked && (
                        <div className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2 py-1 rounded-lg border border-blue-500/20 w-fit">
                          World Cup Segment Page Attached
                        </div>
                      )}
                      {!article.smartLinks?.matchId && !article.smartLinks?.worldCupPageLinked && (
                        <span className="text-[10px] text-gray-500 italic block">لا روابط مباريات حية مستخرجة</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: IMAGE INTELLIGENCE */}
          {activeTab === 'media_intel' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Media Settings Inputs */}
              <div className="lg:col-span-2 space-y-5">
                <div className="bg-[#18181C]/50 border border-white/[0.03] rounded-3xl p-5 space-y-4">
                  <span className="text-xs font-black text-gray-300 block">توليد نصوص الصور والتوصيف</span>
                  
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1.5">النص البديل لمحركات البحث (ALT Text)</label>
                    <input
                      type="text"
                      value={formData.imageAlt}
                      onChange={(e) => setFormData({ ...formData, imageAlt: e.target.value })}
                      placeholder="صف عناصر الصورة بدقة لمكفوفي البصر ومحركات البحث"
                      className="w-full bg-[#121214] border border-white/[0.05] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-primary transition-all font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1.5">شرح ووصف الصورة الأسفل (Caption)</label>
                    <input
                      type="text"
                      value={formData.imageCaption}
                      onChange={(e) => setFormData({ ...formData, imageCaption: e.target.value })}
                      placeholder="توصيف قصير للصحيفة يعرض تحت الصورة مباشرة"
                      className="w-full bg-[#121214] border border-white/[0.05] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-primary transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1.5">حقوق الصورة والائتمان الفني (Credit)</label>
                    <input
                      type="text"
                      value={formData.imageCredit}
                      onChange={(e) => setFormData({ ...formData, imageCredit: e.target.value })}
                      placeholder="أو نام المصدر الأصلي مثل: رويترز / جيتي"
                      className="w-full bg-[#121214] border border-white/[0.05] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Media library suggestions sidebar */}
              <div className="space-y-5 bg-[#18181C]/40 border border-white/[0.03] rounded-2xl p-5 h-fit">
                <span className="text-xs font-black text-gray-300 block flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-primary" /> مقترحات مكتبة الصور والوسائط المعتمدة
                </span>

                {article.imageIntel?.suggestedImages && article.imageIntel.suggestedImages.length > 0 ? (
                  <div className="space-y-3.5">
                    <p className="text-[10px] text-gray-400 leading-normal">تطابق الكيانات الرياضية مع أرشيف ميديا سفارة ٩٠ الفعلي. انقر لاختيارها كصورة رئيسية للمقال:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {article.imageIntel.suggestedImages.map((imgUrl, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => setFormData({ ...formData, imageUrl: imgUrl })}
                          className={`relative aspect-video rounded-lg overflow-hidden border cursor-pointer group transition-all ${
                            formData.imageUrl === imgUrl ? 'border-primary ring-2 ring-primary/20' : 'border-white/[0.05] hover:border-white/25'
                          }`}
                        >
                          <img 
                            src={imgUrl} 
                            alt="Suggested element" 
                            className="object-cover w-full h-full group-hover:scale-105 transition-all"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                            <span className="text-[9px] font-black text-primary">تطبيق الصورة</span>
                          </div>
                          {formData.imageUrl === imgUrl && (
                            <div className="absolute top-1 right-1 bg-primary text-black p-0.5 rounded-md">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#121214] p-5 rounded-xl text-center border border-white/[0.02] space-y-2">
                    <AlertCircle className="w-5 h-5 text-gray-500 mx-auto" />
                    <span className="text-[10px] text-gray-500 block">لا يوجد صور مقترحة متطابقة حالياً بالأرشيف</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: AI EDITOR SUGGESTIONS */}
          {activeTab === 'ai_editor' && (
            <div className="space-y-6">
              {/* Headline & Meta Suggestions */}
              {article.aiEditor && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Headline Alternative Column */}
                  <div className="bg-[#18181C]/50 border border-white/[0.03] p-5 rounded-2xl space-y-4">
                    <span className="text-xs font-black text-gray-300 flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-primary" /> عناوين بديلة مخصصة للنقر
                    </span>
                    <div className="space-y-2.5">
                      {article.aiEditor.headlineSuggestions?.map((head, idx) => (
                        <div key={idx} className="bg-[#121214]/60 p-3 rounded-xl border border-white/[0.02] relative group">
                          <p className="text-xs font-bold text-gray-200 pl-8 leading-relaxed">{head}</p>
                          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, title: head }));
                                handleCopyText(head, `head-${idx}`);
                              }}
                              className="bg-primary/10 hover:bg-primary/20 text-primary p-1.5 rounded-lg transition-all"
                              title="تطبيق على المقال"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SEO & Descriptions Suggestions Column */}
                  <div className="bg-[#18181C]/50 border border-white/[0.03] p-5 rounded-2xl space-y-4">
                    <span className="text-xs font-black text-gray-300 flex items-center gap-1.5">
                      <Search className="w-4 h-4 text-emerald-400" /> اقتراحات السيو (SEO & Meta)
                    </span>
                    <div className="space-y-3">
                      <div className="bg-[#121214]/60 p-3 rounded-xl border border-white/[0.02] space-y-1.5 relative group">
                        <span className="text-[9px] font-bold text-gray-400 block">عنوان السيو المقترح:</span>
                        <p className="text-xs font-bold text-emerald-400 leading-normal">{article.aiEditor.seoTitleSuggestion}</p>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, metaTitle: article.aiEditor!.seoTitleSuggestion }));
                            handleCopyText(article.aiEditor!.seoTitleSuggestion, 'seotitle');
                          }}
                          className="absolute left-2.5 bottom-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[9px] font-black px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                        >
                          تطبيق العنوان
                        </button>
                      </div>

                      <div className="bg-[#121214]/60 p-3 rounded-xl border border-white/[0.02] space-y-1.5 relative group">
                        <span className="text-[9px] font-bold text-gray-400 block">وصف الميتا المقترح:</span>
                        <p className="text-xs text-gray-300 leading-relaxed">{article.aiEditor.metaDescriptionSuggestion}</p>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, metaDescription: article.aiEditor!.metaDescriptionSuggestion }));
                            handleCopyText(article.aiEditor!.metaDescriptionSuggestion, 'metadesc');
                          }}
                          className="absolute left-2.5 bottom-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[9px] font-black px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                        >
                          تطبيق الوصف
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Structural Feedback Column */}
                  <div className="bg-[#18181C]/50 border border-white/[0.03] p-5 rounded-2xl space-y-4">
                    <span className="text-xs font-black text-indigo-400 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" /> تحليل الهيكل البنيوي للنص
                    </span>
                    <div className="bg-[#121214]/60 p-4 rounded-xl border border-white/[0.02] space-y-2.5">
                      <p className="text-xs text-gray-300 leading-relaxed">
                        {article.aiEditor.structureSuggestion}
                      </p>
                      <div className="pt-2 border-t border-white/[0.03] space-y-1.5">
                        <span className="text-[9px] font-bold text-indigo-400 block">الكلمات الدلالية المقترحة:</span>
                        <div className="flex flex-wrap gap-1">
                          {article.aiEditor.keywordsSuggestion?.map((keyword, index) => (
                            <span key={index} className="bg-white/5 text-gray-400 text-[9px] px-2 py-0.5 rounded-md border border-white/[0.02]">
                              #{keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action alert */}
              <div className="flex items-center gap-2.5 bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 text-xs text-blue-400 leading-normal">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  نصيحة تدوينية: يمكنك تطبيق اقتراحات العناوين، ترويسات السيو، وأوصاف الميتا بضغطة زر واحدة من خلال تمرير الماوس فوق صندوق الاقتراح والنقر على زر التطبيق المباشر.
                </span>
              </div>
            </div>
          )}

          {/* Alert notifying about copy successes */}
          {copySuccess && (
            <div className="fixed bottom-6 left-6 bg-[#161619] border border-primary/20 text-primary rounded-xl px-4 py-3 text-xs font-black shadow-lg animate-fade-in flex items-center gap-1.5 z-50">
              <Check className="w-4 h-4" /> تم تطبيق الاقتراح وحفظه بنجاح!
            </div>
          )}

          {/* Notice Banner */}
          <div className="flex items-center gap-2 bg-[#18181C]/40 border border-white/[0.03] rounded-2xl p-4 text-xs text-gray-400 leading-relaxed">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
            <span>
              قاعدة التوطين المعتمدة: التعديلات والتغييرات التي تقوم بحفظها الآن يتم تخزينها مباشرة في Firestore كبيانات مؤكدة للنشر وتُحدث السجلات بالكامل.
            </span>
          </div>

          {/* Footer buttons */}
          <div className="flex justify-end gap-2 pt-5 border-t border-white/[0.05] shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="bg-transparent hover:bg-white/5 text-gray-400 px-6 py-2.5 rounded-2xl text-xs font-bold transition-all"
            >
              إلغاء وإغلاق
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-primary hover:bg-[#DDF242] text-black px-6 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all"
            >
              <Save className="w-4 h-4" /> {saving ? 'جاري حفظ التعديلات...' : 'تثبيت وحفظ بيانات ذكاء المقال'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
