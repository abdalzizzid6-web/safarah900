import React, { useState } from 'react';
import { useNewsTags } from '../hooks/useNewsTags';
import { Tag, Plus } from 'lucide-react';

export function NewsTagsPage() {
  const { tags, loading, addTag } = useNewsTags();
  const [newTagName, setNewTagName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    const added = await addTag(newTagName);
    if (added) {
      setNewTagName('');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-right">
      <div>
        <h3 className="text-xl font-black text-white">إدارة الوسوم والهاشتاجات (Tags)</h3>
        <p className="text-xs text-gray-500 mt-1">الوسوم تُستخدم لتوصيل المقالات الإخبارية ببعضها البعض وتسهيل عمليات البحث والأرشفة</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Tag form */}
        <div className="bg-[#121214] border border-white/[0.05] p-6 rounded-3xl h-fit space-y-4">
          <h4 className="font-extrabold text-white text-sm">إضافة وسم جديد</h4>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-400">اسم الوسم (بدون هاشتاج)</label>
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="w-full bg-[#18181C] border border-white/[0.05] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-primary text-right"
                placeholder="مثال: ميركاتو صيفي"
                required
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-primary text-black flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all"
              >
                <Plus className="w-4 h-4" /> إضافة الوسم
              </button>
            </div>
          </form>
        </div>

        {/* Tags cloud display */}
        <div className="lg:col-span-2 bg-[#121214] border border-white/[0.05] p-6 rounded-3xl space-y-4">
          <h4 className="font-extrabold text-white text-sm">أرشيف جميع الكلمات المفتاحية النشطة</h4>
          
          {tags.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-xs">لا توجد وسوم مسجلة حالياً</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2.5 justify-start">
              {tags.map((tag) => (
                <span 
                  key={tag.id} 
                  className="bg-[#18181C] hover:bg-white/5 border border-white/[0.05] px-4 py-2 rounded-2xl text-xs text-gray-300 font-bold transition-all cursor-pointer flex items-center gap-2"
                >
                  <Tag className="w-3.5 h-3.5 text-primary" />
                  #{tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default NewsTagsPage;
