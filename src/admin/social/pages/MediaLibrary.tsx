import React from 'react';
import { Image as ImageIcon, Upload, FolderPlus } from 'lucide-react';

const MediaLibrary: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">مكتبة الوسائط</h2>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-surface-elevated text-white rounded-lg hover:bg-surface-elevated/80 border border-white/10 flex items-center gap-2">
            <FolderPlus className="w-4 h-4" />
            مجلد جديد
          </button>
          <button className="px-4 py-2 bg-primary text-black rounded-lg hover:bg-primary-hover flex items-center gap-2">
            <Upload className="w-4 h-4" />
            رفع وسائط
          </button>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-white/5 p-8 text-center min-h-[400px] flex flex-col items-center justify-center border-dashed border-2">
        <ImageIcon className="w-16 h-16 text-gray-600 mb-4" />
        <h3 className="text-xl font-medium text-white mb-2">اسحب وأفلت الملفات هنا</h3>
        <p className="text-gray-400 mb-6">يدعم الصور (JPG, PNG) والفيديوهات القصيرة (MP4)</p>
        <button className="px-6 py-2 bg-primary text-black rounded-lg hover:bg-primary-hover">
          تصفح الملفات
        </button>
      </div>
    </div>
  );
};

export default MediaLibrary;
