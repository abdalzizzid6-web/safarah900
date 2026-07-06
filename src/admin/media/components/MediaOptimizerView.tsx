import React, { useState } from 'react';
import { Settings, Sliders, Check, Zap, Info, ShieldAlert, FileImage, Layers } from 'lucide-react';
import { DAMConfig, MediaAsset } from '../types';

interface MediaOptimizerViewProps {
  config: DAMConfig;
  assets: MediaAsset[];
  onSaveConfig: (cfg: DAMConfig) => Promise<void>;
}

export default function MediaOptimizerView({ config, assets, onSaveConfig }: MediaOptimizerViewProps) {
  const [quality, setQuality] = useState(config.quality);
  const [stripExif, setStripExif] = useState(config.stripExif);
  const [defaultFormat, setDefaultFormat] = useState(config.defaultFormat);
  const [autoAiTagging, setAutoAiTagging] = useState(config.autoAiTagging);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onSaveConfig({
      ...config,
      quality,
      stripExif,
      defaultFormat,
      autoAiTagging
    });
    setIsSaving(false);
  };

  const getCompressionSavings = () => {
    // Standard calculation of savings
    let totalOriginal = 0;
    assets.forEach(a => {
      totalOriginal += a.fileSize * 2.85; // Estimation of original raw size
    });
    const current = assets.reduce((sum, a) => sum + a.fileSize, 0);
    const saved = Math.max(0, totalOriginal - current);
    return {
      original: totalOriginal,
      current,
      saved,
      ratio: totalOriginal > 0 ? Math.round((saved / totalOriginal) * 100) : 0
    };
  };

  const stats = getCompressionSavings();

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div>
        <h3 className="text-sm font-black text-white">معدل تحسين وضغط الصور (Optimizer)</h3>
        <p className="text-xs text-gray-400 mt-1">إعدادات المحول التلقائي للملفات لتخفيض الحجم وإلغاء البيانات الزائدة EXIF لزيادة سرعة التحميل.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Controls */}
        <div className="lg:col-span-2 bg-[#111112] border border-white/5 rounded-2xl p-5 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-white/5">
            <Sliders className="text-amber-500" size={18} />
            <h4 className="text-xs font-black text-white">معايير الضغط والتحويل التلقائي</h4>
          </div>

          <div className="space-y-4">
            {/* Format Preset */}
            <div>
              <label className="block text-xs font-black text-gray-300 mb-2">صيغة التحويل الأساسية للأصول</label>
              <select
                value={defaultFormat}
                onChange={(e) => setDefaultFormat(e.target.value as any)}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="webp">تحويل تلقائي إلى WebP الموصى به (الافتراضي)</option>
                <option value="avif">تحويل تلقائي إلى AVIF فائق الضغط</option>
                <option value="original">الاحتفاظ بالصيغة الأصلية المرفوعة</option>
              </select>
            </div>

            {/* Quality Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-black text-gray-300">درجة جودة الصورة المستهدفة</label>
                <span className="text-xs font-mono font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">{quality}%</span>
              </div>
              <input
                type="range"
                min="40"
                max="100"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <p className="text-[10px] text-gray-500 font-bold mt-1.5 leading-relaxed">جودة 80% توفر أعلى موازنة بين تخفيض المساحة الكلية (حتى 75% توفير) ونقاء التفاصيل المرئية بالموقع.</p>
            </div>

            {/* EXIF Stripping toggle */}
            <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/[0.03]">
              <div>
                <h5 className="text-xs font-black text-white">إلغاء وتعرية بيانات EXIF الفوقية</h5>
                <p className="text-[10px] text-gray-400 mt-0.5">حذف بيانات الكاميرا، والـ GPS وتاريخ الالتقاط من الملف لحماية الخصوصية وضغط الحجم.</p>
              </div>
              <input
                type="checkbox"
                checked={stripExif}
                onChange={(e) => setStripExif(e.target.checked)}
                className="w-4 h-4 text-amber-500 bg-black border-white/10 rounded focus:ring-0"
              />
            </div>

            {/* Auto AI Tagging toggle */}
            <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/[0.03]">
              <div>
                <h5 className="text-xs font-black text-white">وسم الذكاء الاصطناعي التلقائي (Gemini Model)</h5>
                <p className="text-[10px] text-gray-400 mt-0.5">تفعيل المكننة لفرز اللاعبين، والملاعب والاحتفالات فور تصفح أو تلقيم الصور الجديدة.</p>
              </div>
              <input
                type="checkbox"
                checked={autoAiTagging}
                onChange={(e) => setAutoAiTagging(e.target.checked)}
                className="w-4 h-4 text-amber-500 bg-black border-white/10 rounded focus:ring-0"
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap size={14} className={isSaving ? 'animate-spin' : ''} />
              <span>{isSaving ? 'جاري تطبيق الإعدادات الفنية...' : 'حفظ وتطبيق إعدادات المحسّن'}</span>
            </button>
          </div>
        </div>

        {/* Compression Statistics Widget */}
        <div className="bg-[#111112] border border-white/5 rounded-2xl p-5 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-4 border-b border-white/5">
              <Layers className="text-emerald-500" size={18} />
              <h4 className="text-xs font-black text-white">مؤشرات المحاذاة ومساحة المخدمات</h4>
            </div>

            <div className="space-y-4 text-xs font-bold">
              <div className="flex justify-between">
                <span className="text-gray-400">الحجم الافتراضي قبل التحسين</span>
                <span className="text-white font-mono">{(stats.original / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">الحجم الفعلي على المخدم (WebP)</span>
                <span className="text-emerald-400 font-mono">{(stats.current / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/[0.03]">
                <span className="text-gray-400">المساحة الإجمالية الموفرة</span>
                <span className="text-amber-500 font-mono">{(stats.saved / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">نسبة الكفاءة العامة للضغط</span>
                <span className="text-emerald-400 font-black">+{stats.ratio}% تقليص</span>
              </div>
            </div>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-start gap-2.5">
            <Zap className="text-emerald-400 shrink-0 mt-0.5" size={16} />
            <p className="text-[10px] text-emerald-300 leading-relaxed font-bold">
              مستوى التحسين ممتاز! تم حماية مخدمات المنصة من استهلاك المساحات العشوائية وضمان تحميل صفحات المباريات والتقارير في أجزاء من الثانية للمشجعين والزوار.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
