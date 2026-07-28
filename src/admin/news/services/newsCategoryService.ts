import { NewsCategory } from '../types';
import { categoryRepositoryV2 } from '../../../core/repository/CategoryRepositoryV2';

export const newsCategoryService = {
  // Fetch all categories
  async getCategories(): Promise<NewsCategory[]> {
    return await categoryRepositoryV2.getAll() as NewsCategory[];
  },

  // Save or create category
  async createCategory(name: string, description?: string): Promise<NewsCategory> {
    return await categoryRepositoryV2.createCategory(name, description) as NewsCategory;
  },

  // Update category
  async updateCategory(id: string, updates: Partial<NewsCategory>): Promise<void> {
    await categoryRepositoryV2.update(id, updates);
  },

  // Delete category
  async deleteCategory(id: string): Promise<void> {
    await categoryRepositoryV2.delete(id);
  },

  // Seed default categories
  async seedDefaultCategories(): Promise<void> {
    const existing = await categoryRepositoryV2.getAll();
    if (existing.length === 0) {
      const defaults = [
        { name: 'كرة عالمية', description: 'أخبار الدوريات والأندية العالمية' },
        { name: 'كرة عربية', description: 'أخبار البطولات والأندية العربية' },
        { name: 'ميركاتو والانتقالات', description: 'أحدث أخبار وشائعات صفقات اللاعبين' },
        { name: 'دوري أبطال أوروبا', description: 'تغطية شاملة لبطولة ذات الأذنين' },
        { name: 'تحليلات وتكتيك', description: 'قراءات فنيه وتقارير تكتيكية عميقة' },
        { name: 'كأس العالم 2026', description: 'كل ما يخص التحضيرات للحدث العالمي' }
      ];
      for (const cat of defaults) {
        await categoryRepositoryV2.createCategory(cat.name, cat.description);
      }
    }
  }
};
