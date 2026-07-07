import React from 'react';
import { Sparkles, Check, Play } from 'lucide-react';
import { HOMEPAGE_TEMPLATES } from '../../../../premium/data/HomepageTemplates';

interface HomepageTemplateGalleryProps {
  selectedTemplate: string;
  setSelectedTemplate: (id: string) => void;
  applyingTemplate: boolean;
  handleApplyTemplate: (id: string) => void;
}

export const HomepageTemplateGallery: React.FC<HomepageTemplateGalleryProps> = ({
  selectedTemplate,
  setSelectedTemplate,
  applyingTemplate,
  handleApplyTemplate
}) => {
  return (
    <div className="bg-[#0e1622] border border-white/5 rounded-3xl p-6 space-y-4 text-right">
      <div className="flex items-center gap-2 justify-end">
        <h2 className="text-sm font-black text-white">مكتبة قوالب التخطيط الكاملة (Experience Layout Presets)</h2>
        <Sparkles className="text-amber-400" size={18} />
      </div>
      <p className="text-xs text-gray-400">
        اختر أحد القوالب الفاخرة المعتمدة لتطبيق تجربة مستخدم فورية تتماشى مع المناسبات الكروية. سيقوم بتهيئة الهيكل بالكامل ومسح التخطيط القديم:
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {HOMEPAGE_TEMPLATES.map(template => (
          <div 
            key={template.id} 
            className={`p-4 rounded-2xl border transition flex flex-col justify-between gap-3 text-right cursor-pointer ${
              selectedTemplate === template.id ? 'bg-primary/5 border-primary' : 'bg-[#070b11] border-white/5 hover:border-white/10'
            }`}
            onClick={() => setSelectedTemplate(template.id)}
          >
            <div>
              <h3 className="text-xs font-black text-white flex items-center gap-1.5 justify-end">
                <span>{template.name}</span>
                <Check className={`w-3.5 h-3.5 ${selectedTemplate === template.id ? 'text-primary' : 'text-gray-600'}`} />
              </h3>
              <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">{template.description}</p>
            </div>
            
            <button
              disabled={applyingTemplate}
              onClick={(e) => {
                e.stopPropagation();
                handleApplyTemplate(template.id);
              }}
              className={`w-full py-2 rounded-xl text-[10px] font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                selectedTemplate === template.id 
                  ? 'bg-primary text-black hover:bg-primary-hover shadow-md' 
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              {applyingTemplate && selectedTemplate === template.id ? (
                <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <Play size={10} />
              )}
              <span>تطبيق هذا القالب المتكامل</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
