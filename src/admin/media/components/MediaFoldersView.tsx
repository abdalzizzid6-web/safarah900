import React, { useState } from 'react';
import { Folder, Plus, Trash2, FolderPlus, FolderOpen, ArrowLeft } from 'lucide-react';
import { MediaFolder, MediaAsset } from '../types';

interface MediaFoldersViewProps {
  folders: MediaFolder[];
  assets: MediaAsset[];
  onCreateFolder: (name: string, parentId: string | null) => Promise<void>;
  onDeleteFolder: (id: string) => Promise<void>;
  onSelectFolder: (id: string | null) => void;
  selectedFolderId: string | null;
}

export default function MediaFoldersView({
  folders,
  assets,
  onCreateFolder,
  onDeleteFolder,
  onSelectFolder,
  selectedFolderId
}: MediaFoldersViewProps) {
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    await onCreateFolder(newFolderName.trim(), null);
    setNewFolderName('');
    setIsCreating(false);
  };

  const getAssetCountInFolder = (folderId: string) => {
    return assets.filter(a => a.folderId === folderId).length;
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-white">إدارة مجلدات النظام</h3>
          <p className="text-xs text-gray-400 mt-1">تنسيق وهيكلة الملفات والمستندات حسب التصنيفات الإدارية لسهولة الفهرسة.</p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <FolderPlus size={14} />
          <span>مجلد جديد</span>
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="bg-[#111112] p-4 rounded-xl border border-white/5 flex gap-3 items-center">
          <input
            type="text"
            required
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="اسم المجلد (مثال: شعارات كأس العالم)..."
            className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer"
          >
            إنشاء المجلد
          </button>
          <button
            type="button"
            onClick={() => setIsCreating(false)}
            className="bg-white/5 text-gray-300 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-white/10 transition-all cursor-pointer"
          >
            إلغاء
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Root Directory Button */}
        <div
          onClick={() => onSelectFolder(null)}
          className={`
            p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group
            ${selectedFolderId === null ? 'bg-amber-500/10 border-amber-500/30' : 'bg-[#111112] border-white/5 hover:border-white/10'}
          `}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-amber-500">
              <FolderOpen size={20} />
            </div>
            <div>
              <h4 className="text-xs font-black text-white">المجلد الرئيسي (Root)</h4>
              <p className="text-[10px] text-gray-400 mt-1 font-bold">
                {assets.filter(a => !a.folderId).length} أصل رقمي
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Folders */}
        {folders.map(folder => {
          const isSelected = selectedFolderId === folder.id;
          const count = getAssetCountInFolder(folder.id);

          return (
            <div
              key={folder.id}
              className={`
                p-5 rounded-2xl border transition-all flex items-center justify-between group
                ${isSelected ? 'bg-amber-500/10 border-amber-500/30' : 'bg-[#111112] border-white/5 hover:border-white/10'}
              `}
            >
              <div 
                onClick={() => onSelectFolder(folder.id)}
                className="flex items-center gap-3 cursor-pointer flex-1"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isSelected ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-gray-400 group-hover:text-amber-500'}`}>
                  <Folder size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white group-hover:text-amber-500 transition-colors">{folder.name}</h4>
                  <p className="text-[10px] text-gray-400 mt-1 font-bold">
                    {count} أصل رقمي
                  </p>
                </div>
              </div>

              {/* Prevent deleting seeded standard folders */}
              {!['logos', 'stadiums', 'players', 'backgrounds', 'news'].includes(folder.id) && (
                <button
                  onClick={() => {
                    if (confirm(`هل أنت متأكد من رغبتك في حذف المجلد "${folder.name}"؟ لن يتم حذف الملفات داخله بل ستنتقل للمجلد الرئيسي.`)) {
                      onDeleteFolder(folder.id);
                      if (isSelected) onSelectFolder(null);
                    }
                  }}
                  className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all border border-red-500/10 cursor-pointer"
                  title="حذف المجلد"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
