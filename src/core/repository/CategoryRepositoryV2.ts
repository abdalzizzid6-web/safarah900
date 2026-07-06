import { BaseRepository } from './BaseRepository';
import { NewsCategory } from '../../admin/news/types';
import { addDoc, collection, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export class CategoryRepositoryV2 extends BaseRepository<NewsCategory> {
  constructor() {
    super('news_categories');
  }

  async createCategory(name: string, description?: string): Promise<NewsCategory> {
    const slug = name.trim().toLowerCase()
      .replace(/[\s_]+/g, '-')
      .replace(/[^\w\u0600-\u06FF-]/g, '');
    
    const newCategory: Omit<NewsCategory, 'id'> = {
      name,
      slug,
      description,
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'news_categories'), newCategory);
    return {
      id: docRef.id,
      ...newCategory
    };
  }

  async updateCategory(id: string, name: string, description?: string): Promise<void> {
    const slug = name.trim().toLowerCase()
      .replace(/[\s_]+/g, '-')
      .replace(/[^\w\u0600-\u06FF-]/g, '');
    
    const docRef = doc(db, 'news_categories', id);
    await updateDoc(docRef, {
      name,
      slug,
      description
    });
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(db, 'news_categories', id);
    await deleteDoc(docRef);
  }
}
export const categoryRepositoryV2 = new CategoryRepositoryV2();
