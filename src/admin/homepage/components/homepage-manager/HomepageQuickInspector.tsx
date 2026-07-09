import React from 'react';
import { Settings2, Check, Save, Palette } from 'lucide-react';
import { THEME_PRESETS, getFriendlyTypeName } from './HomepageManagerConstants';
import { motion, AnimatePresence } from 'motion/react';

interface HomepageQuickInspectorProps {
  selectedBlockId: string | null;
  blocks: any[];
  quickTitle: string;
  setQuickTitle: (val: string) => void;
  quickTitleEn: string;
  setQuickTitleEn: (val: string) => void;
  quickSubtitle: string;
  setQuickSubtitle: (val: string) => void;
  quickTitleIcon: string;
  setQuickTitleIcon: (val: string) => void;
  quickTitleAlign: string;
  setQuickTitleAlign: (val: string) => void;
  savingQuick: boolean;
  saveSuccess: boolean;
  handleQuickSave: () => void;
  applyQuickThemePreset: (preset: any) => void;
  setSelectedBlockId: (id: string | null) => void;
}

export const HomepageQuickInspector: React.FC<HomepageQuickInspectorProps> = ({
  selectedBlockId,
  blocks,
  quickTitle,
  setQuickTitle,
  quickTitleEn,
  setQuickTitleEn,
  quickSubtitle,
  setQuickSubtitle,
  quickTitleIcon,
  setQuickTitleIcon,
  quickTitleAlign,
  setQuickTitleAlign,
  savingQuick,
  saveSuccess,
  handleQuickSave,
  applyQuickThemePreset,
  setSelectedBlockId
}) => {
  const currentSelected = blocks.find(b => b.id === selectedBlockId);

  return (
    <AnimatePresence mode="wait">
      {selectedBlockId && currentSelected ? (
        <motion.div
          key={selectedBlockId}
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          className="bg-[#0e1622] border-2 border-primary/20 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-right"
        >
          {/* Decorative gradient corner */}
          <div className="absolute -top-12 -left-12 w-24 h-24 bg-primary/10 rounded-full blur-xl"></div>
          
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
            <div className="flex items-center gap-2">
              <Settings2 className="text-primary animate-spin-slow" size={18} />
              <h3 className="text-sm font-black text-white">مفتش الخصائص السريع (Quick Inspector)</h3>
            </div>
            <button
              onClick={() => setSelectedBlockId(null)}
              className="text-xs text-gray-500 hover:text-white transition bg-white/5 px-2.5 py-1 rounded-lg"
            >
              إغلاق المفتش
            </button>
          </div>

          {/* Inspector Inputs */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5 text-right">
                <label className="text-[10px] text-gray-400 font-bold block">عنوان القسم بالعربية</label>
                <input
                  type="text"
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-primary focus:outline-none text-right"
                />
              </div>

              <div className="space-y-1.5 text-left" dir="ltr">
                <label className="text-[10px] text-gray-400 font-bold block text-left">Title in English</label>
                <input
                  type="text"
                  value={quickTitleEn}
                  onChange={(e) => setQuickTitleEn(e.target.value)}
                  className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-primary focus:outline-none text-left"
                />
              </div>

              <div className="space-y-1.5 text-right">
                <label className="text-[10px] text-gray-400 font-bold block">أيقونة القسم المعروضة</label>
                <select
                  value={quickTitleIcon}
                  onChange={(e) => setQuickTitleIcon(e.target.value)}
                  className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="None">بدون أيقونة (None)</option>
                  <option value="Trophy">🏆 كأس البطولة (Trophy)</option>
                  <option value="Flame">🔥 نار حماسية (Flame)</option>
                  <option value="Sparkles">✨ بريق مميز (Sparkles)</option>
                  <option value="Activity">📈 نبض النشاط (Activity)</option>
                  <option value="Tv">📺 البث المباشر (Tv)</option>
                  <option value="TrendingUp">⚡ الرائجة (Trending)</option>
                  <option value="Newspaper">📰 تغطية إخبارية (Newspaper)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5 text-right">
              <label className="text-[10px] text-gray-400 font-bold block">العنوان الفرعي التوضيحي (Subtitle)</label>
              <textarea
                value={quickSubtitle}
                onChange={(e) => setQuickSubtitle(e.target.value)}
                rows={2}
                placeholder="اكتب تعليقاً فرعياً يوضح أهمية هذا القسم لزوارك..."
                className="w-full bg-[#070b11] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-primary focus:outline-none resize-none"
              />
            </div>

            {/* Title Align Row */}
            <div className="space-y-1.5 text-right">
              <label className="text-[10px] text-gray-400 font-bold block">محاذاة نصوص ومحتويات العنوان</label>
              <div className="grid grid-cols-3 gap-2 bg-[#070b11] border border-white/5 rounded-xl p-1 items-center">
                <button
                  type="button"
                  onClick={() => setQuickTitleAlign('text-right')}
                  className={`text-[10px] py-1.5 rounded-lg font-black transition ${quickTitleAlign === 'text-right' ? 'bg-primary text-black font-extrabold' : 'text-gray-400'}`}
                >
                  الجهة اليمين (شائع)
                </button>
                <button
                  type="button"
                  onClick={() => setQuickTitleAlign('text-center')}
                  className={`text-[10px] py-1.5 rounded-lg font-black transition ${quickTitleAlign === 'text-center' ? 'bg-primary text-black font-extrabold' : 'text-gray-400'}`}
                >
                  الوسط المتناظر
                </button>
                <button
                  type="button"
                  onClick={() => setQuickTitleAlign('text-left')}
                  className={`text-[10px] py-1.5 rounded-lg font-black transition ${quickTitleAlign === 'text-left' ? 'bg-primary text-black font-extrabold' : 'text-gray-400'}`}
                >
                  الجهة اليسار
                </button>
              </div>
            </div>

            {/* Presets picker inside inspector */}
            <div className="space-y-2 pt-2 text-right">
              <label className="text-[10px] text-gray-400 font-bold block flex items-center gap-1.5 justify-end">
                <Palette size={12} className="text-amber-400" />
                <span>تغيير المظهر والسمات البصرية بنقرة واحدة:</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {THEME_PRESETS.map((p, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => applyQuickThemePreset(p)}
                    className="p-2 bg-[#070b11] border border-white/5 hover:border-primary/50 text-right rounded-xl transition flex flex-col gap-0.5 text-[9px]"
                  >
                    <span className="font-bold text-white block truncate w-full">{p.name}</span>
                    <div className="flex gap-1 mt-1 justify-end">
                      <span className="w-2 h-2 rounded-full border border-white/20" style={{ backgroundColor: p.backgroundColor || '#0e1622' }}></span>
                      <span className="w-2 h-2 rounded-full border border-white/20" style={{ backgroundColor: p.titleColor || '#ffd700' }}></span>
                      <span className="w-2 h-2 rounded-full border border-white/20" style={{ backgroundColor: p.accentColor || '#10b981' }}></span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom action controls */}
          <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-4">
            <div className="text-[10px] text-gray-400">
              النوع الأساسي: <span className="font-bold text-primary font-mono">{getFriendlyTypeName(currentSelected.type)}</span>
            </div>
            
            <div className="flex items-center gap-2">
              {saveSuccess ? (
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                  <Check size={14} />
                  تم الحفظ!
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleQuickSave}
                  disabled={savingQuick}
                  className="bg-primary hover:bg-primary-hover text-black font-black text-xs px-5 py-2 rounded-xl shadow-lg shadow-primary/20 flex items-center gap-1.5 transition active:scale-95"
                >
                  {savingQuick ? (
                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  <span>حفظ وتحديث المحاكي</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="bg-[#0e1622] border border-white/5 rounded-3xl p-6 text-center text-gray-500 text-xs">
          💡 اضغط على أي قسم داخل شاشة محاكي الموبايل لتعديل وتغيير ألوانه وعناوينه فوراً من المفتش السريع.
        </div>
      )}
    </AnimatePresence>
  );
};
