import { useState, useEffect, useCallback } from 'react';
import { repositories } from '../../../core/repository';
import { NewsTag } from '../types';

export function useNewsTags() {
  const [tags, setTags] = useState<NewsTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTags = useCallback(async () => {
    try {
      const data = await repositories.newsTags.getAll(200);
      setTags(data.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err: any) {
      console.error('Error loading tags:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  const addTag = useCallback(async (name: string): Promise<NewsTag | null> => {
    try {
      const trimmedName = name.trim();
      const slug = trimmedName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u0600-\u06FF-]/g, '');
      
      // Check if tag already exists in state
      const existing = tags.find(t => t.name.toLowerCase() === trimmedName.toLowerCase() || t.slug === slug);
      if (existing) return existing;

      const newTag: Omit<NewsTag, 'id'> = {
        name: trimmedName,
        slug,
        createdAt: new Date().toISOString()
      };

      const createdId = await repositories.newsTags.create(newTag);
      const created: NewsTag = { id: createdId, ...newTag };
      
      setTags(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      return created;
    } catch (err: any) {
      setError(err.message || 'فشل في إضافة الوسم');
      return null;
    }
  }, [tags]);

  return {
    tags,
    loading,
    error,
    addTag,
    refresh: loadTags
  };
}
