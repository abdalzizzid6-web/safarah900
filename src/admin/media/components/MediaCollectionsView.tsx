import React, { useState } from 'react';
import { Award, FolderPlus, Star, Pin, Heart, Trash2, ArrowRight, Settings, Sparkles, LayoutGrid } from 'lucide-react';
import { MediaCollection, MediaAsset, MediaType } from '../types';

interface MediaCollectionsViewProps {
  collections: MediaCollection[];
  assets: MediaAsset[];
  onCreateCollection: (name: string, description: string, isSmart: boolean, rules?: MediaCollection['smartRules']) => Promise<void>;
  onDeleteCollection: (id: string) => Promise<void>;
  onUpdateCollection: (id: string, updates: Partial<MediaCollection>) => Promise<void>;
}

export default function MediaCollectionsView({
  collections,
  assets,
  onCreateCollection,
  onDeleteCollection,
  onUpdateCollection
}: MediaCollectionsViewProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [isSmart, setIsSmart] = useState(false);
  const [smartTag, setSmartTag] = useState('');
  const [smartType, setSmartType] = useState<MediaType | 'all'>('all');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let rules: MediaCollection['smartRules'] = undefined;
    if (isSmart) {
      rules = {
        tags: smartTag ? smartTag.split(',').map(t => t.trim()) : [],
        mediaType: smartType === 'all' ? undefined : smartType
      };
    }

    await onCreateCollection(name.trim(), desc.trim(), isSmart, rules);
    
    // Reset form
    setName('');
    setDesc('');
    setIsSmart(false);
    setSmartTag('');
    setSmartType('all');
    setIsCreating(false);
  };

  const countCollectionAssets = (collection: MediaCollection) => {
    if (collection.isSmart && collection.smartRules) {
      const ruleTags = collection.smartRules.tags || [];
      const ruleType = collection.smartRules.mediaType;

      return assets.filter(a => {
        const tagsMatch = ruleTags.length === 0 || ruleTags.some(t => a.tags.includes(t));
        const typeMatch = !ruleType || a.mediaType === ruleType;
        return tagsMatch && typeMatch;
      }).length;
    }
    return assets.filter(a => a.collectionIds?.includes(collection.id)).length;
  };

  const toggleFavorite = async (collection: MediaCollection) => {
    await onUpdateCollection(collection.id, { isFavorite: !collection.isFavorite });
  };

  const togglePin = async (collection: MediaCollection) => {
    await onUpdateCollection(collection.id, { isPinned: !collection.isPinned });
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-black text-white">إدارة الألبومات والمجموعات الذكية</h3>
          <p className="text-xs text-gray-400 mt-1">تجميع الملفات لتغطية مناسبات معينة أو بطولات دورية مخصصة للعمل الإعلامي.</p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <FolderPlus size={14} />
          <span>إنشاء ألبوم جديد</span>
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="bg-[#111112] p-5 rounded-2xl border border-white/5 space-y-4">
          <h4 className="text-xs font-black text-white">إعداد معايير الألبوم الجديد</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 mb-1.5">اسم الألبوم / المجموعة</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: صور كأس العالم للشباب..."
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 mb-1.5">وصف المضمون</label>
              <input
                type="text"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="وصف مبسط لتسهيل الفرز..."
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="bg-black/30 p-4 rounded-xl border border-white/[0.03] space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="smartCheck"
                checked={isSmart}
                onChange={(e) => setIsSmart(e.target.checked)}
                className="w-4 h-4 text-amber-500 bg-black border-white/10 rounded focus:ring-0"
              />
              <label htmlFor="smartCheck" className="text-xs font-black text-white cursor-pointer flex items-center gap-1">
                <Sparkles size={14} className="text-amber-500" />
                <span>تفعيل كـ "ألبوم ذكي" (Smart Collection)</span>
              </label>
            </div>
            
            {isSmart && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-[9px] font-black text-gray-400 mb-1.5">مطابقة الأوسمة (مفصولة بفاصلة)</label>
                  <input
                    type="text"
                    value={smartTag}
                    onChange={(e) => setSmartTag(e.target.value)}
                    placeholder="مثال: ميسي، كاس العالم"
                    className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-gray-400 mb-1.5">مطابقة نوع الملف الافتراضي</label>
                  <select
                    value={smartType}
                    onChange={(e) => setSmartType(e.target.value as MediaType | 'all')}
                    className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="all">كل الأنواع</option>
                    <option value="Images">صور عامة</option>
                    <option value="Logos">شعارات</option>
                    <option value="Player Photos">صور اللاعبين</option>
                    <option value="Stadium Images">صور الملاعب</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 text-black px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer"
            >
              إنشاء وحفظ
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="bg-white/5 text-gray-300 px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-white/10 transition-all cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map(col => {
          const count = countCollectionAssets(col);

          return (
            <div key={col.id} className="bg-[#111112] border border-white/5 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-white/10 transition-all group">
              <div>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <LayoutGrid size={18} className="text-amber-500" />
                    <div>
                      <h4 className="text-xs font-black text-white group-hover:text-amber-500 transition-colors">{col.name}</h4>
                      <p className="text-[10px] text-gray-400 mt-1">{col.description || 'لا يوجد وصف مضاف لقائمة الألبوم'}</p>
                    </div>
                  </div>

                  {col.isSmart && (
                    <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-0.5">
                      <Sparkles size={8} /> مجموعة ذكية
                    </span>
                  )}
                </div>

                {col.isSmart && col.smartRules && (
                  <div className="mt-3 bg-black/40 p-2.5 rounded-lg border border-white/[0.03] space-y-1 text-[9px]">
                    <span className="text-gray-500 font-bold block">القواعد الذكية النشطة:</span>
                    {col.smartRules.tags && col.smartRules.tags.length > 0 && (
                      <span className="text-gray-400 block">الوسوم: <b className="text-emerald-400">{col.smartRules.tags.join(', ')}</b></span>
                    )}
                    {col.smartRules.mediaType && (
                      <span className="text-gray-400 block">النوع: <b className="text-amber-400">{col.smartRules.mediaType}</b></span>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-white/[0.03] flex items-center justify-between">
                <span className="text-[10px] font-black text-gray-400 bg-white/5 px-2.5 py-1 rounded-lg">
                  {count} ملف مضاف
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggleFavorite(col)}
                    className={`p-1.5 rounded-lg border transition-all ${col.isFavorite ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-black/30 border-white/5 text-gray-400 hover:text-white'}`}
                  >
                    <Heart size={12} fill={col.isFavorite ? "currentColor" : "none"} />
                  </button>
                  <button
                    onClick={() => togglePin(col)}
                    className={`p-1.5 rounded-lg border transition-all ${col.isPinned ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-black/30 border-white/5 text-gray-400 hover:text-white'}`}
                  >
                    <Pin size={12} />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`هل أنت متأكد من رغبتك في حذف الألبوم "${col.name}"؟ لن يتم حذف أي من الصور والوسائط بل سيتم تفريغ الألبوم فقط.`)) {
                        onDeleteCollection(col.id);
                      }
                    }}
                    className="p-1.5 bg-red-500/10 hover:bg-red-500 border border-red-500/10 text-red-500 hover:text-white rounded-lg transition-all cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
