import React, { useState } from 'react';
import { useNewsCategories } from '../hooks/useNewsCategories';
import { Plus, FolderEdit, Trash2, Edit2, AlertCircle } from 'lucide-react';

export function NewsCategoriesPage() {
  const { categories, loading, error, addCategory, updateCategory, deleteCategory } = useNewsCategories();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingId) {
      const success = await updateCategory(editingId, name, desc);
      if (success) {
        setEditingId(null);
        setName('');
        setDesc('');
      }
    } else {
      const success = await addCategory(name, desc);
      if (success) {
        setName('');
        setDesc('');
      }
    }
  };

  const handleEditClick = (id: string, currentName: string, currentDesc?: string) => {
    setEditingId(id);
    setName(currentName);
    setDesc(currentDesc || '');
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
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        <div>
          <h3 className="text-xl font-black text-white">إدارة تصنيفات الأخبار</h3>
          <p className="text-xs text-gray-500 mt-1">تحديد الهياكل التصنيفية لتنظيم الأخبار والمقالات الرياضية بشكل مرتب</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categories form */}
        <div className="bg-[#121214] border border-white/[0.05] p-6 rounded-3xl h-fit space-y-4">
          <h4 className="font-extrabold text-white text-sm">{editingId ? 'تعديل التصنيف المختار' : 'إضافة تصنيف جديد'}</h4>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-400">اسم التصنيف</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#18181C] border border-white/[0.05] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-primary text-right"
                placeholder="مثال: انتقالات اللاعبين"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-400">الوصف العام</label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={3}
                className="w-full bg-[#18181C] border border-white/[0.05] rounded-xl p-4 text-xs text-white focus:outline-none focus:border-primary text-right placeholder-gray-600"
                placeholder="صف هذا القسم أو التصنيف بفقرة قصيرة..."
              />
            </div>

            <div className="flex justify-end gap-2">
              {editingId && (
                <button
                  type="button"
                  onClick={() => { setEditingId(null); setName(''); setDesc(''); }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
              )}
              <button
                type="submit"
                className="bg-primary text-black flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all"
              >
                <Plus className="w-4 h-4" /> {editingId ? 'تحديث التصنيف' : 'إضافة القسم'}
              </button>
            </div>
          </form>
        </div>

        {/* Categories list */}
        <div className="lg:col-span-2 bg-[#121214] border border-white/[0.05] p-6 rounded-3xl space-y-4">
          <h4 className="font-extrabold text-white text-sm">التصنيفات الحالية في قاعدة البيانات</h4>
          
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <FolderEdit className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-xs">لا توجد تصنيفات معرفة حالياً</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((cat) => (
                <div key={cat.id} className="bg-[#18181C] border border-white/[0.03] hover:border-white/10 p-4 rounded-2xl flex justify-between items-start flex-row-reverse transition-all">
                  <div className="space-y-1">
                    <h5 className="font-extrabold text-white text-sm">{cat.name}</h5>
                    <span className="inline-block bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-mono">
                      /{cat.slug}
                    </span>
                    {cat.description && (
                      <p className="text-[11px] text-gray-500 leading-relaxed mt-1">{cat.description}</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditClick(cat.id, cat.name, cat.description)}
                      className="p-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => { if (confirm('هل أنت متأكد من رغبتك في حذف هذا التصنيف نهائياً؟')) deleteCategory(cat.id); }}
                      className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default NewsCategoriesPage;
