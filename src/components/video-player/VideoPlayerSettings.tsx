import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Check, ZoomIn, ZoomOut, Sliders, Settings2, Monitor, Minimize2, Maximize2 } from 'lucide-react';

interface QualityLink {
  label: string;
  quality: string;
  url: string;
}

interface VideoPlayerSettingsProps {
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  activeMenu: 'main' | 'speed' | 'quality' | 'aspect' | 'stats' | 'zoom';
  setActiveMenu: (menu: 'main' | 'speed' | 'quality' | 'aspect' | 'stats' | 'zoom') => void;
  isM3U8: boolean;
  qualities: QualityLink[];
  activeQualityIndex: number;
  currentQuality?: string;
  nextQualityLabel?: string;
  speed: number;
  setSpeed: (speed: number) => void;
  aspectRatio: '16:9' | 'stretch' | '4:3' | 'cover';
  setAspectRatio: (ratio: '16:9' | 'stretch' | '4:3' | 'cover') => void;
  useNativeControls: boolean;
  setUseNativeControls: (val: boolean) => void;
  zoomScale: number;
  setZoomScale: React.Dispatch<React.SetStateAction<number>>;
  zoomMode: 'fit' | 'fill' | 'custom';
  applyPresetZoom: (mode: 'fit' | 'fill' | 'zoom15' | 'zoom20') => void;
  hlsQualities: QualityLink[];
  handleQualitySelect: (index: number) => void;
  stats: {
    bitrate: string;
    fps: number;
    dropped: number;
    bufferLength: number;
    latency: string;
  };
  onToggleTheater?: () => void;
  isTheaterMode: boolean;
  isFullscreen: boolean;
  handleFullscreen: (e?: React.MouseEvent) => void;
  toggleSettings: (e: React.MouseEvent) => void;
  onQualityToggle?: () => void;
}

export const VideoPlayerSettings: React.FC<VideoPlayerSettingsProps> = ({
  showSettings,
  setShowSettings,
  activeMenu,
  setActiveMenu,
  isM3U8,
  qualities,
  activeQualityIndex,
  currentQuality,
  nextQualityLabel,
  speed,
  setSpeed,
  aspectRatio,
  setAspectRatio,
  useNativeControls,
  setUseNativeControls,
  zoomScale,
  setZoomScale,
  zoomMode,
  applyPresetZoom,
  hlsQualities,
  handleQualitySelect,
  stats,
  onToggleTheater,
  isTheaterMode,
  isFullscreen,
  handleFullscreen,
  toggleSettings,
  onQualityToggle
}) => {
  return (
    <div className="flex items-center gap-2">
      {/* Zoom / Scale control button */}
      <button 
        onClick={() => {
          setShowSettings(true);
          setActiveMenu('zoom');
        }}
        className={`flex items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-black border transition-all cursor-pointer ${
          zoomScale > 1 
            ? 'bg-amber-500/20 border-white/20 text-amber-500' 
            : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'
        }`}
        title="تكبير وتقريب الشاشة"
      >
        <ZoomIn size={13} className="text-amber-500" />
        <span className="hidden sm:inline">التقريب:</span>
        <span>{zoomScale.toFixed(1)}x</span>
      </button>

      {onQualityToggle && (
        <button 
          onClick={onQualityToggle}
          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all border border-white/5 active:scale-95 cursor-pointer"
        >
          <Settings2 size={13} className="text-amber-500" />
          <span className="text-[10px] font-black uppercase">
            {currentQuality ? `${currentQuality}` : 'تلقائي'}
          </span>
          {nextQualityLabel && (
            <span className="text-[8px] opacity-40 hidden md:inline">← {nextQualityLabel}</span>
          )}
        </button>
      )}

      {/* Integrated settings drawer */}
      <div className="relative">
        <button 
          onClick={toggleSettings}
          className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
            showSettings && activeMenu !== 'zoom'
              ? 'bg-amber-500 text-black border-amber-500' 
              : 'bg-white/5 border-white/5 hover:bg-white/10 text-white'
          }`}
          title="إعدادات المشغل"
        >
          <Sliders size={15} />
        </button>
        
        <AnimatePresence>
          {showSettings && (
            <motion.div 
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-full right-0 mb-4 w-72 bg-neutral-900/95 backdrop-blur-3xl rounded-2xl p-4 border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.85)] z-40 text-right"
            >
               {/* MAIN AUDIO SETTINGS MENU */}
               {activeMenu === 'main' && (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-3 border-b border-white/5 pb-2">لوحة إعدادات البث</p>
                    
                    {isM3U8 && (
                      <>
                        <button 
                          onClick={() => setActiveMenu('quality')}
                          className="flex items-center justify-between w-full p-2.5 hover:bg-white/5 rounded-xl transition-all cursor-pointer text-right"
                        >
                          <ChevronLeft size={14} className="text-gray-500" />
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black bg-white/10 text-white px-2 py-0.5 rounded-md">{qualities[activeQualityIndex]?.quality || currentQuality || 'Auto'}</span>
                            <span className="text-xs font-bold text-gray-300">درجة الوضوح</span>
                          </div>
                        </button>

                        <button 
                          onClick={() => setActiveMenu('speed')}
                          className="flex items-center justify-between w-full p-2.5 hover:bg-white/5 rounded-xl transition-all cursor-pointer text-right"
                        >
                          <ChevronLeft size={14} className="text-gray-500" />
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black bg-white/10 text-white px-2 py-0.5 rounded-md">{speed}x</span>
                            <span className="text-xs font-bold text-gray-300">سرعة الفيديو</span>
                          </div>
                        </button>
                      </>
                    )}

                    <button 
                      onClick={() => setActiveMenu('aspect')}
                      className="flex items-center justify-between w-full p-2.5 hover:bg-white/5 rounded-xl transition-all cursor-pointer text-right"
                    >
                      <ChevronLeft size={14} className="text-gray-500" />
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black bg-white/10 text-white px-2 py-0.5 rounded-md">
                          {aspectRatio === '16:9' ? '16:9' : 
                           aspectRatio === 'stretch' ? 'تمديد كامل' : 
                           aspectRatio === 'cover' ? 'ملء الشاشة (قص)' : '4:3'}
                        </span>
                        <span className="text-xs font-bold text-gray-300">تطابق الصورة</span>
                      </div>
                    </button>

                    <button 
                      onClick={() => setUseNativeControls(!useNativeControls)}
                      className="flex items-center justify-between w-full p-2.5 hover:bg-white/5 rounded-xl transition-all cursor-pointer text-right"
                    >
                      <div className={`w-8 h-4 rounded-full relative transition-colors ${useNativeControls ? 'bg-amber-500' : 'bg-gray-600'}`}>
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${useNativeControls ? 'right-0.5' : 'left-0.5'}`} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-300">أزرار التحكم المتصفح</span>
                      </div>
                    </button>

                    {isM3U8 && (
                      <button 
                        onClick={() => setActiveMenu('stats')}
                        className="flex items-center justify-between w-full p-2.5 hover:bg-white/5 rounded-xl transition-all cursor-pointer text-right"
                      >
                        <ChevronLeft size={14} className="text-gray-500" />
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-emerald-400">مباشر</span>
                          <span className="text-xs font-bold text-gray-300">مركز معطيات البث</span>
                        </div>
                      </button>
                    )}
                 </motion.div>
               )}

               {/* ZOOM SUBMENU */}
               {activeMenu === 'zoom' && (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-[10px] font-black uppercase text-amber-500">ميزة تقريب الشاشة (المكبر)</span>
                      <button 
                        onClick={() => setActiveMenu('main')}
                        className="text-[10px] font-bold text-gray-400 hover:text-white cursor-pointer"
                      >
                        إلغاء
                      </button>
                    </div>
                    
                    <p className="text-[10px] text-gray-400 leading-relaxed font-bold">
                      اضغط مرتين على البث للتكبير والتنقل التلقائي، أو استخدم أدوات التحكم بالأسفل للزوم الشامل:
                    </p>

                    <div className="flex items-center justify-center gap-2 py-1 bg-black/40 rounded-xl">
                      <button
                        onClick={() => setZoomScale(z => Math.max(z - 0.25, 1))}
                        className="p-2 hover:text-amber-500 text-white/70 cursor-pointer"
                        title="تصغير"
                      >
                        <ZoomOut size={16} />
                      </button>
                      <span className="text-xs font-extrabold text-white font-mono min-w-10 text-center">{zoomScale.toFixed(2)}x</span>
                      <button
                        onClick={() => setZoomScale(z => Math.min(z + 0.25, 3.5))}
                        className="p-2 hover:text-amber-500 text-white/70 cursor-pointer"
                        title="تكبير"
                      >
                        <ZoomIn size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => applyPresetZoom('fit')}
                        className={`py-2 px-3 rounded-xl border text-[10px] font-black text-center cursor-pointer ${
                          zoomScale === 1 && zoomMode === 'fit' ? 'bg-amber-500 border-amber-500 text-black' : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        حجم طبيعي (Fit)
                      </button>

                      <button
                        onClick={() => applyPresetZoom('fill')}
                        className={`py-2 px-3 rounded-xl border text-[10px] font-black text-center cursor-pointer ${
                          zoomScale > 1.3 && zoomMode === 'fill' ? 'bg-amber-500 border-amber-500 text-black' : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        ملء الشاشة (Fill)
                      </button>
                    </div>

                    {zoomScale > 1 && (
                      <button
                        onClick={() => applyPresetZoom('fit')}
                        className="w-full text-center text-[10px] font-black text-rose-400 bg-rose-500/10 border border-rose-500/15 py-1.5 rounded-xl hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                      >
                        إعادة تعيين التقريب والتوسيط ↺
                      </button>
                    )}
                 </motion.div>
               )}

               {/* ASPECT RATIO SUBMENU */}
               {activeMenu === 'aspect' && (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    <button 
                      onClick={() => setActiveMenu('main')}
                      className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 hover:text-white w-full pb-2 border-b border-white/5 text-right cursor-pointer"
                    >
                       <ChevronLeft size={14} className="rotate-180" />
                       <span>العودة للقائمة</span>
                    </button>
                    <div className="space-y-1.5">
                       {(['16:9', 'stretch', '4:3'] as const).map(ratio => (
                         <button 
                           key={ratio}
                           onClick={() => {
                             setAspectRatio(ratio);
                             setActiveMenu('main');
                           }}
                           className={`flex items-center justify-between w-full p-2.5 rounded-xl transition-all cursor-pointer ${
                             aspectRatio === ratio ? 'bg-amber-500/10 text-amber-500 font-extrabold' : 'text-gray-400 hover:bg-white/5'
                           }`}
                         >
                           {aspectRatio === ratio ? <Check size={14} /> : <div />}
                           <span className="text-xs text-right">
                             {ratio === '16:9' ? 'شاشة عريضة سينمائية 16:9' : ratio === 'stretch' ? 'تمديد لتغطية الجوانب' : 'مربع تقليدي 4:3'}
                           </span>
                         </button>
                       ))}
                    </div>
                  </motion.div>
               )}

               {/* SPEED CONFIG SUBMENU */}
               {activeMenu === 'speed' && (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    <button 
                      onClick={() => setActiveMenu('main')}
                      className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 hover:text-white w-full pb-2 border-b border-white/5 text-right cursor-pointer"
                    >
                       <ChevronLeft size={14} className="rotate-180" />
                       <span>العودة للقائمة</span>
                    </button>
                    <div className="grid grid-cols-3 gap-1.5">
                       {[0.5, 0.75, 1, 1.25, 1.5, 2].map(s => (
                         <button 
                           key={s}
                           onClick={() => {
                             setSpeed(s);
                             setActiveMenu('main');
                           }}
                           className={`text-xs py-2 rounded-xl transition-all border cursor-pointer ${
                             speed === s 
                               ? 'bg-amber-500 border-amber-500 text-black font-black' 
                               : 'bg-white/5 border-white/5 hover:bg-white/10 text-white/85'
                           }`}
                         >
                           {s}x
                         </button>
                       ))}
                    </div>
                 </motion.div>
               )}

               {/* QUALITY DRAWER SUBMENU */}
               {activeMenu === 'quality' && (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    <button 
                      onClick={() => setActiveMenu('main')}
                      className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 hover:text-white w-full pb-2 border-b border-white/5 text-right cursor-pointer"
                    >
                       <ChevronLeft size={14} className="rotate-180" />
                       <span>العودة للقائمة</span>
                    </button>
                    <div className="space-y-1 max-h-52 overflow-y-auto custom-scrollbar">
                       {((qualities && qualities.length > 0) ? qualities : (hlsQualities.length > 0 ? hlsQualities : [{ label: 'تلقائي (اتصال معزز)', quality: currentQuality || 'Auto', url: '' }])).map((q, idx) => (
                         <button 
                           key={idx}
                           onClick={() => handleQualitySelect(idx)}
                           className={`flex items-center justify-between w-full p-2.5 rounded-xl transition-all cursor-pointer ${
                             activeQualityIndex === idx 
                               ? 'bg-amber-500/20 text-amber-500 font-extrabold' 
                               : 'text-gray-400 hover:bg-white/5'
                           }`}
                         >
                           <span className="text-[10px] font-black uppercase text-amber-500">{q.quality}</span>
                           <span className="text-xs truncate">{q.label}</span>
                         </button>
                       ))}
                    </div>
                 </motion.div>
               )}

               {/* LIVE STATISTICS SUBMENU */}
               {activeMenu === 'stats' && (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    <button 
                      onClick={() => setActiveMenu('main')}
                      className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 hover:text-white w-full pb-2 border-b border-white/5 text-right cursor-pointer"
                    >
                       <ChevronLeft size={14} className="rotate-180" />
                       <span>العودة للقائمة</span>
                    </button>
                    <div className="text-right space-y-2 select-none">
                       <div className="flex justify-between text-xs py-1 border-b border-white/5">
                         <span className="text-amber-500 text-[11px] font-mono">{stats.bitrate}</span>
                         <span className="text-gray-400 font-bold">معدل البت الفعلي</span>
                       </div>
                       <div className="flex justify-between text-xs py-1 border-b border-white/5">
                         <span className="text-white text-[11px] font-mono">{stats.fps} FPS</span>
                         <span className="text-gray-400 font-bold">تردد الإطارات</span>
                       </div>
                       <div className="flex justify-between text-xs py-1 border-b border-white/5">
                         <span className="text-rose-400 text-[11px] font-mono">{stats.dropped} frames</span>
                         <span className="text-gray-400 font-bold">الإطارات الساقطة</span>
                       </div>
                       <div className="flex justify-between text-xs py-1 border-b border-white/5">
                         <span className="text-cyan-400 text-[11px] font-mono">{stats.bufferLength} ثانية</span>
                         <span className="text-gray-400 font-bold">مدة تخزين البث</span>
                       </div>
                       <div className="flex justify-between text-xs pt-1">
                         <span className="text-emerald-400 text-[10px] font-sans font-black">{stats.latency}</span>
                         <span className="text-gray-400 font-bold">زمن الاستجابة</span>
                       </div>
                    </div>
                 </motion.div>
               )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Theater mode button */}
      {onToggleTheater && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onToggleTheater();
          }}
          className={`p-2.5 rounded-xl border transition-all cursor-pointer hidden md:flex ${
            isTheaterMode 
              ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' 
              : 'bg-white/5 border-white/5 hover:bg-white/10 text-white'
          }`}
          title={isTheaterMode ? "الوضع الطبيعي" : "شاشة المسرح العريضة"}
        >
          <Monitor size={16} />
        </button>
      )}

      <button 
        onClick={() => handleFullscreen()}
        className="bg-white/5 border border-white/5 hover:bg-white/10 p-2.5 text-white rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
        title="ملأ الشاشة كاملاً"
      >
        {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
      </button>
    </div>
  );
};
