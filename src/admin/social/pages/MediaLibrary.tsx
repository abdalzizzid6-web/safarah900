import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Upload, FolderPlus, Trash2, Check, RefreshCw, FileText } from 'lucide-react';

interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: string;
  size: string;
  createdAt: string;
}

const MediaLibrary: React.FC = () => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Fetch or load media items from localStorage so they persist across reloads
  useEffect(() => {
    const saved = localStorage.getItem('social_media_library');
    if (saved) {
      setMediaItems(JSON.parse(saved));
    } else {
      // Default initial high-contrast illustration images (using public URLs)
      const initialItems: MediaItem[] = [
        {
          id: '1',
          name: 'Safara90_Banner.jpg',
          url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=60',
          type: 'image/jpeg',
          size: '1.2 MB',
          createdAt: new Date().toLocaleDateString('ar-SA')
        },
        {
          id: '2',
          name: 'Match_Highlights_Template.png',
          url: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=800&auto=format&fit=crop&q=60',
          type: 'image/png',
          size: '850 KB',
          createdAt: new Date().toLocaleDateString('ar-SA')
        }
      ];
      setMediaItems(initialItems);
      localStorage.setItem('social_media_library', JSON.stringify(initialItems));
    }
  }, []);

  const saveToStorage = (items: MediaItem[]) => {
    setMediaItems(items);
    localStorage.setItem('social_media_library', JSON.stringify(items));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      processFiles(files);
    }
  };

  const processFiles = (files: FileList) => {
    setIsLoading(true);
    
    // Simulate real cloud upload with instant local Base64 / ObjectURL creation
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newItem: MediaItem = {
          id: Math.random().toString(36).substring(2),
          name: file.name,
          url: event.target?.result as string || 'https://via.placeholder.com/150',
          type: file.type,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          createdAt: new Date().toLocaleDateString('ar-SA')
        };
        const updated = [newItem, ...mediaItems];
        saveToStorage(updated);
        setIsLoading(false);
        setToast('تم رفع ملف الوسائط بنجاح وحفظه في المكتبة المشتركة!');
        setTimeout(() => setToast(null), 3000);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDelete = (id: string) => {
    const filtered = mediaItems.filter(item => item.id !== id);
    saveToStorage(filtered);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">مكتبة وسائط النشر التلقائي</h2>
          <p className="text-xs text-gray-400 mt-1">إدارة وتحميل الصور ومقاطع الفيديو الترويجية للمباريات المباشرة.</p>
        </div>
        <div className="flex gap-2">
          <label className="px-4 py-2 bg-primary text-black rounded-lg hover:bg-primary-hover flex items-center gap-2 font-bold text-sm cursor-pointer transition-all shadow-lg shadow-primary/10">
            <Upload className="w-4 h-4" />
            رفع وسائط جديدة
            <input 
              type="file" 
              multiple 
              accept="image/*,video/*" 
              onChange={handleFileUpload} 
              className="hidden" 
            />
          </label>
        </div>
      </div>

      {toast && (
        <div className="p-4 rounded-xl bg-green-900/20 border border-green-500/30 text-green-200 text-sm flex gap-2">
          <Check className="w-5 h-5 shrink-0 text-green-500" />
          <p>{toast}</p>
        </div>
      )}

      {/* Drag & Drop Area */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`bg-surface rounded-xl border p-12 text-center flex flex-col items-center justify-center border-dashed transition-all ${
          isDragging 
            ? 'border-primary bg-primary/5 scale-[0.99]' 
            : 'border-white/10 hover:border-white/20'
        }`}
      >
        {isLoading ? (
          <RefreshCw className="w-12 h-12 text-primary animate-spin mb-4" />
        ) : (
          <ImageIcon className="w-12 h-12 text-gray-500 mb-4" />
        )}
        <h3 className="text-lg font-semibold text-white mb-1">اسحب وأفلت لرفع الملفات هنا</h3>
        <p className="text-xs text-gray-400 mb-4">يدعم رفع ملفات الصور المتعددة والفيديوهات ومخططات المباريات.</p>
        <label className="px-5 py-2 bg-surface-elevated border border-white/10 text-white rounded-lg text-xs font-semibold cursor-pointer hover:bg-surface-elevated/80">
          تصفح الملفات المحلية
          <input 
            type="file" 
            multiple 
            accept="image/*,video/*" 
            onChange={handleFileUpload} 
            className="hidden" 
          />
        </label>
      </div>

      {/* Media Grid */}
      <div className="space-y-4">
        <h3 className="text-md font-bold text-white">الوسائط المخزنة</h3>
        
        {mediaItems.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">المكتبة فارغة حالياً. قم برفع وسائط جديدة للبدء.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {mediaItems.map(item => (
              <div key={item.id} className="bg-surface border border-white/5 rounded-xl overflow-hidden group hover:border-white/10 transition-all flex flex-col justify-between">
                <div className="aspect-square bg-surface-elevated relative overflow-hidden flex items-center justify-center">
                  {item.type.startsWith('image/') ? (
                    <img src={item.url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                  ) : (
                    <FileText className="w-8 h-8 text-gray-400" />
                  )}
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="absolute top-2 left-2 p-1.5 rounded-lg bg-black/60 text-red-400 hover:bg-black/80 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="حذف الملف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-2.5 min-w-0">
                  <p className="text-xs font-semibold text-white truncate leading-snug" title={item.name}>{item.name}</p>
                  <span className="block text-[10px] text-gray-500 mt-1 font-mono">{item.size}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaLibrary;
