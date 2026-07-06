import { doc, getDoc, setDoc, collection, query, where, orderBy, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';

export interface PageContent {
  title: string;
  content: string;
  updatedAt?: string;
}

export const getPageContent = async (pageId: string): Promise<PageContent | null> => {
  try {
    const docRef = doc(db, 'pages', pageId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as PageContent;
    }
    return null;
  } catch (error) {
    console.error(`[cmsRepository] Error getting page content for ${pageId}:`, error);
    throw error;
  }
};

export const updatePageContent = async (pageId: string, data: PageContent) => {
  const docRef = doc(db, 'pages', pageId);
  await setDoc(docRef, {
    ...data,
    updatedAt: new Date().toISOString()
  });
};

export const getAnnouncements = async () => {
  try {
    const q = query(
      collection(db, 'announcements'),
      where('active', '==', true),
      orderBy('priority', 'desc')
    );

    const snapshot = await getDocs(q);
    const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    // Secondary sort in JS to avoid needing complex composite indexes
    return all.sort((a: any, b: any) => {
      if (b.priority !== a.priority) return (b.priority || 0) - (a.priority || 0);
      return b.createdAt && a.createdAt ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() : 0;
    });
  } catch (error) {
    console.error('[cmsRepository] Error getting announcements:', error);
    return [];
  }
};

export const trackInstallWidgetStat = async (type: 'impression' | 'dismiss' | 'install') => {
  try {
    const timestamp = Date.now();
    const rand = Math.random().toString(36).substring(2, 10);
    const customId = `stat_${type}_${timestamp}_${rand}`;
    
    await setDoc(doc(db, 'install_widget_stats', customId), {
      type,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('[cmsRepository] Error tracking install widget stat:', error);
  }
};
