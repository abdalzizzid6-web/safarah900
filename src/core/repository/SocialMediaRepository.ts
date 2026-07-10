import { collection, doc, getDoc, getDocs, query, where, orderBy, limit, setDoc, updateDoc, deleteDoc, Timestamp, addDoc, startAfter } from 'firebase/firestore';
import { db } from '../../firebase';
import { BaseRepository } from './BaseRepository';

export interface SocialAccount {
  id: string;
  platform: string;
  name: string;
  handle?: string;
  avatarUrl?: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Timestamp;
  status: 'active' | 'expired' | 'disconnected' | 'error';
  permissions: string[];
  metadata: Record<string, any>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SocialPost {
  id: string;
  accountId: string;
  platform: string;
  content: string;
  mediaUrls?: string[];
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';
  scheduledFor?: Timestamp;
  publishedAt?: Timestamp;
  externalPostId?: string;
  externalUrl?: string;
  errorMessage?: string;
  analytics?: {
    likes: number;
    shares: number;
    comments: number;
    views: number;
    reach: number;
    clicks: number;
  };
  metadata: Record<string, any>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SocialSetting {
  id: string;
  key: string;
  value: any;
  updatedAt: Timestamp;
}

export class SocialMediaRepository extends BaseRepository<SocialAccount> {
  constructor() {
    super('social_accounts');
  }

  async getActiveAccounts(): Promise<SocialAccount[]> {
    return this.query([where('status', '==', 'active')]);
  }

  async getPosts(options: { 
    status?: SocialPost['status'], 
    platform?: string, 
    limitCount?: number,
    lastDoc?: any 
  } = {}) {
    let constraints: any[] = [];
    if (options.status) constraints.push(where('status', '==', options.status));
    if (options.platform) constraints.push(where('platform', '==', options.platform));
    
    constraints.push(orderBy('createdAt', 'desc'));
    if (options.limitCount) constraints.push(limit(options.limitCount));
    if (options.lastDoc) constraints.push(startAfter(options.lastDoc));

    const q = query(collection(db, 'social_posts'), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SocialPost));
  }

  async createPost(post: Omit<SocialPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'social_posts'), {
      ...post,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  }

  async updatePost(id: string, updates: Partial<SocialPost>): Promise<void> {
    const docRef = doc(db, 'social_posts', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  }

  async deletePost(id: string): Promise<void> {
    const docRef = doc(db, 'social_posts', id);
    await deleteDoc(docRef);
  }

  async getSetting(key: string): Promise<any | null> {
    const docRef = doc(db, 'social_settings', key);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data().value : null;
  }

  async setSetting(key: string, value: any): Promise<void> {
    const docRef = doc(db, 'social_settings', key);
    await setDoc(docRef, { key, value, updatedAt: Timestamp.now() }, { merge: true });
  }
}
