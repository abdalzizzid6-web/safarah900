import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  BookOpen, 
  ShieldAlert, 
  Layers, 
  Globe, 
  Search, 
  Sparkles, 
  ExternalLink 
} from 'lucide-react';
import { useError } from '@/src/context/ErrorContext';
import SEO from '@/src/components/SEO';

// Hooks
import { useSitemapStatus } from './hooks/useSitemapStatus';
import { useSeoStatus } from './hooks/useSeoStatus';
import { useIndexingStatus } from './hooks/useIndexingStatus';

// Components
import { SeoHeader } from './components/SeoHeader';
import { SitemapWidget } from './components/SitemapWidget';
import { RobotsWidget } from './components/RobotsWidget';
import { CanonicalWidget } from './components/CanonicalWidget';
import { MetaTagsWidget } from './components/MetaTagsWidget';
import { StructuredDataWidget } from './components/StructuredDataWidget';
import { BrokenLinksWidget } from './components/BrokenLinksWidget';
import { IndexingStatusWidget } from './components/IndexingStatusWidget';
import { PerformanceWidget } from './components/PerformanceWidget';
import { SeoActionsToolbar } from './components/SeoActionsToolbar';

import { SeoIssue } from './types';

export default function SeoDiagnosticsPage() {
  const navigate = useNavigate();
  const { showToast, showError } = useError();
  const [activeTab, setActiveTab] = useState<'overview' | 'articles' | 'sitemap' | 'linking'>('overview');
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Hook for Sitemaps and RobotsTxt State
  const { sitemaps, setSitemaps, robotsTxt, setRobotsTxt } = useSitemapStatus();

  // 2. Hook for SEO Audit status and repairs
  const {
    totalArticles,
    articlesList,
    issuesList,
    isRunningAudit,
    auditProgress,
    runFullSeoAudit,
    repairAllSchemas,
    executeAutoFix
  } = useSeoStatus({
    showToast,
    showError,
    sitemaps,
    setSitemaps,
    setRobotsTxt
  });

  // 3. Hook for match URL export status
  const { exportMatchUrlsToCsv } = useIndexingStatus({
    showToast,
    showError,
    setAuditProgress: () => {} // Progress is tracked globally or inside useSeoStatus
  });

  const getSeverityBadge = (severity: 'critical' | 'warning' | 'info') => {
    switch (severity) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black bg-rose-500/10 text-rose-400 border border-rose-500/20">
            حرجة جداً ❌
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black bg-amber-500/10 text-amber-500 border border-amber-500/20">
            تنبيه ⚠️
          </span>
        );
      case 'info':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            بيان ℹ️
          </span>
        );
    }
  };

  const filteredIssues = issuesList.filter((issue) => 
    issue.articleTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    issue.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    issue.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#07090e] text-white py-12 px-4 sm:px-6 lg:px-8 font-sans" dir="rtl">
      <SEO 
        title="مركز تشخيصات SEO - لوحة الإشراف" 
        description="فحص شامل لوصف وتطبيق معايير محركات البحث والتسويق الرقمي للأخبار والمباريات."
        noindex={true}
      />
      
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header and navigation */}
        <SeoHeader onBack={() => navigate('/admin')} />

        {/* Highlight metrics cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-2 hover:border-white/10 transition-all">
            <span className="text-xs text-gray-500 font-bold">إجمالي المقالات المفحوصة</span>
            <div className="flex items-baseline justify-between">
              <h3 className="text-2xl font-black font-mono text-white">{totalArticles}</h3>
              <BookOpen className="text-emerald-500 w-5 h-5 shrink-0" />
            </div>
            <p className="text-[10px] text-gray-500 font-medium">مستخرجة مباشرة من Firestore</p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-2 hover:border-white/10 transition-all">
            <span className="text-xs text-gray-500 font-bold">مجموع التنبيهات والأخطاء</span>
            <div className="flex items-baseline justify-between">
              <h3 className="text-2xl font-black font-mono text-rose-500">{issuesList.length}</h3>
              <ShieldAlert className="text-rose-500 w-5 h-5 shrink-0" />
            </div>
            <p className="text-[10px] text-gray-500 font-medium">أعطال ونقوص تفصيلية بالوسوم</p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-2 hover:border-white/10 transition-all">
            <span className="text-xs text-gray-500 font-bold">حالة Robots.txt</span>
            <div className="flex items-baseline justify-between">
              <h3 className="text-normal font-black text-white">
                {robotsTxt.status === 'OK' ? 'سليم ومتصل 🟢' : 'بانتظار الفحص ⚠️'}
              </h3>
              <Layers className="text-amber-500 w-5 h-5 shrink-0" />
            </div>
            <p className="text-[10px] text-gray-500 font-medium">يتضمن إشارة Sitemap الفائقة</p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-2 hover:border-white/10 transition-all">
            <span className="text-xs text-gray-500 font-bold">خرائط الموقع النشطة</span>
            <div className="flex items-baseline justify-between">
              <h3 className="text-2xl font-black font-mono text-cyan-400">
                {Object.values(sitemaps).filter((s) => s.status === 'OK').length} / 6
              </h3>
              <Globe className="text-cyan-400 w-5 h-5 shrink-0" />
            </div>
            <p className="text-[10px] text-gray-500 font-medium">تغطي المباريات والبطولات والفرق واللاعبين</p>
          </div>
        </div>

        {/* Global actions toolbar */}
        <SeoActionsToolbar 
          isRunningAudit={isRunningAudit}
          auditProgress={auditProgress}
          onRunAudit={runFullSeoAudit}
          onRepairSchema={repairAllSchemas}
          onExportMatches={exportMatchUrlsToCsv}
          articlesListLength={articlesList.length}
        />

        {/* Tab Selector */}
        <div className="border-b border-white/5 flex gap-1 overflow-x-auto pb-0.5">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-5 py-3 text-xs font-black border-b-2 transition-all cursor-pointer truncate whitespace-nowrap ${
              activeTab === 'overview' ? 'border-amber-500 text-white' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            نظرة عامة والتقرير الإستراتيجي
          </button>
          <button
            onClick={() => setActiveTab('articles')}
            className={`px-5 py-3 text-xs font-black border-b-2 transition-all cursor-pointer truncate whitespace-nowrap ${
              activeTab === 'articles' ? 'border-amber-500 text-white' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            تدقيق ومسح المقالات ({issuesList.length} مشكلة)
          </button>
          <button
            onClick={() => setActiveTab('sitemap')}
            className={`px-5 py-3 text-xs font-black border-b-2 transition-all cursor-pointer truncate whitespace-nowrap ${
              activeTab === 'sitemap' ? 'border-amber-500 text-white' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            بروتوكول خرائط المواقع والملفات
          </button>
          <button
            onClick={() => setActiveTab('linking')}
            className={`px-5 py-3 text-xs font-black border-b-2 transition-all cursor-pointer truncate whitespace-nowrap ${
              activeTab === 'linking' ? 'border-amber-500 text-white' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            فحص الارتباطات الرياضية والشبكة
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 rounded-[2rem] bg-white/[0.01] border border-white/5 space-y-6">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Sparkles size={18} className="text-amber-500" />
                <span>ملخص التقرير والدرجة الإجمالية لتحسين محركات البحث</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* Score Dial */}
                <PerformanceWidget 
                  totalArticles={totalArticles}
                  issuesCount={issuesList.length}
                />

                {/* Issues distribution widget */}
                <IndexingStatusWidget issues={issuesList} />
              </div>
            </div>

            {/* Structured data status & repairs */}
            <StructuredDataWidget 
              issues={issuesList}
              onRepair={repairAllSchemas}
              isRunningAudit={isRunningAudit}
              articlesListLength={articlesList.length}
            />
          </div>
        )}

        {/* Tab 2: Articles audit */}
        {activeTab === 'articles' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <h3 className="text-base font-black text-white">جدول تدقيق المقالات الرياضية الفوري</h3>
              
              <div className="relative w-full sm:w-72">
                <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="البحث بتنبيهات المقالات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs font-bold py-2.5 pr-9 pl-3 rounded-lg bg-white/5 border border-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {filteredIssues.length === 0 ? (
              <div className="p-12 rounded-[2rem] bg-white/[0.01] border border-white/5 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                <ShieldAlert className="text-emerald-400 w-10 h-10" />
                <h4 className="text-sm font-black text-white">كل شيء على ما يرام تماماً!</h4>
                <p className="text-xs">لم يتم رصد أي مشاكل أرشفة أو نقوصات في المقالات الرياضية المبحوثة.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredIssues.map((issue, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-black text-amber-500">{issue.articleTitle}</h4>
                          {getSeverityBadge(issue.severity)}
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono block">وسم التأثير: {issue.fieldAffected}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {issue.articleId !== 'server-robots' && !issue.articleId.startsWith('sitemap-') && (
                          <button
                            onClick={() => executeAutoFix(issue)}
                            className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-black hover:scale-[1.02] cursor-pointer text-[10px] sm:text-xs font-black transition-all flex items-center gap-1"
                          >
                            <Sparkles size={11} />
                            <span>إصلاح تلقائي سحابي</span>
                          </button>
                        )}

                        {issue.articleId !== 'server-robots' && !issue.articleId.startsWith('sitemap-') && (
                          <Link
                            to={`/news/${issue.articleId}`}
                            target="_blank"
                            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 font-black text-[10px] sm:text-xs transition-all flex items-center gap-1"
                          >
                            <ExternalLink size={11} />
                            <span>معاينة المقال</span>
                          </Link>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-black/20 rounded-xl border border-white/5 text-xs text-gray-400">
                      {issue.message}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Sitemaps / Robots */}
        {activeTab === 'sitemap' && (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="text-base font-black text-white">تفاصيل حالة خرائط الموقع Sitemaps الفورية وملف robots.txt</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SitemapWidget sitemaps={sitemaps} />
              <RobotsWidget robotsTxt={robotsTxt} />
            </div>
          </div>
        )}

        {/* Tab 4: Linking */}
        {activeTab === 'linking' && (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="text-base font-black text-white">الارتباطات التشعبية والربط الداخلي للموقع (Internal Linking Structure)</h3>
            <BrokenLinksWidget />
          </div>
        )}

      </div>
    </div>
  );
}
