import { db } from '../../../firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp,
  startAfter,
  DocumentSnapshot
} from 'firebase/firestore';
import { NewsArticle, NewsArticleStatus, NewsVersion, NewsSeo } from '../types';
import { newsSeoService } from './newsSeoService';

const NEWS_COLLECTION = 'news';

export const newsService = {
  // Fetch paginated list with optional filters
  async getArticles(filters: {
    status?: NewsArticleStatus;
    category?: string;
    tag?: string;
    search?: string;
    limitSize?: number;
    lastDoc?: DocumentSnapshot;
  } = {}): Promise<{ articles: NewsArticle[]; lastVisible: DocumentSnapshot | null }> {
    try {
      const { status, category, tag, search, limitSize = 20, lastDoc } = filters;
      
      let q = collection(db, NEWS_COLLECTION);
      const queryConstraints: any[] = [];

      if (status) {
        queryConstraints.push(where('status', '==', status));
      }

      if (category) {
        queryConstraints.push(where('categories', 'array-contains', category));
      }

      if (tag) {
        queryConstraints.push(where('tags', 'array-contains', tag));
      }

      // Order by creation date descending
      queryConstraints.push(orderBy('createdAt', 'desc'));
      queryConstraints.push(limit(limitSize));

      if (lastDoc) {
        queryConstraints.push(startAfter(lastDoc));
      }

      const newsQuery = query(q, ...queryConstraints);
      const snapshot = await getDocs(newsQuery);
      
      let articles: NewsArticle[] = [];
      snapshot.forEach(doc => {
        articles.push({ id: doc.id, ...doc.data() } as NewsArticle);
      });

      // Simple client-side client-side text-search for demo safety if search text is provided
      if (search) {
        const lowerSearch = search.toLowerCase();
        articles = articles.filter(a => 
          a.title.toLowerCase().includes(lowerSearch) || 
          a.content.toLowerCase().includes(lowerSearch)
        );
      }

      const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

      return {
        articles,
        lastVisible
      };
    } catch (error) {
      console.error('Error fetching news articles:', error);
      return { articles: [], lastVisible: null };
    }
  },

  // Get article by ID
  async getArticleById(id: string): Promise<NewsArticle | null> {
    try {
      const docRef = doc(db, NEWS_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as NewsArticle;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching article with ID ${id}:`, error);
      return null;
    }
  },

  // Create standard template dynamic news article
  async createArticle(data: Omit<NewsArticle, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'views' | 'clicks'>): Promise<NewsArticle> {
    const timestamp = new Date().toISOString();
    
    // Automatically pre-fill SEO
    const seo: NewsSeo = data.seo || newsSeoService.generateDefaultSeo(
      data.title, 
      data.content, 
      data.categories, 
      data.tags
    );

    // Compute reading time
    seo.readingTime = newsSeoService.calculateReadingTime(data.content);

    const newArticle: Omit<NewsArticle, 'id'> = {
      ...data,
      seo,
      version: 1,
      views: 0,
      clicks: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
      history: []
    };

    // Auto append structured NewsArticle data
    const finalArticleObj = {
      ...newArticle,
      seo: {
        ...seo,
        structuredData: newsSeoService.generateStructuredData(newArticle as NewsArticle)
      }
    };

    const docRef = await addDoc(collection(db, NEWS_COLLECTION), finalArticleObj);
    return {
      id: docRef.id,
      ...finalArticleObj
    } as NewsArticle;
  },

  // Update with version history logging
  async updateArticle(id: string, updates: Partial<NewsArticle>, updatedBy: string): Promise<void> {
    const docRef = doc(db, NEWS_COLLECTION, id);
    const existing = await this.getArticleById(id);
    if (!existing) throw new Error('Article not found');

    const timestamp = new Date().toISOString();
    const nextVersion = (existing.version || 1) + 1;

    // Track historical version for rollbacks
    const historyItem: NewsVersion = {
      id: `v_${nextVersion}_${Date.now()}`,
      version: existing.version || 1,
      updatedAt: existing.updatedAt || timestamp,
      updatedBy: existing.author?.name || 'محرر مجهول',
      title: existing.title,
      content: existing.content,
      status: existing.status
    };

    const mergedHistory = [...(existing.history || []), historyItem];

    // Compute read time if content is updated
    if (updates.content) {
      if (!updates.seo) updates.seo = existing.seo;
      updates.seo.readingTime = newsSeoService.calculateReadingTime(updates.content);
    }

    const finalUpdates = {
      ...updates,
      version: nextVersion,
      updatedAt: timestamp,
      history: mergedHistory
    };

    await updateDoc(docRef, finalUpdates);
  },

  // Delete / Remove completely
  async deleteArticle(id: string): Promise<void> {
    const docRef = doc(db, NEWS_COLLECTION, id);
    await deleteDoc(docRef);
  },

  // Status transitions
  async transitionStatus(id: string, status: NewsArticleStatus, updatedBy: string): Promise<void> {
    const updates: Partial<NewsArticle> = { status };
    if (status === NewsArticleStatus.PUBLISHED) {
      updates.publishDate = new Date().toISOString();
    }
    await this.updateArticle(id, updates, updatedBy);
  },

  // Restore previous historical version
  async rollbackVersion(id: string, versionId: string, updatedBy: string): Promise<void> {
    const article = await this.getArticleById(id);
    if (!article || !article.history) throw new Error('Article or version history not found');

    const previousVer = article.history.find(h => h.id === versionId);
    if (!previousVer) throw new Error('Target version not found');

    await this.updateArticle(id, {
      title: previousVer.title,
      content: previousVer.content,
      status: previousVer.status
    }, updatedBy);
  }
};
