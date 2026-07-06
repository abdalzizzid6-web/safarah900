import { db } from '../../../firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { NewsCategory } from '../types';
import { categoryRepositoryV2 } from '../../../core/repository/CategoryRepositoryV2';
import { featureFlags } from '../../../core/config/featureFlags';

const CATEGORIES_COLLECTION = 'news_categories';

export const newsCategoryService = {
  async _legacyGetCategories(): Promise<NewsCategory[]> {
      try {
      const q = query(collection(db, CATEGORIES_COLLECTION), orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      const categories: NewsCategory[] = [];
      snapshot.forEach(doc => {
        categories.push({ id: doc.id, ...doc.data() } as NewsCategory);
      });
      return categories;
    } catch (error) {
      console.error('Error fetching categories from Firestore:', error);
      return [];
    }
  },

  // Fetch all categories
  async getCategories(): Promise<NewsCategory[]> {
    if (featureFlags.useNewsV2) {
        return await categoryRepositoryV2.getAll();
    }
    // Seed default categories if none exist for legacy mode
    await this.seedDefaultCategories();
    return await this._legacyGetCategories();
  },

  // Save or create category
  async createCategory(name: string, description?: string): Promise<NewsCategory> {
    if (featureFlags.useNewsV2) {
        return await categoryRepositoryV2.createCategory(name, description);
    }
    const slug = name.trim().toLowerCase()
      .replace(/[\s_]+/g, '-')
      .replace(/[^\w\u0600-\u06FF-]/g, ''); // supports Arabic characters as well
    
    const newCategory: Omit<NewsCategory, 'id'> = {
      name,
      slug,
      description,
      createdAt: new Date().toISOString()
    };
    
    // Legacy needs to use 'addDoc'
    const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), newCategory);
    return {
      id: docRef.id,
      ...newCategory
    };
  },

  // Update a category
  async updateCategory(id: string, name: string, description?: string): Promise<void> {
    if (featureFlags.useNewsV2) {
        return await categoryRepositoryV2.updateCategory(id, name, description);
    }
    const slug = name.trim().toLowerCase()
      .replace(/[\s_]+/g, '-')
      .replace(/[^\w\u0600-\u06FF-]/g, '');
    
    const docRef = doc(db, CATEGORIES_COLLECTION, id);
    await updateDoc(docRef, {
      name,
      slug,
      description
    });
  },

  // Delete a category
  async deleteCategory(id: string): Promise<void> {
    if (featureFlags.useNewsV2) {
        return await categoryRepositoryV2.delete(id);
    }
    const docRef = doc(db, CATEGORIES_COLLECTION, id);
    await deleteDoc(docRef);
  },

  // Seed default categories if empty
  async seedDefaultCategories(): Promise<NewsCategory[]> {
    const existing = await this.getCategories();
    if (existing.length > 0) return existing;

    const defaults = [
      { name: 'كأس العالم', description: 'تغطية شاملة ومباشرة لبطولة كأس العالم ٢٠٢٦' },
      { name: 'الانتقالات', description: 'أحدث أخبار وشائعات سوق انتقالات اللاعبين والمدربين' },
      { name: 'أخبار عاجلة', description: 'تغطية فورية للأحداث الرياضية الساخنة لحظة بلحظة' },
      { name: 'الكرة المحلية', description: 'متابعة حية وتحليلات لمسابقات كرة القدم المحلية والدوريات العربية' },
      { name: 'الكرة العالمية', description: 'أخبار وتقارير الدوريات الأوروبية والمسابقات العالمية الكبرى' },
      { name: 'تحليلات رياضية', description: 'دراسات فنية وتكتيكية للمباريات والفرق واللاعبين بواسطة خبراء' },
      { name: 'مقابلات وحوارات', description: 'لقاءات حصرية وحوارات شيقة مع نجوم الرياضة والمدربين والمسؤولين' },
      { name: 'انفرادات وحصريات', description: 'أخبار حصرية وتقارير خاصة بـ سفير 90 لا تجدها في مكان آخر' }
    ];

    const seeded: NewsCategory[] = [];
    for (const d of defaults) {
      const cat = await this.createCategory(d.name, d.description);
      seeded.push(cat);
    }
    return seeded;
  }
};
