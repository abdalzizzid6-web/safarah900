import { useState, useCallback } from 'react';
import { SeoIssue, SeoArticle, SitemapsStatus, RobotStatus } from '../types';
import { seoDiagnosticsService } from '../services/seoDiagnosticsService';
import { generateNewsArticleSchema } from '../utils/schemaGenerator';

interface UseSeoStatusProps {
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  showError: (msg: string) => void;
  sitemaps: Record<string, SitemapsStatus>;
  setSitemaps: React.Dispatch<React.SetStateAction<Record<string, SitemapsStatus>>>;
  setRobotsTxt: React.Dispatch<React.SetStateAction<RobotStatus>>;
}

export function useSeoStatus({
  showToast,
  showError,
  sitemaps,
  setSitemaps,
  setRobotsTxt
}: UseSeoStatusProps) {
  const [totalArticles, setTotalArticles] = useState(0);
  const [articlesList, setArticlesList] = useState<SeoArticle[]>([]);
  const [issuesList, setIssuesList] = useState<SeoIssue[]>([]);
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [auditProgress, setAuditProgress] = useState('');

  const runFullSeoAudit = useCallback(async () => {
    setIsRunningAudit(true);
    setAuditProgress('جاري استخراج المقالات الرياضية من خادم Firestore...');
    
    try {
      const fetchedArticles = await seoDiagnosticsService.fetchArticles();
      setArticlesList(fetchedArticles);
      setTotalArticles(fetchedArticles.length);

      const tempIssues: SeoIssue[] = [];
      const slugMap: Record<string, string[]> = {};
      const titleMap: Record<string, string[]> = {};

      setAuditProgress('جاري تصفية المقالات وتحليل معايير محركات البحث (SEO)...');

      fetchedArticles.forEach((article) => {
        const titleStr = article.title || '';
        const slugStr = article.slug || '';
        const seoTitle = article.seo?.title || '';
        const seoDesc = article.seo?.description || '';
        const canonical = article.seo?.canonicalUrl || '';
        const structuredData = article.seo?.structuredData || article.seo?.schema || null;
        
        const imageStr = article.mainImage || article.image || '';
        
        const bodyContent = article.content 
          ? (typeof article.content === 'object' 
              ? (article.content.fullText || article.content.htmlContent) 
              : article.content)
          : article.summary || '';
        
        const bodyStr = typeof bodyContent === 'string' ? bodyContent : JSON.stringify(bodyContent);
        const wordCount = bodyStr.trim().split(/\s+/).filter(Boolean).length;

        // Check 1: Missing Title/SEO Title
        if (!titleStr.trim() && !seoTitle.trim()) {
          tempIssues.push({
            articleId: article.id,
            articleTitle: 'مقال بدون عنوان',
            slug: slugStr,
            type: 'missing_title',
            severity: 'critical',
            message: 'المقال لا يحتوي على أي عنوان رئيسي أو عنوان مخصص للـ SEO.',
            fieldAffected: 'title / seo.title'
          });
        } else if (!seoTitle.trim()) {
          tempIssues.push({
            articleId: article.id,
            articleTitle: titleStr,
            slug: slugStr,
            type: 'missing_title',
            severity: 'warning',
            message: 'عنوان الـ SEO مفقود. سيتم استخدام العنوان العادي افتراضياً.',
            fieldAffected: 'seo.title'
          });
        }

        // Check 2: Missing Description / Summary
        if (!seoDesc.trim()) {
          tempIssues.push({
            articleId: article.id,
            articleTitle: titleStr || 'عنوان غير متوفر',
            slug: slugStr,
            type: 'missing_desc',
            severity: 'critical',
            message: 'وصف المقال مفقود بالكامل، وهو عنصر حرج للأرشفة بمحرك جوجل.',
            fieldAffected: 'seo.description'
          });
        } else if (seoDesc.length < 50) {
          tempIssues.push({
            articleId: article.id,
            articleTitle: titleStr || 'عنوان غير متوفر',
            slug: slugStr,
            type: 'missing_desc',
            severity: 'warning',
            message: 'وصف الـ SEO قصير جداً (أقل من 50 حرف). ينصح بكتابة 120 إلى 160 حرف.',
            fieldAffected: 'seo.description'
          });
        } else if (seoDesc.length > 180) {
          tempIssues.push({
            articleId: article.id,
            articleTitle: titleStr || 'عنوان غير متوفر',
            slug: slugStr,
            type: 'missing_desc',
            severity: 'info',
            message: 'وصف الـ SEO أطول من المعتاد. يفضل أن يكون مقتضباً لتجنب القص بنتائج البحث.',
            fieldAffected: 'seo.description'
          });
        }

        // Check 3: Missing Canonical URL
        if (!canonical.trim()) {
          tempIssues.push({
            articleId: article.id,
            articleTitle: titleStr || 'عنوان غير متوفر',
            slug: slugStr,
            type: 'missing_canonical',
            severity: 'warning',
            message: 'الرابط الكنسي (Canonical URL) مفقود. سيقوم محرك البحث باستخدام الرابط الحالي تلقائياً.',
            fieldAffected: 'seo.canonicalUrl'
          });
        }

        // Check 4: Missing SEO Structured Data Schema
        if (!structuredData) {
          tempIssues.push({
            articleId: article.id,
            articleTitle: titleStr || 'عنوان غير متوفر',
            slug: slugStr,
            type: 'missing_schema',
            severity: 'warning',
            message: 'غياب بيانات التبويب المنظم BreadcrumbList/NewsArticle في الـ SEO.',
            fieldAffected: 'seo.structuredData'
          });
        }

        // Check 5: Missing Featured Image URL
        if (!imageStr.trim()) {
          tempIssues.push({
            articleId: article.id,
            articleTitle: titleStr || 'عنوان غير متوفر',
            slug: slugStr,
            type: 'missing_image',
            severity: 'critical',
            message: 'صورة المقال الرئيسية مفقودة. هذا يسبب مشاكل في تداول المقال على شبكات التواصل.',
            fieldAffected: 'mainImage'
          });
        }

        // Value indexing for duplicates
        if (slugStr.trim()) {
          if (!slugMap[slugStr]) slugMap[slugStr] = [];
          slugMap[slugStr].push(article.id);
        }
        if (titleStr.trim()) {
          if (!titleMap[titleStr]) titleMap[titleStr] = [];
          titleMap[titleStr].push(article.id);
        }

        // Check 6: Thin Content
        if (wordCount < 60) {
          tempIssues.push({
            articleId: article.id,
            articleTitle: titleStr || 'عنوان غير متوفر',
            slug: slugStr,
            type: 'thin_content',
            severity: 'critical',
            message: `محتوى هزيل وضئيل جداً (${wordCount} كلمة). قد يعتبره جوجل سبام أو حشو بلا قيمة فنية.`,
            fieldAffected: 'content.fullText'
          });
        } else if (wordCount < 150) {
          tempIssues.push({
            articleId: article.id,
            articleTitle: titleStr || 'عنوان غير متوفر',
            slug: slugStr,
            type: 'thin_content',
            severity: 'warning',
            message: `مقال قصير (${wordCount} كلمة). يفضل توسيع المقال لتزويد القارئ بالتفاصيل الرياضية التامة.`,
            fieldAffected: 'content.fullText'
          });
        }
      });

      // Check 7: Duplicate Content (Same Slug or Same Title)
      Object.entries(slugMap).forEach(([slug, ids]) => {
        if (ids.length > 1) {
          ids.forEach((id) => {
            const art = fetchedArticles.find((a) => a.id === id);
            tempIssues.push({
              articleId: id,
              articleTitle: art?.title || 'عنوان بانتظار التحقق',
              slug: slug,
              type: 'duplicate_content',
              severity: 'critical',
              message: `رابط مكرر ومستنسخ (Slug: ${slug}). هذا يؤثر سلبياً للغاية على أرشفة الموقع.`,
              fieldAffected: 'slug'
            });
          });
        }
      });

      Object.entries(titleMap).forEach(([title, ids]) => {
        if (ids.length > 1) {
          ids.forEach((id) => {
            const art = fetchedArticles.find((a) => a.id === id);
            const exists = tempIssues.some(
              (iss) => iss.articleId === id && iss.type === 'duplicate_content' && iss.message.includes('العنوان')
            );
            if (!exists) {
              tempIssues.push({
                articleId: id,
                articleTitle: title,
                slug: art?.slug || '',
                type: 'duplicate_content',
                severity: 'warning',
                message: 'عنوان مكرر تماماً مع مقال آخر في قاعدة البيانات الكروية.',
                fieldAffected: 'title'
              });
            }
          });
        }
      });

      // 2. Load and verify robots.txt
      setAuditProgress('جاري الاتصال بخادم الويب لتحليل robots.txt...');
      try {
        const text = await seoDiagnosticsService.fetchRobotsTxt();
        const hasSitemapUrl = text.toLowerCase().includes('sitemap:') && text.includes('sitemap.xml');
        const allowsAll = text.includes('Allow: /') || text.includes('Allow:  /');
        setRobotsTxt({
          status: 'OK',
          hasSitemapUrl,
          allowsAll,
          content: text
        });
      } catch (e: any) {
        setRobotsTxt({ status: 'ERROR', hasSitemapUrl: false, allowsAll: false, content: e.message || 'خطأ أثناء الاتصال' });
        tempIssues.push({
          articleId: 'server-robots',
          articleTitle: 'Robots.txt',
          slug: 'static',
          type: 'sitemap_issue',
          severity: 'critical',
          message: `ملف robots.txt يعيد حالة خطأ من الويب مسبباً مشاكل أرشفة. كود: ${e.message}`,
          fieldAffected: 'robots.txt'
        });
      }

      // 3. Load and verify Sitemaps
      setAuditProgress('جاري مسح واختبار خرائط الموقع Sitemaps التلقائية...');
      const sitemapNames = Object.keys(sitemaps);
      for (const name of sitemapNames) {
        const sitemapUrl = sitemaps[name].url;
        try {
          const rawXml = await seoDiagnosticsService.fetchSitemapContent(sitemapUrl);
          const urlMatches = rawXml.match(/<url>/g) || [];
          const sitemapMatches = rawXml.match(/<sitemap>/g) || [];
          const count = Math.max(urlMatches.length, sitemapMatches.length);
          
          setSitemaps(prev => ({
            ...prev,
            [name]: {
              ...prev[name],
              status: 'OK',
              statusCode: 200,
              sizeBytes: rawXml.length,
              urlsCount: count
            }
          }));
        } catch (err: any) {
          console.error(`Error fetching sitemap ${name}:`, err);
          setSitemaps(prev => ({
            ...prev,
            [name]: {
              ...prev[name],
              status: 'ERROR',
              statusCode: err.message?.includes('404') ? 404 : 500,
              sizeBytes: 0,
              urlsCount: 0,
              error: err.message || 'Unknown Error'
            }
          }));
          
          tempIssues.push({
            articleId: `sitemap-${name}`,
            articleTitle: `خريطة ${name}`,
            slug: sitemapUrl,
            type: 'sitemap_issue',
            severity: 'critical',
            message: `خريطة الموقع غير متاحة أو معطلة تماماً. كود الرد: 500`,
            fieldAffected: sitemapUrl
          });
        }
      }

      setIssuesList(tempIssues);
      showToast('تم الانتهاء من الفحص والتشخيص الفوري لـ SEO بنجاح!', 'success');
    } catch (error: any) {
      console.error(error);
      showError('تعذر فحص وعرض تشخيصات الـ SEO الفورية.');
    } finally {
      setIsRunningAudit(false);
      setAuditProgress('');
    }
  }, [sitemaps, setSitemaps, setRobotsTxt, showToast, showError]);

  const repairAllSchemas = useCallback(async () => {
    setIsRunningAudit(true);
    setAuditProgress('جاري تثبيت وتوليد بيانات NewsArticle المنظمة لكافة المقالات...');
    let repairedCount = 0;
    try {
      const articlesWithMissingSchema = articlesList.filter(article => {
        const structuredData = article.seo?.structuredData || article.seo?.schema || null;
        return !structuredData;
      });

      if (articlesWithMissingSchema.length === 0) {
        showToast('جميع المقالات تملك بيانات منظمة مسبقاً!', 'info');
        return;
      }

      for (const article of articlesWithMissingSchema) {
        const newsArticleSchema = generateNewsArticleSchema(article);
        const existingSeo = article.seo || {};
        await seoDiagnosticsService.updateArticleSeo(article.id, {
          'seo.structuredData': newsArticleSchema,
          'seo.title': existingSeo.title || article.title || '',
          'seo.description': existingSeo.description || article.summary || '',
          'seo.canonicalUrl': existingSeo.canonicalUrl || `https://korea90.xyz/news/${article.slug || article.id}`
        });
        repairedCount++;
      }

      showToast(`نجاح! تم توليد وحقن NewsArticle لـ ${repairedCount} مقالات تلقائياً الحين!`, 'success');
      await runFullSeoAudit();
    } catch (err: any) {
      console.error(err);
      showError('فشل التوليد الدفعي لبيانات المنظم المفتوح: ' + err.message);
    } finally {
      setIsRunningAudit(false);
      setAuditProgress('');
    }
  }, [articlesList, runFullSeoAudit, showToast, showError]);

  const executeAutoFix = useCallback(async (issue: SeoIssue) => {
    try {
      const article = articlesList.find(a => a.id === issue.articleId);
      if (!article) return;

      const updatedFields: any = {};
      if (issue.type === 'missing_canonical') {
        const canonicalUrl = `https://korea90.xyz/news/${article.slug || article.id}`;
        updatedFields['seo'] = {
          ...article.seo,
          canonicalUrl: canonicalUrl
        };
      } else if (issue.type === 'missing_title') {
        updatedFields['seo'] = {
          ...article.seo,
          title: article.title || 'عنوان مقال صافرة 90'
        };
      } else if (issue.type === 'missing_desc') {
        const words = (
          (typeof article.content === 'object' 
            ? (article.content.fullText || article.content.htmlContent) 
            : article.content) || article.summary || ''
        ).split(' ');
        const summary = words.slice(0, 25).join(' ') + '...';
        updatedFields['seo'] = {
          ...article.seo,
          description: summary
        };
      } else if (issue.type === 'missing_schema') {
        const newsArticleSchema = generateNewsArticleSchema(article);
        updatedFields['seo'] = {
          ...article.seo,
          structuredData: newsArticleSchema
        };
      }

      if (Object.keys(updatedFields).length > 0) {
        showToast('تمت صياغة التحسين التلقائي! جاري التثبيت في قاعدة البيانات...', 'info');
        await seoDiagnosticsService.updateArticleSeo(article.id, updatedFields);
        showToast('تم إصلاح الإشكال بنجاح وتحديث وسم SEO السحابي!', 'success');
        await runFullSeoAudit();
      }
    } catch (err: any) {
      console.error(err);
      showError('فشل تطبيق الإصلاح الذكي التلقائي: ' + err.message);
    }
  }, [articlesList, runFullSeoAudit, showToast, showError]);

  return {
    totalArticles,
    articlesList,
    issuesList,
    isRunningAudit,
    auditProgress,
    runFullSeoAudit,
    repairAllSchemas,
    executeAutoFix
  };
}
