import React from 'react';
import { NewsImage } from '../types';
import { Image, CheckCircle, HelpCircle } from 'lucide-react';

interface Props {
  image: NewsImage;
  onChange: (image: NewsImage) => void;
  label?: string;
}

export function ImageUploader({ image, onChange, label = 'صورة الغلاف الرسمية' }: Props) {
  return (
    <div className="bg-[#121214] border border-white/[0.05] rounded-3xl p-6 space-y-5 text-right">
      <div className="flex items-center gap-2 flex-row-reverse">
        <Image className="w-5 h-5 text-primary" />
        <h3 className="font-black text-white text-base">{label}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Image URL input */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-400">رابط الصورة (Image URL / CDN)</label>
          <input
            type="text"
            value={image.url || ''}
            onChange={(e) => onChange({ ...image, url: e.target.value })}
            className="w-full bg-[#18181C] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary text-left font-mono"
            placeholder="https://example.com/image.webp"
          />
        </div>

        {/* Caption */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-400">التعليق المكتوب (Caption)</label>
          <input
            type="text"
            value={image.caption || ''}
            onChange={(e) => onChange({ ...image, caption: e.target.value })}
            className="w-full bg-[#18181C] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary"
            placeholder="اكتب وصفاً قصيراً يظهر أسفل الصورة"
          />
        </div>

        {/* Alt text */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-400">نص بديل لمحركات البحث (Alt Text)</label>
          <input
            type="text"
            value={image.altText || ''}
            onChange={(e) => onChange({ ...image, altText: e.target.value })}
            className="w-full bg-[#18181C] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary"
            placeholder="وصف الصورة مخصص لقراء الشاشة ومحركات البحث"
          />
        </div>

        {/* Photo Credit */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-400">حقوق ملكية الصورة (Photo Credit)</label>
          <input
            type="text"
            value={image.credit || ''}
            onChange={(e) => onChange({ ...image, credit: e.target.value })}
            className="w-full bg-[#18181C] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary"
            placeholder="مثال: رويترز / تصوير أحمد علي"
          />
        </div>
      </div>

      {/* Preview image if URL provided */}
      {image.url && (
        <div className="border border-white/10 rounded-2xl overflow-hidden aspect-video relative max-h-[180px]">
          <img 
            src={image.url} 
            alt={image.altText || ''} 
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.src = 'https://korea90.xyz/images/default-news.png'; }}
          />
          <div className="absolute top-3 left-3 bg-black/75 text-emerald-400 text-[10px] px-2 py-1 rounded-md font-bold flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> جودة ويب WebP محسنة
          </div>
        </div>
      )}
    </div>
  );
}
