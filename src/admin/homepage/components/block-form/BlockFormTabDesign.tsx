import React from 'react';
import { Sparkles } from 'lucide-react';
import { COLOR_PRESETS } from './BlockFormConstants';

interface BlockFormTabDesignProps {
  backgroundColor: string;
  setBackgroundColor: (val: string) => void;
  textColor: string;
  setTextColor: (val: string) => void;
  titleColor: string;
  setTitleColor: (val: string) => void;
  accentColor: string;
  setAccentColor: (val: string) => void;
  fontFamily: string;
  setFontFamily: (val: string) => void;
  borderRadius: string;
  setBorderRadius: (val: string) => void;
  paddingSize: string;
  setPaddingSize: (val: string) => void;
  borderStyle: string;
  setBorderStyle: (val: string) => void;
  borderWidth: string;
  setBorderWidth: (val: string) => void;
  shadowIntensity: string;
  setShadowIntensity: (val: string) => void;
  hoverEffect: string;
  setHoverEffect: (val: string) => void;
  titleSize: string;
  setTitleSize: (val: string) => void;
  titleWeight: string;
  setTitleWeight: (val: string) => void;
  skeletonType: string;
  setSkeletonType: (val: string) => void;
  bgGradient: boolean;
  setBgGradient: (val: boolean) => void;
  bgGradientStart: string;
  setBgGradientStart: (val: string) => void;
  bgGradientEnd: string;
  setBgGradientEnd: (val: string) => void;
  applyColorPreset: (preset: typeof COLOR_PRESETS[0]) => void;
}

export const BlockFormTabDesign: React.FC<BlockFormTabDesignProps> = ({
  backgroundColor,
  setBackgroundColor,
  textColor,
  setTextColor,
  titleColor,
  setTitleColor,
  accentColor,
  setAccentColor,
  fontFamily,
  setFontFamily,
  borderRadius,
  setBorderRadius,
  paddingSize,
  setPaddingSize,
  borderStyle,
  setBorderStyle,
  borderWidth,
  setBorderWidth,
  shadowIntensity,
  setShadowIntensity,
  hoverEffect,
  setHoverEffect,
  titleSize,
  setTitleSize,
  titleWeight,
  setTitleWeight,
  skeletonType,
  setSkeletonType,
  bgGradient,
  setBgGradient,
  bgGradientStart,
  setBgGradientStart,
  bgGradientEnd,
  setBgGradientEnd,
  applyColorPreset
}) => {
  return (
    <div className="space-y-6 animate-fadeIn text-right">
      {/* Presets Gallery */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-400 block text-right">مكتبة قوالب الألوان والتصميم الجاهزة</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
          {COLOR_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyColorPreset(preset)}
              className="p-2.5 bg-[#070b11] border border-white/5 hover:border-primary/50 text-right rounded-xl transition flex flex-col gap-1 text-[10px]"
            >
              <span className="font-bold text-white leading-normal">{preset.name}</span>
              <div className="flex gap-1.5 mt-1">
                <span className="w-2.5 h-2.5 rounded-full border border-white/10" style={{ backgroundColor: preset.backgroundColor || '#080808' }}></span>
                <span className="w-2.5 h-2.5 rounded-full border border-white/10" style={{ backgroundColor: preset.titleColor || '#ffd700' }}></span>
                <span className="w-2.5 h-2.5 rounded-full border border-white/10" style={{ backgroundColor: preset.accentColor || '#10b981' }}></span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#070b11]/50 p-4 border border-white/5 rounded-2xl">
        {/* Bg Color */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-gray-400 font-bold block">لون الخلفية المخصص</label>
          <div className="flex items-center gap-2">
            <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="w-7 h-7 bg-transparent rounded cursor-pointer shrink-0" />
            <input type="text" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="w-full bg-[#070b11] border border-white/10 rounded-lg px-2 py-1 text-[10px] font-mono text-right" placeholder="#000000" />
          </div>
        </div>

        {/* Text Color */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-gray-400 font-bold block">لون النصوص التفصيلية</label>
          <div className="flex items-center gap-2">
            <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-7 h-7 bg-transparent rounded cursor-pointer shrink-0" />
            <input type="text" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-full bg-[#070b11] border border-white/10 rounded-lg px-2 py-1 text-[10px] font-mono text-right" placeholder="#ffffff" />
          </div>
        </div>

        {/* Title Color */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-gray-400 font-bold block">لون العناوين الرئيسية</label>
          <div className="flex items-center gap-2">
            <input type="color" value={titleColor} onChange={(e) => setTitleColor(e.target.value)} className="w-7 h-7 bg-transparent rounded cursor-pointer shrink-0" />
            <input type="text" value={titleColor} onChange={(e) => setTitleColor(e.target.value)} className="w-full bg-[#070b11] border border-white/10 rounded-lg px-2 py-1 text-[10px] font-mono text-right" placeholder="#ffd700" />
          </div>
        </div>

        {/* Accent/Border Glow Color */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-gray-400 font-bold block">لون التوهج والحدود</label>
          <div className="flex items-center gap-2">
            <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-7 h-7 bg-transparent rounded cursor-pointer shrink-0" />
            <input type="text" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-full bg-[#070b11] border border-white/10 rounded-lg px-2 py-1 text-[10px] font-mono text-right" placeholder="#a855f7" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Font Family */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 block">نوع الخط التعبيري (Typography Font)</label>
          <select 
            value={fontFamily} 
            onChange={(e) => setFontFamily(e.target.value)} 
            className="w-full bg-[#070b11] border border-white/10 rounded-xl px-4 py-3 text-xs focus:border-primary focus:outline-none transition text-right"
          >
            <option value="">خط النظام الافتراضي (Inter Arabic)</option>
            <option value="'Cairo', sans-serif">خط القاهرة الفاخر (Cairo Bold)</option>
            <option value="'Tajawal', sans-serif">خط تجول الحديث المبسط (Tajawal)</option>
            <option value="sans-serif">Sans-Serif الرياضي الحديث</option>
            <option value="monospace">Monospace التقني للاحصائيات</option>
          </select>
        </div>

        {/* Border Radius */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 block">حواف واستدارة الزوايا (Border Radius)</label>
          <input 
            type="text" 
            value={borderRadius} 
            onChange={(e) => setBorderRadius(e.target.value)} 
            className="w-full bg-[#070b11] border border-white/10 rounded-xl px-4 py-3 text-xs focus:border-primary focus:outline-none transition text-right" 
            placeholder="مثال: 1.5rem أو 24px" 
          />
        </div>

        {/* Container Padding */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 block">هوامش الحشو الداخلي للكتلة (Internal Padding)</label>
          <select 
            value={paddingSize} 
            onChange={(e) => setPaddingSize(e.target.value)} 
            className="w-full bg-[#070b11] border border-white/10 rounded-xl px-4 py-3 text-xs focus:border-primary focus:outline-none transition text-right"
          >
            <option value="standard">هامش قياسي متناسق (Balanced - 1.5rem)</option>
            <option value="compact">هامش مدمج وذكي (Compact - 0.75rem)</option>
            <option value="spacious">هامش واسع عريض (Spacious - 2rem)</option>
            <option value="none">بدون أي حواف أو هوامش داخلية (None - 0)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#070b11]/50 p-4 border border-white/5 rounded-2xl">
        {/* Border Style */}
        <div className="space-y-1.5 col-span-1 md:col-span-2">
          <label className="text-[10px] text-gray-400 font-bold block">هيكل ونمط الحدود (Border Outline Style)</label>
          <select 
            value={borderStyle} 
            onChange={(e) => setBorderStyle(e.target.value)} 
            className="w-full bg-[#070b11] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-right"
          >
            <option value="none">بدون حدود خارجية (None)</option>
            <option value="solid">خط حاد متصل (Solid Outline)</option>
            <option value="dashed">خط منقط / متقطع (Dashed Outline)</option>
            <option value="double">خط ممتد مزدوج فاخر (Double Outline)</option>
          </select>
        </div>

        {/* Border Width */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-gray-400 font-bold block">سمك حدود الإطار</label>
          <select 
            value={borderWidth} 
            onChange={(e) => setBorderWidth(e.target.value)} 
            className="w-full bg-[#070b11] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-right"
          >
            <option value="1px">رفيع (1px)</option>
            <option value="2px">متوسط (2px)</option>
            <option value="3px">عريض (3px)</option>
            <option value="4px">سميك عريض جداً (4px)</option>
          </select>
        </div>

        {/* Shadow Intensity */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-gray-400 font-bold block">مستوى ونمط الظل والتوهج</label>
          <select 
            value={shadowIntensity} 
            onChange={(e) => setShadowIntensity(e.target.value)} 
            className="w-full bg-[#070b11] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-right"
          >
            <option value="none">بدون أي ظلال (Flat)</option>
            <option value="subtle">ظل ناعم خفيف (Subtle Shadow)</option>
            <option value="medium">ظل غامق عميق (Medium Shadow)</option>
            <option value="glow">توهج خلفي خفيف (Soft Highlight Glow)</option>
            <option value="glow_intense">توهج حاد ثلاثي الأبعاد (Super Intense Glow)</option>
          </select>
        </div>
      </div>

      {/* Hover Effects & Microinteractions */}
      <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl space-y-3">
        <h4 className="text-xs font-black text-primary flex items-center gap-1.5 justify-end">
          <Sparkles size={14} className="animate-bounce" />
          <span>التفاعلات وحركات تمرير الماوس التلقائية (Interactive Hover Effects)</span>
        </h4>
        <p className="text-[10px] text-gray-400 text-right">حدد الإجراء البصري الفوري عند قيام المستخدم بتمرير الماوس فوق هذا القسم لزيادة تفاعل المستخدم.</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
          <label className="p-3 bg-[#070b11] border border-white/5 hover:border-primary/20 rounded-xl cursor-pointer flex items-center gap-2.5 justify-end">
            <span className="text-[11px] font-bold">تأثير ثابت (None)</span>
            <input type="radio" name="hoverEffect" checked={hoverEffect === 'none'} onChange={() => setHoverEffect('none')} className="text-primary focus:ring-0" />
          </label>
          <label className="p-3 bg-[#070b11] border border-white/5 hover:border-primary/20 rounded-xl cursor-pointer flex items-center gap-2.5 justify-end">
            <span className="text-[11px] font-bold">تكبير وارتفاع طفيف (Scale)</span>
            <input type="radio" name="hoverEffect" checked={hoverEffect === 'scale'} onChange={() => setHoverEffect('scale')} className="text-primary focus:ring-0" />
          </label>
          <label className="p-3 bg-[#070b11] border border-white/5 hover:border-primary/20 rounded-xl cursor-pointer flex items-center gap-2.5 justify-end">
            <span className="text-[11px] font-bold">توهج هالة الإطار (Glow)</span>
            <input type="radio" name="hoverEffect" checked={hoverEffect === 'glow'} onChange={() => setHoverEffect('glow')} className="text-primary focus:ring-0" />
          </label>
          <label className="p-3 bg-[#070b11] border border-white/5 hover:border-primary/20 rounded-xl cursor-pointer flex items-center gap-2.5 justify-end">
            <span className="text-[11px] font-bold">إزاحة طيران للأعلى (Lift Up)</span>
            <input type="radio" name="hoverEffect" checked={hoverEffect === 'lift'} onChange={() => setHoverEffect('lift')} className="text-primary focus:ring-0" />
          </label>
        </div>
      </div>

      {/* Title Size and Weight and Skeleton Loader */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#070b11]/30 p-4 border border-white/5 rounded-2xl">
        <div className="space-y-1.5">
          <label className="text-[10px] text-gray-400 font-bold block">حجم خط العنوان (Title Font Size)</label>
          <select
            className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none text-right"
            value={titleSize}
            onChange={(e) => setTitleSize(e.target.value)}
          >
            <option value="text-xs">صغير جداً (Extra Small)</option>
            <option value="text-sm">صغير (Small - Default)</option>
            <option value="text-base">متوسط (Base)</option>
            <option value="text-lg">متوسط كبير (Large)</option>
            <option value="text-xl">كبير (Extra Large)</option>
            <option value="text-2xl">كبير جداً (Double XL)</option>
            <option value="text-3xl">ضخم (Triple XL)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-gray-400 font-bold block">سمك خط العنوان (Title Font Weight)</label>
          <select
            className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none text-right"
            value={titleWeight}
            onChange={(e) => setTitleWeight(e.target.value)}
          >
            <option value="font-light">نحيف (Light)</option>
            <option value="font-normal">عادي (Normal)</option>
            <option value="font-medium">متوسط (Medium)</option>
            <option value="font-semibold">شبه عريض (Semibold)</option>
            <option value="font-bold">عريض (Bold)</option>
            <option value="font-extrabold">عريض جداً (Extrabold)</option>
            <option value="font-black">أسود داكن (Black - Default)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-gray-400 font-bold block">مظهر حالة التحميل (Skeleton Loader Style)</label>
          <select
            className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none text-right"
            value={skeletonType}
            onChange={(e) => setSkeletonType(e.target.value)}
          >
            <option value="pulsing">ومضات نابضة ناعمة (Pulsing Card)</option>
            <option value="shimmer">تموج ضوئي لامع (Shimmer Effect)</option>
            <option value="none">بدون حالة تحميل (Instant/Static)</option>
          </select>
        </div>
      </div>

      {/* Background Gradient controls */}
      <div className="p-4 bg-[#070b11]/50 border border-white/5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setBgGradient(!bgGradient)}
            className={`px-3 py-1 bg-white/5 border rounded-xl text-[9px] font-bold transition ${bgGradient ? 'bg-primary/20 text-primary border-primary/30' : 'text-gray-400 border-white/5'}`}
          >
            {bgGradient ? 'تعطيل التدرج' : 'تفعيل التدرج'}
          </button>
          <div>
            <h4 className="text-xs font-black text-white flex items-center gap-1.5 justify-end">
              🎨 خلفية متدرجة انسيابية (Gradient Background Overlay)
            </h4>
            <p className="text-[10px] text-gray-400 mt-0.5">استخدم خلفية متدرجة رائعة بدلاً من الألوان الثابتة السادة لجعل الصفحة حيوية.</p>
          </div>
        </div>

        {bgGradient && (
          <div className="grid grid-cols-2 gap-4 animate-slideDown">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-bold block">لون بدء التدرج (Start Color)</label>
              <div className="flex items-center gap-2">
                <input type="color" value={bgGradientStart} onChange={(e) => setBgGradientStart(e.target.value)} className="w-7 h-7 bg-transparent rounded cursor-pointer shrink-0" />
                <input type="text" value={bgGradientStart} onChange={(e) => setBgGradientStart(e.target.value)} className="w-full bg-[#070b11] border border-white/10 rounded-lg px-2 py-1 text-[10px] font-mono text-right" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-bold block">لون انتهاء التدرج (End Color)</label>
              <div className="flex items-center gap-2">
                <input type="color" value={bgGradientEnd} onChange={(e) => setBgGradientEnd(e.target.value)} className="w-7 h-7 bg-transparent rounded cursor-pointer shrink-0" />
                <input type="text" value={bgGradientEnd} onChange={(e) => setBgGradientEnd(e.target.value)} className="w-full bg-[#070b11] border border-white/10 rounded-lg px-2 py-1 text-[10px] font-mono text-right" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
