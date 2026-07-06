import { useState, useEffect, useCallback } from 'react';
import { NewsArticle, NewsArticleStatus, NewsSeo, NewsImage, RelatedContent } from '../types';
import { newsService } from '../services/newsService';
import { newsSeoService } from '../services/newsSeoService';

export function useNewsEditor(articleId?: string, authorUser?: { id: string; name: string; email: string; role: string }) {
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [status, setStatus] = useState<NewsArticleStatus>(NewsArticleStatus.DRAFT);
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [featuredImage, setFeaturedImage] = useState<NewsImage>({ url: '', altText: '', caption: '', credit: '', isWebP: true });
  const [gallery, setGallery] = useState<NewsImage[]>([]);
  const [seo, setSeo] = useState<NewsSeo>({
    title: '',
    slug: '',
    metaTitle: '',
    metaDescription: '',
    canonicalUrl: '',
    keywords: [],
    includeInSitemap: true,
    readingTime: 1
  });
  const [relatedContent, setRelatedContent] = useState<RelatedContent>({
    matches: [],
    teams: [],
    players: [],
    competitions: []
  });
  const [publishDate, setPublishDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load article if editing
  useEffect(() => {
    if (!articleId) {
      // Clear for new article
      setArticle(null);
      setTitle('');
      setContent('');
      setExcerpt('');
      setStatus(NewsArticleStatus.DRAFT);
      setCategories([]);
      setTags([]);
      setFeaturedImage({ url: '', altText: '', caption: '', credit: '', isWebP: true });
      setGallery([]);
      setSeo({
        title: '',
        slug: '',
        metaTitle: '',
        metaDescription: '',
        keywords: [],
        includeInSitemap: true,
        readingTime: 1
      });
      setRelatedContent({ matches: [], teams: [], players: [], competitions: [] });
      setPublishDate('');
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const data = await newsService.getArticleById(articleId);
        if (data) {
          setArticle(data);
          setTitle(data.title);
          setContent(data.content);
          setExcerpt(data.excerpt || '');
          setStatus(data.status);
          setCategories(data.categories || []);
          setTags(data.tags || []);
          setFeaturedImage(data.featuredImage || { url: '', altText: '', caption: '', credit: '', isWebP: true });
          setGallery(data.gallery || []);
          setSeo(data.seo || { title: '', slug: '', metaTitle: '', metaDescription: '', keywords: [], includeInSitemap: true, readingTime: 1 });
          setRelatedContent(data.relatedContent || { matches: [], teams: [], players: [], competitions: [] });
          setPublishDate(data.publishDate || '');
        }
      } catch (err: any) {
        setError(err.message || 'فشل في تحميل المقال للتعديل');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [articleId]);

  // Handle live title changes to generate dynamic slug and default seo values
  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle);
    if (!articleId) {
      const generated = newsSeoService.generateDefaultSeo(newTitle, content, categories, tags);
      setSeo(prev => ({
        ...prev,
        title: newTitle,
        slug: generated.slug,
        metaTitle: generated.metaTitle,
        metaDescription: generated.metaDescription,
        canonicalUrl: generated.canonicalUrl
      }));
    }
  }, [content, categories, tags, articleId]);

  // Save changes (creates or updates)
  const save = useCallback(async (overridingStatus?: NewsArticleStatus) => {
    if (!title.trim()) {
      throw new Error('يرجى إدخال عنوان المقال');
    }
    setSaving(true);
    setError(null);

    const targetStatus = overridingStatus || status;

    const payload = {
      title,
      content,
      excerpt,
      author: authorUser || {
        id: 'editor_1',
        name: 'محرر سفارة ٩٠',
        email: 'editor@korea90.xyz',
        role: 'News Editor'
      },
      status: targetStatus,
      categories,
      tags,
      featuredImage,
      gallery,
      seo: {
        ...seo,
        readingTime: newsSeoService.calculateReadingTime(content)
      },
      relatedContent,
      publishDate: targetStatus === NewsArticleStatus.SCHEDULED ? publishDate : (targetStatus === NewsArticleStatus.PUBLISHED ? new Date().toISOString() : undefined)
    };

    try {
      if (articleId) {
        await newsService.updateArticle(articleId, payload, authorUser?.name || 'المحرر');
        return true;
      } else {
        const created = await newsService.createArticle(payload);
        setArticle(created);
        return created.id;
      }
    } catch (err: any) {
      setError(err.message || 'فشل في حفظ المقال');
      return false;
    } finally {
      setSaving(false);
    }
  }, [title, content, excerpt, authorUser, status, categories, tags, featuredImage, gallery, seo, relatedContent, publishDate, articleId]);

  // Rollback to a specific history version
  const rollbackVersion = useCallback(async (versionId: string) => {
    if (!articleId) return false;
    setSaving(true);
    setError(null);
    try {
      await newsService.rollbackVersion(articleId, versionId, authorUser?.name || 'المحرر');
      
      // Reload article to get updated content
      const data = await newsService.getArticleById(articleId);
      if (data) {
        setArticle(data);
        setTitle(data.title);
        setContent(data.content);
        setStatus(data.status);
      }
      return true;
    } catch (err: any) {
      setError(err.message || 'فشل في استرجاع الإصدار السابق');
      return false;
    } finally {
      setSaving(false);
    }
  }, [articleId, authorUser]);

  return {
    article,
    title,
    content,
    excerpt,
    status,
    categories,
    tags,
    featuredImage,
    gallery,
    seo,
    relatedContent,
    publishDate,
    loading,
    saving,
    error,
    setTitle: handleTitleChange,
    setContent,
    setExcerpt,
    setStatus,
    setCategories,
    setTags,
    setFeaturedImage,
    setGallery,
    setSeo,
    setRelatedContent,
    setPublishDate,
    save,
    rollbackVersion
  };
}
