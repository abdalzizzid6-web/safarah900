import { useState, useEffect, useCallback } from 'react';
import { db } from '../../../firebase';
import { collection, getDocs, addDoc, query, orderBy, limit } from 'firebase/firestore';
import { NewsTag } from '../types';

const TAGS_COLLECTION = 'news_tags';

export function useNewsTags() {
  const [tags, setTags] = useState<NewsTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTags = useCallback(async () => {
    try {
      const q = query(collection(db, TAGS_COLLECTION), orderBy('name', 'asc'), limit(200));
      const snapshot = await getDocs(q);
      const list: NewsTag[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() } as NewsTag);
      });
      setTags(list);
    } catch (err: any) {
      console.error('Error loading tags:', err);
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

      const docRef = await addDoc(collection(db, TAGS_COLLECTION), newTag);
      const created: NewsTag = { id: docRef.id, ...newTag };
      
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
