import React, { useState } from 'react';
import { RssImportedArticle, RssProvider } from '../types';
import {
  Check,
  X,
  Edit2,
  Cpu,
  ExternalLink,
  Search,
  Filter,
  Calendar,
  User,
  Clock,
  ChevronDown,
  Award,
  Users,
  Eye,
  RefreshCw
} from 'lucide-react';
import { formatTimeAgo } from '../utils';

interface Props {
  articles: RssImportedArticle[];
  providers: RssProvider[];
  loading: boolean;
  filters: { status: string; providerId: string; search: string };
  onUpdateFilters: (filters: Partial<{ status: string; providerId: string; search: string }>) => void;
  onUpdateStatus: (id: string, status: string, publishSchedule?: string) => Promise<any>;
  onReclassify: (id: string) => Promise<any>;
  onEditArticle: (article: RssImportedArticle) => void;
}

export function RssImportQueue({
  articles,
  providers,
  loading,
  filters,
  onUpdateFilters,
  onUpdateStatus,
  onReclassify,
  onEditArticle
}: Props) {
  const [searchInput, setSearchInput] = useState(filters.search);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [reclassifyingId, setReclassifyingId] = useState<string | null>(null);

  const [schedulePublishId, setSchedulePublishId] = useState<string | null>(null);
  const [scheduleTime, setScheduleTime] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateFilters({ search: searchInput });
  };

  const handleStatusChange = async (id: string, status: string, schedule?: string) => {
    setProcessingId(id);
    try {
      await onUpdateStatus(id, status, schedule);
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
      setSchedulePublishId(null);
    }
  };

  const handleRunAi = async (id: string) => {
    setReclassifyingId(id);
    try {
      await onReclassify(id);
    } catch (err) {
      console.error(err);
    } finally {
      setReclassifyingId(null);
    }
  };

  const statuses = [
    { id: 'REVIEW', label: 'بانتظار المراجعة' },
    { id: 'APPROVED', label: 'مقبول للنشر' },
    { id: 'PUBLISHED', label: 'منشور تلقائياً' },
    { id: 'REJECTED', label: 'مرفوض' }
  ];

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-[#121214] border border-white/[0.05] rounded-3xl p-5">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="ابحث في عنوان المقال أو محتواه..."
              className="w-full bg-[#18181C] border border-white/[0.05] rounded-2xl pr-11 pl-4 py-3 text-xs text-white focus:outline-none focus:border-primary transition-all"
            />
          </div>

          {/* Provider Filter */}
          <div className="relative w-full md:w-56">
            <select
              value={filters.providerId}
              onChange={(e) => onUpdateFilters({ providerId: e.target.value })}
              className="w-full bg-[#18181C] border border-white/[0.05] rounded-2xl px-4 py-3 text-xs text-white appearance-none focus:outline-none focus:border-primary transition-all font-bold"
            >
              <option value="">كافة المصادر</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>

          <button
            type="submit"
            className="bg-primary hover:bg-[#DDF242] text-black text-xs font-black px-6 py-3 rounded-2xl transition-all whitespace-nowrap active:scale-95"
          >
            تصفية النتائج
          </button>
        </form>

        {/* Tab filters */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/[0.03]">
          {statuses.map((st) => (
            <button
              key={st.id}
              onClick={() => onUpdateFilters({ status: st.id })}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filters.status === st.id
                  ? 'bg-primary/10 text-primary border border-primary/25'
                  : 'bg-[#18181C] text-gray-400 border border-white/[0.03] hover:text-white'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : articles.length === 0 ? (
        <div className="bg-[#121214] border border-white/[0.05] rounded-3xl p-16 text-center">
          <Filter className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-sm font-bold text-gray-300">لا توجد مقالات تطابق خيارات التصفية</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            حدد تصفية أخرى أو انتظر تفعيل جلب RSS التلقائي من مصادر التغذية
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((art) => {
            const isProcessing = processingId === art.id;
            const isReclassifying = reclassifyingId === art.id;

            return (
              <div
                key={art.id}
                className="bg-[#121214] border border-white/[0.05] rounded-3xl p-5 hover:border-white/[0.1] transition-all flex flex-col lg:flex-row gap-5"
              >
                {/* Image */}
                <div className="w-full lg:w-48 h-32 rounded-2xl bg-[#18181C] border border-white/[0.05] overflow-hidden shrink-0 relative">
                  <img
                    src={art.imageUrl || '/data/rss_fallback.jpg'}
                    alt={art.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as any).src = '/data/rss_fallback.jpg';
                    }}
                  />
                  <span className="absolute top-2 right-2 text-[9px] font-black bg-black/60 backdrop-blur-md text-primary px-2.5 py-1 rounded-full border border-white/10">
                    {art.sourceName}
                  </span>
                </div>

                {/* Body Content */}
                <div className="flex-1 space-y-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      {art.classification?.articleType && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/10">
                          {art.classification.articleType}
                        </span>
                      )}
                      {art.classification?.league && art.classification.league !== 'عام' && (
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/10">
                          {art.classification.league}
                        </span>
                      )}
                      {art.classification?.country && art.classification.country !== 'عالمي' && (
                        <span className="text-[10px] font-bold text-gray-400 bg-[#18181C] px-2 py-0.5 rounded-md border border-white/[0.05]">
                          {art.classification.country}
                        </span>
                      )}
                      {art.intelligence?.importanceScore !== undefined && (
                        <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/15" title="درجة الأهمية">
                          ★ أهمية: {art.intelligence.importanceScore}
                        </span>
                      )}
                      {art.intelligence?.trendingScore !== undefined && (
                        <span className="text-[10px] font-black text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/15" title="مؤشر الرواج">
                          ↗ رواج: {art.intelligence.trendingScore}
                        </span>
                      )}
                      {art.intelligence?.qualityScore !== undefined && (
                        <span className="text-[10px] font-black text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-500/15" title="معدل الجودة الإجمالي">
                          ✓ جودة: {art.intelligence.qualityScore}%
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-black text-white hover:text-primary transition-all leading-relaxed">
                      {art.title}
                    </h3>
                  </div>

                  <p className="text-xs text-gray-400 leading-relaxed max-w-3xl line-clamp-2">
                    {art.description}
                  </p>

                  {/* AI Metadata Tags */}
                  <div className="flex flex-wrap items-center gap-4 text-[10px] text-gray-500 pt-1 border-t border-white/[0.02]">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> الكاتب: {art.author}
                    </span>

                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5" /> جُلب {formatTimeAgo(art.createdAt)}
                    </span>

                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> القراءة: {art.seo?.readingTime || 1} د
                    </span>

                    {art.classification?.teams && art.classification.teams.length > 0 && (
                      <span className="flex items-center gap-1 bg-[#18181C] px-2 py-1 rounded-lg text-gray-400">
                        <Users className="w-3.5 h-3.5 text-blue-400" /> الفرق: {art.classification.teams.join('، ')}
                      </span>
                    )}

                    {art.classification?.players && art.classification.players.length > 0 && (
                      <span className="flex items-center gap-1 bg-[#18181C] px-2 py-1 rounded-lg text-gray-400">
                        <Award className="w-3.5 h-3.5 text-amber-500" /> اللاعبون: {art.classification.players.join('، ')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions & Workflows */}
                <div className="flex lg:flex-col justify-end lg:justify-between items-end gap-3 shrink-0 lg:border-r lg:border-white/[0.03] lg:pr-5">
                  <div className="flex items-center gap-1.5 w-full lg:w-auto">
                    <a
                      href={art.originalUrl}
                      target="_blank"
                      referrerPolicy="no-referrer"
                      className="p-2.5 rounded-xl bg-[#18181C] border border-white/[0.05] text-gray-400 hover:text-white transition-all hover:bg-[#23232C]"
                      title="عرض المصدر الأصلي"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    <button
                      onClick={() => onEditArticle(art)}
                      className="p-2.5 rounded-xl bg-[#18181C] border border-white/[0.05] text-gray-400 hover:text-white transition-all hover:bg-[#23232C]"
                      title="تعديل التفاصيل والتصنيفات"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleRunAi(art.id)}
                      disabled={isReclassifying}
                      className="p-2.5 rounded-xl bg-[#18181C] border border-white/[0.05] text-emerald-400 hover:bg-emerald-500/10 transition-all"
                      title="إعادة التصنيف والتحليل بالذكاء الاصطناعي"
                    >
                      <Cpu className={`w-4 h-4 ${isReclassifying ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  {/* Approve / Reject buttons */}
                  {art.status === 'REVIEW' && (
                    <div className="flex items-center gap-2 w-full lg:w-auto mt-2">
                      <button
                        onClick={() => handleStatusChange(art.id, 'REJECTED')}
                        disabled={isProcessing}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-[#18181C] hover:bg-red-550/10 text-red-400 text-xs font-bold transition-all border border-red-500/10"
                      >
                        <X className="w-3.5 h-3.5" /> رفض
                      </button>

                      <button
                        onClick={() => setSchedulePublishId(art.id)}
                        className="px-3 py-2 rounded-xl bg-[#18181C] text-gray-400 hover:text-white border border-white/[0.05] text-xs font-bold flex items-center justify-center gap-1"
                        title="جدولة النشر"
                      >
                        <Calendar className="w-3.5 h-3.5" /> جدولة
                      </button>

                      <button
                        onClick={() => handleStatusChange(art.id, 'APPROVED')}
                        disabled={isProcessing}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-1 px-4 py-2 rounded-xl bg-primary hover:bg-[#DDF242] text-black text-xs font-black transition-all"
                      >
                        <Check className="w-3.5 h-3.5 font-bold" /> قبول
                      </button>
                    </div>
                  )}

                  {art.status === 'APPROVED' && (
                    <button
                      onClick={() => handleStatusChange(art.id, 'PUBLISHED')}
                      disabled={isProcessing}
                      className="w-full lg:w-auto px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-4 h-4" /> نشر على الموقع الآن
                    </button>
                  )}

                  {art.status === 'REJECTED' && (
                    <button
                      onClick={() => handleStatusChange(art.id, 'REVIEW')}
                      disabled={isProcessing}
                      className="w-full lg:w-auto px-4 py-2 bg-[#18181C] text-gray-400 border border-white/[0.05] hover:text-white rounded-xl text-xs font-bold transition-all"
                    >
                      إعادة المقال للمراجعة
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Scheduler Modal */}
      {schedulePublishId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-white/[0.08] rounded-3xl max-w-sm w-full p-6 text-right" dir="rtl">
            <h3 className="text-md font-black text-white mb-2">جدولة موعد نشر المقال</h3>
            <p className="text-xs text-gray-400 mb-4">اختر التاريخ والوقت الذي سيتم فيه تفعيل ونشر هذا الخبر تلقائياً</p>

            <div className="space-y-4">
              <input
                type="datetime-local"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-full bg-[#18181C] border border-white/[0.05] rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-primary transition-all font-mono"
              />

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setSchedulePublishId(null)}
                  className="bg-transparent hover:bg-white/5 text-gray-400 px-5 py-2.5 rounded-2xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!scheduleTime) {
                      alert('يرجى تحديد وقت الجدولة');
                      return;
                    }
                    handleStatusChange(schedulePublishId, 'APPROVED', new Date(scheduleTime).toISOString());
                  }}
                  className="bg-primary text-black px-6 py-2.5 rounded-2xl text-xs font-black transition-all"
                >
                  تأكيد الجدولة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
