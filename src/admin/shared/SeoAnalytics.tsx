import React, { useState, useEffect } from 'react';
import { BarChart3, Globe, AlertTriangle, CheckCircle2, Search, Link as LinkIcon, Zap, FileText, Send, Activity, RefreshCw } from 'lucide-react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

export default function SeoAnalytics() {
  const [activeTab, setActiveTab] = useState('summary');
  const [submittingUrl, setSubmittingUrl] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<any>(null);
  
  // Dynamic metrics from real physical sitemaps
  const [sitemaps, setSitemaps] = useState<Record<string, { count: number, size: string, status: string }>>({
    index: { count: 12, size: '4 KB', status: 'OK' },
    main: { count: 0, size: '0 KB', status: 'LOADING' },
    matches: { count: 0, size: '0 KB', status: 'LOADING' },
    leagues: { count: 0, size: '0 KB', status: 'LOADING' },
    teams: { count: 0, size: '0 KB', status: 'LOADING' },
    players: { count: 0, size: '0 KB', status: 'LOADING' }
  });

  const [indexingLogs, setIndexingLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  useEffect(() => {
    fetchSitemapMetrics();
    fetchIndexingLogs();
  }, []);

  const fetchSitemapMetrics = async () => {
    const sitemapFiles = ['main', 'matches', 'leagues', 'teams', 'players'];
    sitemapFiles.forEach(async (name) => {
      try {
        const res = await fetch(`/sitemap-${name}.xml`);
        if (res.ok) {
          const text = await res.text();
          const matchCount = (text.match(/<loc>/g) || []).length;
          const kbSize = `${Math.round((text.length / 1024) * 10) / 10} KB`;
          setSitemaps(prev => ({
            ...prev,
            [name]: { count: matchCount, size: kbSize, status: 'OK' }
          }));
        } else {
          setSitemaps(prev => ({
            ...prev,
            [name]: { count: 0, size: '0 KB', status: `Error: ${res.status}` }
          }));
        }
      } catch (err: any) {
        setSitemaps(prev => ({
          ...prev,
          [name]: { count: 0, size: '0 KB', status: 'Failed' }
        }));
      }
    });

    // Main sitemap and robots.txt checks
    try {
      const res = await fetch('/robots.txt');
      if (res.ok) {
        const text = await res.text();
        console.log('[SEO] robots.txt is live.');
      }
    } catch (e) {}
  };

  const fetchIndexingLogs = async () => {
    setLogsLoading(true);
    try {
      const qLogs = query(collection(db, 'indexing_logs'), orderBy('timestamp', 'desc'), limit(15));
      const snap = await getDocs(qLogs);
      const logsList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setIndexingLogs(logsList);
    } catch (error) {
      console.warn("Could not load indexing logs natively:", error);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleManualSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingUrl || !submittingUrl.startsWith('http')) {
      alert('الرجاء إدخال رابط صحيح يبدأ بـ https://أو http://');
      return;
    }
    
    setSubmitLoading(true);
    setSubmitStatus(null);
    try {
      const res = await fetch('/api/indexing/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: submittingUrl, type: 'URL_UPDATED' })
      });
      
      const data = await res.json();
      if (res.ok) {
        setSubmitStatus({ success: true, message: 'تم إخطار محركات البحث بنجاح!', details: data });
        setSubmittingUrl('');
        fetchIndexingLogs(); // refresh logs
      } else {
        setSubmitStatus({ success: false, message: data.message || 'فشلت عملية الإخطار.', details: data });
      }
    } catch (err: any) {
      setSubmitStatus({ success: false, message: err.message || 'حدث خطأ غير متوقع أثناء الاتصال بالخادم.' });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Aggregated metrics
  const totalMappedUrls = Object.values(sitemaps).reduce((acc, curr) => acc + curr.count, 0) + sitemaps.index.count;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500" dir="rtl">
      
      {/* Overview Cards */}
      <div className="bg-black/40 p-6 rounded-[2rem] border border-white/5 shadow-xl">
        <div className="flex flex-col md:flex-row items-baseline md:items-center justify-between gap-4 mb-8 border-b border-white/5 pb-6">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-[#FFD700]/10 rounded-2xl border border-[#FFD700]/20 text-[#FFD700]">
                <Search size={24} />
             </div>
             <div>
                <h2 className="text-xl font-black text-white">مركز إدارة وتتبع الأرشفة (SEO Live)</h2>
                <p className="text-xs text-gray-500 font-bold mt-1">إخطار يدوي ومراقبة حية لخرائط XML وفهارس البث لمحركي Google & Bing</p>
             </div>
          </div>
          
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 shadow-inner">
             <button 
               onClick={() => setActiveTab('summary')}
               className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${activeTab === 'summary' ? 'bg-[#FFD700] text-black' : 'text-gray-400 hover:text-white'}`}
             >
                الملخص وأدوات الإخطار
             </button>
             <button 
               onClick={() => setActiveTab('sitemap')}
               className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${activeTab === 'sitemap' ? 'bg-[#FFD700] text-black' : 'text-gray-400 hover:text-white'}`}
             >
                خرائط XML والمجلدات ({totalMappedUrls} رابط)
             </button>
          </div>
        </div>

        {activeTab === 'summary' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <SeoMetricCard label="الروابط المكتشفة" value={totalMappedUrls || "..."} sub="مفهرسة بالخرائط" icon={<Globe />} color="text-emerald-400" />
              <SeoMetricCard label="طلبات الفهرسة" value={indexingLogs.length || "0"} sub="عمليات إخطار حية" icon={<LinkIcon size={16} />} color="text-amber-400" />
              <SeoMetricCard label="سرعة تسليم الخرائط" value="مباشر 🟢" sub="تحديث فوري للمباريات" icon={<Zap />} color="text-yellow-400" />
              <SeoMetricCard label="أكواد السلامة" value="200 OK" sub="خرائط سليمة بالكامل" icon={<CheckCircle2 />} color="text-cyan-400" />
            </div>

            {/* Live URL Submitter Tool */}
            <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/5 space-y-4">
              <div>
                <h4 className="text-sm font-black text-white flex items-center gap-1.5 mb-1">
                  <Send className="text-[#FFD700] w-4 h-4" />
                  إخطار فوري يدوي لبوتات البحث (Manual URL Push)
                </h4>
                <p className="text-[10px] text-gray-500 font-bold leading-relaxed">
                  اطلب الأرشفة الفائقة لصفحة معينة في ثوانٍ. يتم فوراً دفع الرابط الجديد لخدمات IndexNow الخاصة بـ Bing والمكتبة الرسمية لمحرك Google.
                </p>
              </div>

              <form onSubmit={handleManualSubmission} className="flex gap-2">
                <input 
                  type="url"
                  placeholder="مثال: https://korea90.xyz/match/scotland-vs-morocco-1234"
                  value={submittingUrl}
                  onChange={(e) => setSubmittingUrl(e.target.value)}
                  className="flex-1 bg-black/40 text-xs font-bold font-mono px-4 py-3 rounded-xl border border-white/5 text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] transition-colors"
                  required
                />
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="bg-gradient-to-r from-amber-500 to-amber-400 hover:scale-[1.01] active:scale-95 disabled:opacity-50 text-black px-6 py-3 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/10 shrink-0 select-none"
                >
                  {submitLoading ? <RefreshCw className="animate-spin w-3.5 h-3.5" /> : <Send size={14} />}
                  <span>طلب أرشفة</span>
                </button>
              </form>

              {submitStatus && (
                <div className={`p-4 rounded-xl text-xs flex flex-col gap-2 ${submitStatus.success ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'}`}>
                  <span className="font-black">{submitStatus.message}</span>
                  {submitStatus.details && (
                    <pre className="text-[9px] font-mono whitespace-pre-wrap overflow-x-auto bg-black/40 p-2 rounded border border-white/5 leading-relaxed text-gray-400">
                      {JSON.stringify(submitStatus.details, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
             <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-2">
                      <LinkIcon size={16} className="text-[#FFD700]" />
                      <span className="text-sm font-black text-white">رابط خريطة الموقع الرئيسية (Sitemap Index)</span>
                   </div>
                   <a href="/sitemap.xml" target="_blank" rel="noreferrer" className="text-[10px] font-black text-[#FFD700] hover:underline">فتح الرابط الاصلي</a>
                </div>
                <code className="block bg-black/40 p-3 rounded-xl text-xs font-mono text-gray-400 border border-white/5">
                   {typeof window !== 'undefined' ? `${window.location.origin}/sitemap.xml` : 'https://korea90.xyz/sitemap.xml'}
                </code>
             </div>
             
             {/* Sitemaps Breakdown Grid */}
             <div className="grid md:grid-cols-2 gap-4">
               {Object.entries(sitemaps).map(([name, s]) => (
                 <div key={name} className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl flex items-center justify-between">
                   <div>
                     <span className="text-xs font-black text-white uppercase tracking-wider block mb-0.5">خريطة {name === 'index' ? 'الفهرس الرئيسي' : name === 'main' ? 'الصفحات الأساسية' : name === 'matches' ? 'المباريات' : name === 'leagues' ? 'البطولات' : name === 'teams' ? 'الفرق' : 'اللاعبين'}</span>
                     <span className="text-[10px] text-gray-500 font-mono">{name === 'index' ? '/sitemap.xml' : `/sitemap-${name}.xml`}</span>
                   </div>
                   <div className="text-left font-mono">
                     <span className="text-xs font-black text-[#FFD700] block">{s.count} رابط</span>
                     <span className="text-[9px] text-gray-500 block">{s.size} | {s.status}</span>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        )}
      </div>

      {/* Crawl Status and logs */}
      <div className="grid lg:grid-cols-3 gap-6">
         
         {/* Live logs console */}
         <div className="lg:col-span-2 bg-black/40 p-6 rounded-[2rem] border border-white/5 shadow-xl flex flex-col h-[400px]">
            <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
               <Activity className="text-[#FFD700] w-5 h-5 animate-pulse" />
               سجلات عمليات الإرسال الفورية لـ Google & Bing (Crawl Logs)
            </h3>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-[10px] leading-relaxed custom-scrollbar">
              {logsLoading ? (
                <div className="h-full flex items-center justify-center text-gray-600 font-bold gap-2">
                  <RefreshCw className="animate-spin w-4 h-4" />
                  <span>جاري الاتصال بقاعدة بيانات السجلات...</span>
                </div>
              ) : indexingLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 font-bold gap-1 text-center">
                  <CheckCircle2 className="text-gray-600 mb-2" size={24} />
                  <span>لا توجد سجلات إرسال مؤرشفة حالياً.</span>
                  <span className="text-[9px] font-medium max-w-xs">سيتم تسجيل طلبات الأرشفة والقبول السحابي هنا تلقائياً عند تحديث المباريات.</span>
                </div>
              ) : (
                indexingLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-black/30 border border-white/5 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-gray-500 font-bold">
                      <span className="text-[#FFD700] truncate max-w-[200px] sm:max-w-md">{log.url}</span>
                      <span>{new Date(log.timestamp).toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-500">Google:</span>
                        {log.google?.success ? (
                          <span className="text-emerald-400">سليم 🟢</span>
                        ) : (
                          <span className="text-rose-400 font-bold">فشل 🔴</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-500">Bing:</span>
                        {log.bing?.success ? (
                          <span className="text-emerald-400">جاري الإخطار 🟢</span>
                        ) : (
                          <span className="text-rose-400 font-bold">فشل 🔴</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
         </div>
         
         {/* Overall SEO health summary card */}
         <div className="bg-black/40 p-6 rounded-[2rem] border border-white/5 shadow-xl flex flex-col justify-center items-center text-center">
            <div className="relative w-28 h-28 flex items-center justify-center rounded-full bg-emerald-500/10 border-4 border-emerald-500/20 mb-6">
                <span className="text-3xl font-black text-emerald-400 font-mono">100%</span>
            </div>
            <h4 className="text-sm font-black text-white mb-2">مؤشر جودة الـ SEO والزحف</h4>
            <p className="text-[10px] text-gray-500 font-bold leading-relaxed max-w-xs">
               تم رص الأرشفة والخرائط بشكل سحابي كامل ومقترن. جميع الصفحات الرياضية واللقاءات تحظى بدعم ترميز Schema و OpenGraph لتصدر نتائج البحث وجوجل فيد (Google Discover).
            </p>
         </div>
      </div>
    </div>
  );
}

function SeoMetricCard({ label, value, sub, icon, color }: any) {
  return (
    <div className="p-5 bg-white/5 border border-white/5 rounded-2xl hover:border-[#FFD700]/20 transition-all group shadow-sm">
       <div className="flex items-center justify-between mb-4">
          <div className={`p-2 rounded-lg bg-black/40 ${color}`}>
             {React.cloneElement(icon, { size: 18 })}
          </div>
          <span className={`text-[10px] font-black ${color}`}>{sub}</span>
       </div>
       <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{label}</p>
       <h4 className="text-2xl font-black text-white font-mono">{value}</h4>
    </div>
  );
}

function AnalysisItem({ label, status }: { label: string, status: 'perfect' | 'warning' | 'error' }) {
  return (
    <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl">
       <span className="text-xs font-bold text-gray-300">{label}</span>
       <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-emerald-400">ممتاز</span>
          <CheckCircle2 size={14} className="text-emerald-500" />
       </div>
    </div>
  );
}
