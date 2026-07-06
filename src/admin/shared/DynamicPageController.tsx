import React, { useState, useEffect } from 'react';
import { FileText, Save, RefreshCw, ChevronLeft, ShieldCheck, Layers } from 'lucide-react';
import { pagesRepositoryV2, PageDoc } from '../../core/repository/PagesRepositoryV2';
import { useError } from '../../context/ErrorContext';

const STATIC_PAGES = [
  { id: 'about', label: 'عن المنصة (About Us)', defaultTitle: 'من نحن - منصة صافرة 90', defaultContent: '# من نحن\n\nنحن منصة صافرة 90، الوجهة الأولى لكل عشاق الرياضة وعالم كرة القدم.' },
  { id: 'privacy', label: 'سياسة الخصوصية (Privacy Policy)', defaultTitle: 'سياسة الخصوصية - صافرة 90', defaultContent: '# سياسة الخصوصية\n\nنحن في صافرة 90 نلتزم التزاماً صارماً بحماية خصوصيتك وبياناتك الشخصية.' },
  { id: 'terms', label: 'شروط الاستخدام (Terms of Service)', defaultTitle: 'شروط وأحكام الاستخدام - صافرة 90', defaultContent: '# شروط الاستخدام\n\nباستخدامك لمنصة صافرة 90، فإنك توافق على الالتزام بالشروط والأحكام الخاصة بنا.' },
  { id: 'dmca', label: 'حقوق النشر (DMCA & Copyright)', defaultTitle: 'حقوق الطبع والنشر وحماية الملكية الفكرية', defaultContent: '# حقوق الطبع والنشر\n\nتحترم صافرة 90 حقوق الملكية الفكرية للآخرين وتلتزم ببنود قانون المجمع الرقمي لحماية حقوق المؤلف.' },
  { id: 'advertising', label: 'الاتفاقية الإعلانية (Advertising)', defaultTitle: 'المساحات الإعلانية وشروط النشر', defaultContent: '# المساحات الإعلانية\n\nنرحب بالاتفاقيات الإعلانية والشراكات التجارية معنا في منصة صافرة 90.' }
];

export default function DynamicPageController() {
  const { showToast } = useError();
  const [selectedPageId, setSelectedPageId] = useState<string>('privacy');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchPageData = async (pageId: string) => {
    setLoading(true);
    try {
      const data = await pagesRepositoryV2.getPage(pageId);
      
      if (data) {
        setTitle(data.title || '');
        setContent(data.content || '');
      } else {
        // Fallback to static defaults
        const defaults = STATIC_PAGES.find(p => p.id === pageId);
        setTitle(defaults?.defaultTitle || '');
        setContent(defaults?.defaultContent || '');
      }
    } catch (err: any) {
      showToast('خطأ في جلب بيانات الصفحة: ' + err.message, 'warning');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPageData(selectedPageId);
  }, [selectedPageId]);

  const handleSavePage = async () => {
    if (!title.trim() || !content.trim()) {
      showToast('يرجى ملء عنوان ومحتوى الصفحة', 'warning');
      return;
    }
    setSaving(true);
    try {
      await pagesRepositoryV2.savePage({
        id: selectedPageId,
        title,
        content
      });
      showToast('تم حفظ وحفظ تعديلات الصفحة بنجاح! 💾✨', 'success');
    } catch (err: any) {
      showToast('خطأ في حفظ الصفحة: ' + err.message, 'warning');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8" dir="rtl">
      {/* List Sidebar */}
      <div className="space-y-3 lg:col-span-1">
        <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2 px-1">الصفحات القانونية والتعريفية</label>
        <div className="flex flex-col gap-1.5">
          {STATIC_PAGES.map((page) => (
            <button
              key={page.id}
              onClick={() => setSelectedPageId(page.id)}
              className={`p-4 rounded-2xl border text-right transition-all flex items-center justify-between group ${
                selectedPageId === page.id
                  ? 'bg-primary/20 border-primary text-white font-black'
                  : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/[0.08] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText size={16} className={selectedPageId === page.id ? 'text-primary' : 'text-gray-500'} />
                <span className="text-xs">{page.label}</span>
              </div>
              <ChevronLeft size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </div>

      {/* Editor Main Canvas */}
      <div className="lg:col-span-3 space-y-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8">
        <div className="flex items-center justify-between border-b border-white/5 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Layers className="text-primary" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">تعديل محتوى الصفحة</h2>
              <p className="text-xs text-gray-500 font-bold mt-1">تتحكم في محتوى ومظهر الصفحات التعريفية المعروضة للمستخدمين لحظياً.</p>
            </div>
          </div>
          <button
            onClick={() => fetchPageData(selectedPageId)}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-400 hover:text-white"
            title="إعادة التحديث"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-500">
            <RefreshCw className="animate-spin text-primary" size={24} />
            <p className="text-xs font-bold font-mono">جاري تحميل بيانات الصفحة...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-black text-gray-400 mb-2">عنوان الصفحة (Page Title)</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="اسم الصفحة في شريط المتصفح وعنوان الـ SEO"
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-black focus:outline-none focus:border-primary text-white"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-black text-gray-400">محتوى الصفحة (بصيغة Markdown أو HTML)</label>
                <span className="text-[10px] text-gray-500 font-bold">الفقرات والعناوين تدعم التنسيق الغني</span>
              </div>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="اكتب تفاصيل المحتوى هنا..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-primary text-slate-350 min-h-[300px] font-mono leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <span className="text-[10px] text-gray-500 flex items-center gap-1.5 font-bold">
                <ShieldCheck size={12} className="text-emerald-500" />
                تعديلك لهذه الصفحة يلغي تلقائيتنا ويلتزم بفرضه فوراً.
              </span>
              <button
                type="button"
                onClick={handleSavePage}
                disabled={saving}
                className="px-8 py-3.5 bg-primary text-black font-black text-xs rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? 'جاري الحفظ...' : 'حفظ ونشر التعديلات'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
